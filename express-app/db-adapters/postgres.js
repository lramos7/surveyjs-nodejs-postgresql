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

function PostgresStorage () {
  function queryExecutorFunction() {
    if(!!process.env.DATABASE_LOG) {
      console.log(arguments[0]);
      console.log(arguments[1]);
    }
    return pool.query.apply(pool, arguments);
  }
  const dbQueryAdapter = new SqlCrudAdapter(queryExecutorFunction);

  // **** CÓDIGO NOVO ADICIONADO AQUI ****
  // Cria as tabelas se elas não existirem.
  // A sintaxe IF NOT EXISTS garante que isso só aconteça na primeira vez.
  queryExecutorFunction("CREATE TABLE IF NOT EXISTS surveys (id varchar(255) PRIMARY KEY, name varchar(255), json json)", []);
  queryExecutorFunction("CREATE TABLE IF NOT EXISTS results (id serial PRIMARY KEY, postid varchar(255), json json)", []);
  // *************************************

  return new SurveyStorage(dbQueryAdapter);
}

module.exports = PostgresStorage;
