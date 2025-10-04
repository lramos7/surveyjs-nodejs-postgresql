const fs = require("fs");
const SqlCrudAdapter = require("./sql-crud-adapter");
const SurveyStorage = require("./survey-storage");

const readFileSync = filename => fs.readFileSync(filename).toString("utf8");

const dbConfig = {
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_DB,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD
};

const Pool = require('pg').Pool
const pool = new Pool(dbConfig);

async function PostgresStorage() {
  function queryExecutorFunction(query, values) {
    if (!!process.env.DATABASE_LOG) {
      console.log(query);
      console.log(values);
    }
    // Retorna a Promise da query
    return pool.query(query, values);
  }
  const dbQueryAdapter = new SqlCrudAdapter(queryExecutorFunction);

  // **** LÓGICA DE INICIALIZAÇÃO CORRIGIDA ****
  try {
    console.log("Creating tables if they do not exist...");
    await queryExecutorFunction("CREATE TABLE IF NOT EXISTS surveys (id varchar(255) PRIMARY KEY, name varchar(255), json json)", []);
    await queryExecutorFunction("CREATE TABLE IF NOT EXISTS results (id serial PRIMARY KEY, postid varchar(255), json json)", []);
    console.log("Tables created successfully or already exist.");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error; // Trava a aplicação se a criação das tabelas falhar
  }
  // *************************************

  return new SurveyStorage(dbQueryAdapter);
}

module.exports = PostgresStorage;