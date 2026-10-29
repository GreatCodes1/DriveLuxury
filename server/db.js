import pkg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pkg

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is missing")
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

export default pool

// import pkg from "pg"
// const {Pool} = pkg;
// import dotenv from "dotenv"
// dotenv.config();

// const pool = new Pool({
//   user: process.env.PGUSER,
//   password: process.env.PGPASSWORD,
//   host: process.env.PGHOST,
//   port: process.env.PGPORT,
//   database: process.env.PGDATABASE,
// });

// export default pool