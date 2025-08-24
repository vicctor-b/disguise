import express from "express";
import sqlite3 from "sqlite3";
import http from "http";
import { open } from "sqlite";
import Mob from "./mob.js";
import { WebSocketServer, WebSocket } from "ws";
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
let remainingTime = 30;
let selectedMob = new Mob();
const clients = new Map(); // Mudado para Map para associar ID com websocket
let currentAttempts = [];
let scoreboard = new Map();
let mobHistory = [];
let currentMobSolved = false;
let currentMobStartTime = Date.now();

const dbPromise = open({
  filename: "./database.db",
  driver: sqlite3.Database
}).then(async (db) => {
  await db.exec("PRAGMA encoding = 'UTF-8';"); // force UTF-8
  return db;
});

function broadcastGameStatus() {

  const gameStatus = {
    type: 'gameStatus',
    currentMob: { id: selectedMob.ID, name: currentMobSolved ? selectedMob.iName : '???' },
    remainingTime,
    currentMobSolved,
    solverName: currentMobSolved ? (clients.get(currentAttempts.find(attempt => attempt.success)?.userId)?.playerName || 'Unknown') : null,
    attempts: currentAttempts.map(attempt => ({
      ...attempt,
      playerName: clients.get(attempt.userId)?.playerName || attempt.userId
    })),
    scoreboard: Array.from(scoreboard),
    mobHistory: mobHistory.map(hist => ({
      ...hist,
      attempts: hist.attempts.map(attempt => ({
        ...attempt,
        playerName: clients.get(attempt.userId)?.playerName || attempt.userId
      }))
    })),
  };
  
  const message = JSON.stringify(gameStatus);
  clients.forEach(({ws}) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

function addAttempt(userId, attempt, success) {
  currentAttempts.push({
    userId,
    attempt,
    success,
    ignored: currentMobSolved,
    timestamp: Date.now()
  });
}

function updateMobHistory(status, solverId = null) {
  mobHistory.push({
    mobId: selectedMob.ID,
    mobName: selectedMob.iName,
    status,
    solverId,
    solverName: solverId ? (clients.get(solverId)?.playerName || 'Unknown') : null,
    startTime: currentMobStartTime,
    endTime: Date.now(),
    attempts: currentAttempts
  });
  
  // Manter apenas os últimos 10 mobs no histórico
  if (mobHistory.length > 10) {
    mobHistory.shift();
  }
}

function updateScore(userId) {
  const userName = clients.get(userId)?.playerName || 'Unknown';
  const currentScore = scoreboard.get(userName) || 0;
  scoreboard.set(userName, currentScore + 1);
}

wss.on("connection", (ws, req) => {
  // Pega o nome do parâmetro da URL ou usa timestamp como fallback
  const url = new URL(req.url, 'ws://localhost');
  const playerName = url.searchParams.get('name') || `Player${Date.now()}`;
  const userId = Date.now().toString(); // ID único interno
  
  console.log(`[Connection] Novo jogador conectado - Nome: ${playerName} (ID: ${userId})`);
  ws.send(JSON.stringify({ type: 'connected', userId, playerName }));
  
  // Guarda tanto o websocket quanto o nome do jogador
  clients.set(userId, { ws, playerName });

  console.log(`[Status] Total de jogadores conectados: ${clients.size}`);
  // Envia o status atual do jogo para o novo client
  broadcastGameStatus();

  ws.on("message", (data) => {

    const message = data.toString();
    // Função para normalizar strings (remove acentos, caracteres especiais e converte para minúsculas)
    const normalizeString = (str) => {
      return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, ''); // Remove caracteres especiais
    };
    
    const isCorrect = normalizeString(message) === normalizeString(selectedMob.iName);
    const playerName = clients.get(userId).playerName;
    
    console.log(`[Tentativa] ${playerName} tentou: "${message}" - ${isCorrect ? 'ACERTOU!' : 'Errou'}`);
    addAttempt(userId, message, isCorrect);

    if (!currentMobSolved && isCorrect) {
      currentMobSolved = true;
      remainingTime = 6; // Define 6 segundos para mostrar a resposta
      updateScore(userId);
      const newScore = scoreboard.get(userId);
      console.log(`[Score] ${playerName} ganhou 1 ponto! Total: ${newScore}`);
      
      updateMobHistory('solved', userId);
    }

    // Atualiza todos os clients sobre a nova tentativa
    broadcastGameStatus();
  });

  ws.on("close", () => {
    const playerName = clients.get(userId)?.playerName;
    clients.delete(userId);
    console.log(`[Connection] ${playerName} desconectou (ID: ${userId})`);
    console.log(`[Status] Total de jogadores conectados: ${clients.size}`);
  });
});

function countdown() {
  remainingTime--;
  
  // Log a cada 5 segundos ou quando faltar 5 segundos ou menos
  if (remainingTime <= 5 || remainingTime % 5 === 0) {
    console.log(`[Tempo] Restante: ${remainingTime}s`);
  }
  
  broadcastGameStatus();
  
  if (remainingTime <= 0) {
    if (!currentMobSolved) {
      console.log(`[Timeout] Ninguém descobriu! Era: ${selectedMob.iName}`);
      updateMobHistory('timeout');
    }
    getNextMob();
  }
}

async function getNextMob() {
  const db = await dbPromise;
  remainingTime = 30;
  currentMobSolved = false;
  currentAttempts = [];
  currentMobStartTime = Date.now();
  
  try {
    const result = await db.get("SELECT * FROM mob_db ORDER BY RANDOM() LIMIT 1;");
    selectedMob = new Mob(result);
    console.log(`[Novo Mob] ID: ${selectedMob.ID}, Nome: ${selectedMob.iName}`);
    console.log(`[Status] Tentativas anteriores: ${currentAttempts.length}, Histórico: ${mobHistory.length} mobs`);
    broadcastGameStatus();
  } catch (err) {
    console.error("[NextMob] Error:", err);
  }
}

// Inicialização
getNextMob();

// Timer para countdown
setInterval(countdown, 1000);

// Usar a porta do ambiente ou 3000 como fallback
const PORT = process.env.PORT || 3000;

// Usar o servidor HTTP que tem o WebSocket vinculado
server.listen(PORT, () => {
  console.log(`[Server] HTTP e WebSocket rodando na porta ${PORT}`);
  console.log(`[WebSocket] Endpoint: ws://localhost:${PORT}`);
});

