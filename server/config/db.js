const { config } = require("dotenv");
const { Pool } = require("pg");
require("dotenv").config();
config();


const pool = new Pool({


//     user: "postgres",
//   password: "12345",
//   database: "Task1",
//   host: "localhost",
//   port: 5432

    connectionString: "postgresql://task1_dcz3_user:dboOBio31s8eysCBYT4MONJoPAbLH4KD@dpg-d52fibffte5s73d4u1c0-a.singapore-postgres.render.com/task1_dcz3" + "?sslmode=require",
    // ssl: {
    //   rejectUnauthorized: require  // This allows the connection without certificate validation
    // }
  });
pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => {
    console.error("Error connecting to PostgreSQL:", err.message);
    process.exit(1);
  });

  module.exports = pool;
