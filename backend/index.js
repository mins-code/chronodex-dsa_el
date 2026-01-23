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
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json());



// Import and use routes
console.log('Registering taskRouter at /api/tasks');
const taskRouter = require('./routes/taskRoutes');
const authRouter = require('./routes/authRoutes');

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use('/api/tasks', taskRouter);
app.use('/api/auth', authRouter);

// A simple route to test if the server is working
app.get('/', (req, res) => {
  res.send('ChronoDeX Server is running!');
});

// Connect to MongoDB using the URI from your .env file
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri)
  .then(async () => {
    console.log('MongoDB database connection established successfully');
    
    // Initialize data structures after DB connection
    await initializeState();

    // Set port and start listening
    const PORT = 5001; // HARDCODED FORCE CHANGE
    app.listen(PORT, () => {
      console.log(`[ANTIGRAVITY] Server LOADED. Running on port: ${PORT}`);
    });
  })
  .catch((err) => console.log('MongoDB connection error:', err));