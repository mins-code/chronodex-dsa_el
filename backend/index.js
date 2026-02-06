const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import utility instances and initializer from state.js
const { taskQueue, taskTrie, dependencyGraph, intervalScheduler, initializeState } = require('./state');

// Initialize Express app
const app = express();

// Middleware: Updated CORS to explicitly allow your Vite frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Allow multiple Vite ports
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json());



// Import and use routes
console.log('Registering taskRouter at /api/tasks');
const taskRouter = require('./routes/taskRoutes');
const authRouter = require('./routes/authRoutes');
const notificationRouter = require('./routes/notificationRoutes');

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use('/api/tasks', taskRouter);
app.use('/api/auth', authRouter);
app.use('/api/notifications', notificationRouter);

// A simple route to test if the server is working
app.get('/', (req, res) => {
  res.send('ChronoDeX Server is running!');
});

// Connect to MongoDB using the URI from your .env file
console.log('[DEBUG] Starting MongoDB connection...');
const uri = process.env.MONGODB_URI;
console.log('[DEBUG] MongoDB URI:', uri ? 'URI is set' : 'URI is MISSING');

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Force IPv4 to avoid some network issues
  })
  .then(async () => {
    console.log('[SUCCESS] MongoDB database connection established successfully');

    // Initialize data structures after DB connection
    console.log('[DEBUG] About to initialize state...');
    await initializeState();
    console.log('[DEBUG] State initialized successfully');

    // Set port and start listening
    const PORT = 5001; // HARDCODED FORCE CHANGE
    app.listen(PORT, () => {
      console.log(`[ANTIGRAVITY] Server LOADED. Running on port: ${PORT}`);
      console.log('[DEBUG] All routes should now be accessible');
    });
  })
  .catch((err) => {
    console.error('[ERROR] MongoDB connection error:', err);
    console.error('[ERROR] Stack trace:', err.stack);
  });