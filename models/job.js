"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
        [
          title,
          salary,
          equity,
          companyHandle,
        ],
    );
    const job = result.rows[0];
    return job;
  }

  /** Find all jobs.
   * Allow user to filter based only on title, minSalary, hasEquity (boolean)
   * Returns [{ id, title, salary, equity, company_handle}, ...]
   * */

  static async findAll(filterQuery) {
    let query = `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle
                  FROM jobs`

    // map the request parameters to appropriate SQL filters
    const allowedFilters = {
        'title':'LOWER(title) LIKE ', 
        'minSalary':'salary>=', 
        'hasEquity':'equity>'
   }
    
   // if user passed in a query string, append these to the main query
    if (filterQuery){
      let counter = 0;
      for (const key in filterQuery){
        // need to add the where clause only once
        if (counter == 0){
          // lowercase any title filters so that it is case insensitive. format correctly for like
            filterQuery[key] = key == 'title' ? `%${filterQuery[key].toLowerCase()}%`: filterQuery[key];
            query = `${query} WHERE ${allowedFilters[key]}'${filterQuery[key]}'`
            counter += 1;
        } else {
          query = `${query} AND ${allowedFilters[key]}'${filterQuery[key]}'`
        }
      }
    }
    query = `${query} ORDER BY title`;

    const jobRes = await db.query(query);
    return jobRes.rows;
  }

  /** Given a job id, return data about the job.
   *
   * Returns  { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salay, equity}, but not id, company_handle
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle",
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}


module.exports = Job;
