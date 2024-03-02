const MySQL = require("mysql2");
require("dotenv").config();

const util = require("util"); //promisify

//create connection to database
const db_con = MySQL.createPool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,

  database: process.env.DATABASE_NAME,

  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  idleTimeout: 60000,
  
});


// Test the connection
db_con.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to database: " + err);
    return;
  } else {
    console.log("Connected to database");
    connection.release();
  }
});

//promisify the query for use with async/await
const dbQueryPromise = util.promisify(db_con.query).bind(db_con); //promisify db_con.query

//export connection
module.exports = dbQueryPromise;
