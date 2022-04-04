"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
describe("create", function () {

    const newJob = {
      title: "new",
      salary: 100000,
      equity: 0.1,
      companyHandle: "c1",
    };
  
    test("works", async function () {
      let job = await Job.create(newJob);
      expect(job).toEqual({
        id: job.id,
        title: "new",
        salary: 100000,
        equity: "0.1",
        company_handle: "c1",
      });
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE id = ${job.id}`);
  
      expect(result.rows).toEqual([
        {
          id: job.id,
          title: "new",
          salary: 100000,
          equity: "0.1",
          company_handle: 'c1',
        },
      ]);
    });
  
  });
  
  /************************************** findAll */
  describe("findAll", function () {
    test("works: no filter", async function () {
      let jobs = await Job.findAll();
      expect(jobs).toEqual([{
          id: jobs[0].id,
          title: "data analyst",
          salary: 100000,
          equity: "0.0",
          company_handle: "c3",
        },
        {
          id: jobs[1].id,
          title: "senior software developer",
          salary: 200000,
          equity: "1.0",
          company_handle: "c2",
        },
        {
            id: jobs[2].id,
            title: "software developer",
            salary: 100000,
            equity: "1.0",
            company_handle: "c1",
        },
      ]);
    });
  
    test("works: filter by title", async function () {
      const filterQuery = {title: "software developer"}
      let jobs = await Job.findAll(filterQuery);
      expect(jobs).toEqual([
        {
          id: jobs[0].id,
          title: "senior software developer",
          salary: 200000,
          equity: "1.0",
          company_handle: "c2",
        },
        {
            id: jobs[1].id,
            title: "software developer",
            salary: 100000,
            equity: "1.0",
            company_handle: "c1",
        },
      ]);
    });
  
    test("works: filter by minSalary", async function () {
      const filterQuery = {minSalary: 150000};
      let jobs = await Job.findAll(filterQuery);
      expect(jobs).toEqual([
          {
              id: jobs[0].id,
              title: "senior software developer",
              salary: 200000,
              equity: "1.0",
              company_handle: "c2",
          },
      ]);
    });
  
    test("works: filter by title and minSalary", async function () {
      const filterQuery = {title: "software developer", minSalary: 150000}
      let jobs = await Job.findAll(filterQuery);
      expect(jobs).toEqual([
          {
              id: jobs[0].id,
              title: "senior software developer",
              salary: 200000,
              equity: "1.0",
              company_handle: "c2",
          },
      ]);
    });
  
  });
  
  /************************************** get */
  
  describe("get", function () {
    test("works", async function () {
    let newJob = {
        title: "new",
        salary: 100000,
        equity: 0.1,
        companyHandle: "c1",
        };
    newJob = await Job.create(newJob);
      let job = await Job.get(newJob.id);
      expect(job).toEqual({
          id: newJob.id,
          title: "new",
          salary: 100000,
          equity: "0.1",
          company_handle: "c1",
        });
    });
  
    test("not found if no such Job", async function () {
      try {
        await Job.get(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });
  
  /************************************** update */
  
  describe("update", function () {


  
    test("works", async function () {
        let newJob = {
            title: "new",
            salary: 100000,
            equity: 0.1,
            companyHandle: "c1",
            };
        
        newJob = await Job.create(newJob);
        const updateData = {
            id: newJob.id,
            title: "junior software developer",
            salary: 1,
            equity: "0.0",
            company_handle: "c1"
          };
    
      let job = await Job.update(newJob.id, updateData);
      expect(job).toEqual(updateData);
  
      const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE id = ${newJob.id}`);
  
      expect(result.rows).toEqual([updateData]);
    });
  
    test("works: null fields", async function () {

        let newJob = {
            title: "new",
            salary: 100000,
            equity: 0.1,
            companyHandle: "c1",
            };
        newJob = await Job.create(newJob);

      const updateDataSetNulls = {
        title: "junior software developer",
        salary: null,
        equity: null,
        company_handle: 'c1',
      };
  
      let jobs = await Job.update(newJob.id, updateDataSetNulls);
      expect(jobs).toEqual({id:newJob.id, ...updateDataSetNulls});
  
      const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${newJob.id}`);
      expect(result.rows).toEqual([{id:newJob.id, ...updateDataSetNulls}]);
    });
  
    test("not found if no such job", async function () {
      try {
        await Job.update(0, {
            title: "new",
            salary: 100000,
            equity: 0.1,
            companyHandle: "c1",
            });
        fail();
      } catch (err) {
          console.log(err)
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  
    test("bad request with no data", async function () {
      try {
        let newJob = {
            title: "new",
            salary: 100000,
            equity: 0.1,
            companyHandle: "c1",
            };
        newJob = await Job.create(newJob);

        const updateDataSetNulls = {
            title: "junior software developer",
            salary: null,
            equity: null,
            company_handle: 'c1',
        };

        await Job.update(1, {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });
  });
  
  /************************************** remove */
  
  describe("remove", function () {
    test("works", async function () {
      let newJob = {
                title: "new",
                salary: 100000,
                equity: 0.1,
                companyHandle: "c1",
            };
      newJob = await Job.create(newJob);

      await Job.remove(newJob.id);
      const res = await db.query(
          "SELECT id FROM jobs WHERE id=1");
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such job", async function () {
      try {
        await Job.remove(0);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });
  