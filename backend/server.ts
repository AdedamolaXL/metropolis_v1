import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './socketHandler';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", //
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  },
});

setupSocketHandlers(io);
app.get('/', (req, res) => {
  res.send('<h1>Welcome to the Monopoly Game Server</h1><p>Use a WebSocket client to connect!</p>');
});

// Start the server
server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
