import express from "express";
import fetch from "node-fetch";

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/monster/:id", async (req, res) => {
  try {
    const response = await fetch(`https://ragnapi.com/api/v1/old-times/monsters/${req.params.id}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar monstro" });
  }
});

app.listen(3000, () => console.log("Proxy rodando em http://localhost:3000"));
