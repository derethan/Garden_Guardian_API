import * as MySQL from "mysql2";
import * as dotenv from "dotenv";
import * as util from "util";

dotenv.config();

const db_con = MySQL.createPool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT as string),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  idleTimeout: 60000,
});

db_con.getConnection((err: any, connection: MySQL.PoolConnection) => {
  if (err) {
    console.error("Error connecting to database: " + err.message);
    return;
  } else {
    console.log("Connected to database");
    connection.release();
  }
});

const dbQueryPromise = util.promisify(db_con.query).bind(db_con) as unknown as (sql: string, values?: any[]) => Promise<any>;

export default dbQueryPromise;