import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Update this to match your React app's URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  },
});

type Player = {
  id: string;
  name: string;
  color: string;
  wealth: number;
};

type Property = {
  id: number;
  name: string;
  price: number;
  owner: string | null; // Owner can be a player's name or null
  rent: number;
};

let players: Player[] = [];
let properties: Property[] = [
  { id: 1, name: 'Park Place', price: 350, owner: null, rent: 50 },
  { id: 2, name: 'Boardwalk', price: 400, owner: null, rent: 60 },
  // Add more properties here
];

let currentPlayer: Player | null = null;

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.emit('gameState', { players, properties, currentPlayer });

  // Handle player joining the game
  socket.on('joinGame', (playerData) => {
    const newPlayer = { 
      id: socket.id, name: playerData.name, color: playerData.color, wealth: 1500 };
    players.push(newPlayer);

    if (!currentPlayer) {
      currentPlayer = newPlayer;
    }

    // Notify all clients of updated game state
    io.emit('gameState', { players, properties, currentPlayer });
  });

  // Modify the newtTurn function
  const nextTurn = () => {
    const currentIndex = players.findIndex(p => p.id === currentPlayer?.id);
    const nextIndex = (currentIndex + 1) % players.length;
    currentPlayer = players[nextIndex];
    io.emit('gameState', { players, properties, currentPlayer});
  }

  // Handle dice roll
  socket.on('rollDice', (roll) => {
    io.emit('diceRolled', { playerId: socket.id, roll });
  });

  // Handle property purchase
  socket.on('buyProperty', (propertyId) => {
    const property = properties.find((p) => p.id === propertyId);
    const player = players.find((p) => p.id === socket.id);
    if (property && player && property.owner === null && player.wealth >= property.price) {
      property.owner = player.name;
      player.wealth -= property.price;
      io.emit('updateProperties', properties);
      io.emit('updatePlayers', players);
      nextTurn(); // Move to the next player's turn
    }
  });

  // Handle property selling
  socket.on('sellProperty', (propertyId) => {
    const property = properties.find((p) => p.id === propertyId);
    const player = players.find((p) => p.id === socket.id);
    if (property && player && property.owner === player.name) {
      property.owner = null; // Remove ownership
      player.wealth += property.price; // Refund the property price
      io.emit('updateProperties', properties);
      io.emit('updatePlayers', players);
      nextTurn(); // Move to the next player's turn
    }
  });

  // Handle paying rent
  socket.on('rentProperty', (propertyId) => {
    const property = properties.find((p) => p.id === propertyId);
    const tenant = players.find((p) => p.id === socket.id);
    const owner = players.find((p) => p.name === property?.owner);

    if (property && tenant && owner && tenant.wealth >= property.rent) {
      tenant.wealth -= property.rent; // Pay rent
      owner.wealth += property.rent; // Owner receives rent
      io.emit('updatePlayers', players); // Notify all players of updated wealth
      nextTurn(); // Move to the next player's turn
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    players = players.filter((p) => p.id !== socket.id);
    
    if (currentPlayer?.id === socket.id) {
      nextTurn();
    }

    io.emit('gameState', { players, properties, currentPlayer });
  });
});

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Monopoly Game Server</h1><p>Use a WebSocket client to connect!</p>');
});

// Start the server
server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
