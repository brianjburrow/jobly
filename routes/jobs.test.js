"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token, 
  u4Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New",
    salary: 1000,
    equity: 0,
    companyHandle: "c1",
  };

  test("fail for non-admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("ok for admin users", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id : resp.body.job.id,
        title: "New",
        salary: 1000,
        equity: "0",
        company_handle: "c1",
      },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          salary: 1000,
          equity: "0.0",
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title:"software engineer",
          company_handle:"c1",
          equity:-1
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {

  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: resp.body.jobs[0].id,
                title: 'junior data analyst',
                salary: 100000,
                equity:"0",
                company_handle:'c2'
            },
            {
                id: resp.body.jobs[1].id,
                title: 'junior software engineer',
                salary: 100000,
                equity:"0",
                company_handle:'c1'
            },
            {
                id: resp.body.jobs[2].id,
                title: 'senior software engineer',
                salary: 200000,
                equity:"0.5",
                company_handle:'c1'
            },
          ],
    });
  });

  test("ok for anon, filter by title", async function () {
    const resp = await request(app).get("/jobs?title=software");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: resp.body.jobs[0].id,
                title: 'junior software engineer',
                salary: 100000,
                equity: "0",
                company_handle:'c1'
            },
            {
                id: resp.body.jobs[1].id,
                title: 'senior software engineer',
                salary: 200000,
                equity: "0.5",
                company_handle:'c1'
            },
          ],
    });
  });

  test("ok for anon, filter by minSalary", async function () {
    const resp = await request(app).get("/jobs?minSalary=150000");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: resp.body.jobs[0].id,
                title: 'senior software engineer',
                salary: 200000,
                equity: "0.5",
                company_handle:'c1'
            },
          ],
    });
  });

  test("ok for anon, filter by hasEquity=true", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.body).toEqual({
      jobs:
          [
            {
                id: resp.body.jobs[0].id,
                title: 'senior software engineer',
                salary: 200000,
                equity: "0.5",
                company_handle:'c1'
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {

  test("works for anon", async function () {
    const {body:jobs} = await request(app).get("/jobs");
    const resp = await request(app).get(`/jobs/${jobs.jobs[0].id}`);
    expect(resp.body).toEqual({
      job: {
        id: jobs.jobs[0].id,
        title: 'junior data analyst',
        salary: 100000,
        equity:"0",
        company_handle:'c2'
    },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});




  test("fail for non-admin users", async function () {
    const newJob = {
        title: "New",
        salary: 1000,
        equity: 0,
        companyHandle: "c1",
    };
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
/************************************** PATCH /jobs/:handle */


describe("PATCH /jobs/:id", function () {


  test("works for admin users", async function () {
    const {body:jobs} = await request(app).get("/jobs");

    const resp = await request(app)
        .patch(`/jobs/${jobs.jobs[0].id}`)
        .send({
          salary: 1,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobs.jobs[0].id,
        title: 'junior data analyst',
        salary: 1,
        equity: "0",
        company_handle:'c2'
    },
    });
  });

  test("unauth for anon", async function () {
    const {body:jobs} = await request(app).get("/jobs");
    const resp = await request(app)
        .patch(`/jobs/${jobs.jobs[0].id}`)
        .send({
          salary: 1,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          salary: 1,
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const {body:jobs} = await request(app).get("/jobs");
    const resp = await request(app)
        .patch(`/jobs/${jobs.jobs[0].id}`)
        .send({
          id:0
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const {body:jobs} = await request(app).get("/jobs");
    const resp = await request(app)
        .patch(`/jobs/${jobs.jobs[0].id}`)
        .send({
          salary:-10
        })
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    const {body:jobs} = await request(app).get("/jobs");
    const resp = await request(app)
        .delete(`/jobs/${jobs.jobs[0].id}`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({ deleted: `${jobs.jobs[0].id}` });
  });

  test("unauth for non-admin users", async function () {
    const {body:jobs} = await request(app).get("/jobs");
    const resp = await request(app)
        .delete(`/jobs/${jobs.jobs[0].id}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const {body:jobs} = await request(app).get("/jobs");
    const resp = await request(app)
        .delete(`/jobs/${jobs.jobs[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
