const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const PostgresSurveyStorage = require("./db-adapters/postgres");
const apiBaseAddress = "/api";
const cors = require('cors');

// Crie uma variável para armazenar o nosso objeto de acesso ao banco.
// Ela será inicializada uma única vez.
let storage;

const app = express();

app.use(cors({
    origin: 'https://forms.cortix.info'
}));

app.use(
  session({
    secret: "mysecret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Esta função não é mais necessária, pois o 'storage' agora é global.
/* function getStorage (req) {
  const storage = new PostgresSurveyStorage(req.session);
  return storage;
} */

function sendJsonResult (res, obj) {
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(obj));
}

// ---- ROTAS DA API ----
// Todas as rotas agora usam a variável 'storage' que foi inicializada no início.

app.get(apiBaseAddress + "/getActive", (req, res) => {
  storage.getSurveys((result) => {
    sendJsonResult(res, result);
  });
});

app.get(apiBaseAddress + "/getSurvey", (req, res) => {
  const surveyId = req.query["surveyId"];
  storage.getSurvey(surveyId, (result) => {
    sendJsonResult(res, result);
  });
});

app.get(apiBaseAddress + "/changeName", (req, res) => {
  const id = req.query["id"];
  const name = req.query["name"];
  storage.changeName(id, name, (result) => {
    sendJsonResult(res, result);
  });
});

app.get(apiBaseAddress + "/create", (req, res) => {
  const name = req.query["name"];
  storage.addSurvey(name, (survey) => {
    sendJsonResult(res, survey);
  });
});

app.post(apiBaseAddress + "/changeJson", (req, res) => {
  const id = req.body.id;
  const json = req.body.json;
  storage.storeSurvey(id, null, json, (survey) => {
    sendJsonResult(res, survey);
  });
});

app.post(apiBaseAddress + "/post", (req, res) => {
  const postId = req.body.postId;
  const surveyResult = req.body.surveyResult;
  storage.postResults(postId, surveyResult, (result) => {
    // A resposta do postResults já é o JSON, não precisa de .json
    sendJsonResult(res, result);
  });
});

app.get(apiBaseAddress + "/delete", (req, res) => {
  const id = req.query["id"];
  storage.deleteSurvey(id, () => {
    sendJsonResult(res, { id: id });
  });
});

app.get(apiBaseAddress + "/results", (req, res) => {
  const postId = req.query["postId"];
  storage.getResults(postId, (result) => {
    sendJsonResult(res, result);
  });
});

// ---- ROTAS ESTÁTICAS ----
app.get(["/", "/about", "/run/*", "/edit/*", "/results/*"], (_, res) => {
  res.sendFile("index.html", { root: __dirname + "/../public" });
});

app.use(express.static(__dirname + "/../public"));

// ---- INICIALIZAÇÃO DO SERVIDOR ----
// Criamos uma função async para poder usar 'await'.
async function startServer() {
  try {
    // 1. CHAMA A FUNÇÃO ASYNC E ESPERA ELA TERMINAR
    console.log("Initializing storage and connecting to database...");
    storage = await PostgresSurveyStorage();
    console.log("Storage initialized successfully.");

    // 2. SÓ DEPOIS QUE O BANCO ESTÁ PRONTO, O SERVIDOR COMEÇA A OUVIR
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log("Server is listening on port: " + port + "...");
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1); // Encerra a aplicação se não conseguir conectar ao banco
  }
}

// Inicia o servidor
startServer();