const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/*
parameters
----------
dataToUpdate:
  The request body of an API call as an object containing key value pairs, where the 
  value is the value to be updated in the database, and the key corresponds to the column 
  name in the database.  IF the column name in the request body is not the same as the column
  name in the database, then jsToSql should specify a mapping from the request body keys to the
  column names in the database.

jsToSql:
  An object containing key value pairs, where value is the name of a column in the sql database
  and the key name should be what is expected in the json body of the request.  

returns
-------
  An object containing two keys, setCols and values.  setCols value is a string containing
  the variables to set in an SQL query, formatted for node's pg module.   values is an array
  holding the actual values.  The combination can be used to form an SQL query such as
  UPDATE db.query(table_name SET {setCols} , values)
*/ 

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };