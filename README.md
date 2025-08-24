# Quiz de Monstros - Ragnarok

Um jogo multiplayer em tempo real onde os jogadores tentam adivinhar o nome de monstros do Ragnarok Online.

## 🎮 Como Jogar

1. Acesse o jogo em [disguise-front.onrender.com](https://disguise-front.onrender.com)
2. Digite seu nome na tela de login
3. Você verá uma imagem de um monstro do Ragnarok
4. Digite o nome correto do monstro para ganhar pontos
5. Você tem 30 segundos para adivinhar cada monstro

## ✨ Funcionalidades

- 🎯 Sistema de pontuação em tempo real
- 📜 Histórico dos últimos 10 monstros
- ⌛ Timer com contagem regressiva
- 🏆 Placar com ranking dos jogadores
- ❌ Lista de tentativas erradas
- 🎨 Interface responsiva e moderna

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Node.js, Express
- **WebSocket**: ws (para comunicação em tempo real)
- **Banco de Dados**: SQLite3
- **Deploy**: Render.com

## 🚀 Estrutura do Projeto

```
├── database.db       # Banco de dados SQLite com informações dos monstros
├── dist/            # Arquivos estáticos
│   ├── index.html   # Página principal do jogo
│   └── login.html   # Página de login
├── server.js        # Servidor WebSocket e HTTP
├── mob.js           # Classe para gerenciamento dos monstros
└── Dockerfile       # Configuração para deploy
```

## 🔄 Fluxo do Jogo

1. Um monstro é selecionado aleatoriamente do banco de dados
2. Os jogadores têm 30 segundos para adivinhar o nome
3. Se alguém acertar:
   - Ganha 1 ponto
   - O nome do monstro é revelado
   - Após 6 segundos, um novo monstro é selecionado
4. Se ninguém acertar:
   - O nome do monstro é revelado
   - Um novo monstro é selecionado imediatamente

## 👥 Recursos Multiplayer

- Conexão em tempo real via WebSocket
- Atualizações instantâneas das tentativas de outros jogadores
- Sistema de pontuação global
- Histórico compartilhado de monstros

## 🚀 Desenvolvimento Local

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor:
```bash
npm start
```

O jogo estará disponível em `http://localhost:3000`
