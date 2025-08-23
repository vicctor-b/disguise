import express from "express";
import sqlite3 from "sqlite3";
import http from "http";
import { open } from "sqlite";
import Mob from "./mob.js";
import { WebSocketServer, WebSocket } from "ws";
import { count } from "console";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
let remainingTime = 30;
let selectedMob = new Mob();
const clients = new Set();

const dbPromise = open({
  filename: "./database.db",
  driver: sqlite3.Database
});

wss.on("connection", (ws) => {
  ws.send("[!] Connected to WSS");
  clients.add(ws);
  ws.on("message", (message) => {
    if(message === selectedMob.iName){
      for(client in clients){
        client.send(`{"answer": "${selectedMob.iName}"}`)
      }
    }
  });
});

function countdown(){
  remainingTime--;
}

async function getNextMob() {
  const db = await dbPromise;
  remainingTime = 30;
  try {
    const result = await db.get("SELECT * FROM mob_db ORDER BY RANDOM() LIMIT 1;")
    selectedMob = new Mob(result);
  } catch (err) {
    console.error("[Daily Job] Error:", err);
  }
}

getNextMob();
setInterval(()=> remainingTime > 0 ? countdown : getNextMob, 1000);

app.listen(3000, () => console.log("Server rodando em http://localhost:3000"));

