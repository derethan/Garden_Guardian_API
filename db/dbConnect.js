const MySQL = require("mysql2");
require("dotenv").config();

const util = require("util"); //promisify

//create connection to database
const db_con = MySQL.createConnection({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,

  database: process.env.DATABASE_NAME,

  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

try {
  db_con.connect((err) => {
    if (err) {
      console.error("Error connecting to database: " + err);
      return;
    } else {
      console.log("Connected to database");
    }
  });
} catch (err) {
  console.error("Error connecting to database: " + err);
}

const dbQueryPromise = util.promisify(db_con.query).bind(db_con); //promisify db_con.query

//export connection
module.exports = dbQueryPromise;
