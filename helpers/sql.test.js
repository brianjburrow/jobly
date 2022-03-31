const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError} = require("../expressError");
const db = require("../db.js");

afterAll(async ()=>{
  await db.end()
})

const fakeRequestBody = {
    colName1 : 1,
    colName2 : 3,
    colName3 : 'string'
}

const fakeJsToSql = {
    colName1 : 'col_1_db_name'
}


describe("call sqlForPartialUpdate", function () {
  test("returns correct data types for valid input", function () {

    const result = sqlForPartialUpdate(fakeRequestBody, fakeJsToSql)

    expect(result).toEqual({
      setCols: expect.any(String),
      values: expect.any(Array)
    });
  });

  test("returns correct data for valid input", function () {

    const result = sqlForPartialUpdate(fakeRequestBody, fakeJsToSql)

    expect(result).toEqual({
      setCols: '"col_1_db_name"=$1, "colName2"=$2, "colName3"=$3',
      values: [1, 3, 'string']
    });
  });

  test("returns correct data for valid input, but empty jsToSql", function () {

    const result = sqlForPartialUpdate(fakeRequestBody, {})

    expect(result).toEqual({
      setCols: '"colName1"=$1, "colName2"=$2, "colName3"=$3',
      values: [1, 3, 'string']
    });
  });

  test("throws an error for empty input", function () {
    try{
      const result = sqlForPartialUpdate({}, fakeJsToSql)
      fail()
    } catch (err){
      expect(err instanceof BadRequestError).toBeTruthy()
    }
  });
});

