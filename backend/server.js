import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Store connected users
const users = new Map();
const rooms = new Map();

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/users', (req, res) => {
  res.json({ 
    totalUsers: users.size,
    users: Array.from(users.values())
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user:join', (data) => {
    const { username, room } = data;
    
    if (!username || !room) {
      socket.emit('error', { message: 'Username and room are required' });
      return;
    }

    // Store user info
    users.set(socket.id, {
      id: socket.id,
      username,
      room,
      joinedAt: new Date()
    });

    // Join room
    socket.join(room);

    // Initialize room if it doesn't exist
    if (!rooms.has(room)) {
      rooms.set(room, []);
    }

    // Add user to room
    rooms.get(room).push({
      id: socket.id,
      username,
      joinedAt: new Date()
    });

    // Notify others in the room
    socket.to(room).emit('user:joined', {
      username,
      message: `${username} joined the chat`,
      timestamp: new Date()
    });

    // Send room info to the user
    socket.emit('room:info', {
      room,
      users: rooms.get(room).map(u => u.username),
      messages: rooms.get(room).slice(-50) // Last 50 messages
    });

    console.log(`${username} joined room: ${room}`);
  });

  // Handle sending messages
  socket.on('message:send', (data) => {
    const user = users.get(socket.id);
    
    if (!user) {
      socket.emit('error', { message: 'You must join a room first' });
      return;
    }

    const message = {
      id: `${socket.id}-${Date.now()}`,
      username: user.username,
      text: data.text,
      room: user.room,
      timestamp: new Date()
    };

    // Store message in room
    const roomMessages = rooms.get(user.room) || [];
    roomMessages.push(message);
    
    // Keep only last 100 messages per room
    if (roomMessages.length > 100) {
      roomMessages.shift();
    }
    rooms.set(user.room, roomMessages);

    // Broadcast to room
    io.to(user.room).emit('message:receive', message);
    
    console.log(`Message from ${user.username} in ${user.room}: ${data.text}`);
  });

  // Handle typing indicator
  socket.on('typing:start', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(user.room).emit('typing:start', {
        username: user.username
      });
    }
  });

  socket.on('typing:stop', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(user.room).emit('typing:stop', {
        username: user.username
      });
    }
  });

  // Handle user leaving
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    
    if (user) {
      const room = rooms.get(user.room);
      if (room) {
        // Remove user from room
        const index = room.findIndex(u => u.id === socket.id);
        if (index > -1) {
          room.splice(index, 1);
        }
        
        // Notify others
        socket.to(user.room).emit('user:left', {
          username: user.username,
          message: `${user.username} left the chat`,
          timestamp: new Date()
        });
      }

      users.delete(socket.id);
      console.log(`${user.username} disconnected`);
    } else {
      console.log(`User ${socket.id} disconnected`);
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
});

