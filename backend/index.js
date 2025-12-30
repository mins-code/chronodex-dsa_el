const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import utility instances from state.js
const { taskQueue, taskTrie, dependencyGraph, intervalScheduler } = require('./state');

// Import the PriorityQueue Class (to access static methods)
const PriorityQueue = require('./utils/PriorityQueue');

// Import the Task model
const Task = require('./models/Task');

// Initialize Express app
const app = express();

// Middleware: Updated CORS to explicitly allow your Vite frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Function to initialize data structures with tasks from MongoDB
const initializeDataStructures = async () => {
  try {
    const tasks = await Task.find(); // Fetch all tasks from MongoDB

    tasks.forEach((task) => {
      const { _id, title, deadline, priority, prerequisites, duration } = task;

      // Populate the Trie with task titles
      taskTrie.insert(title, _id);

      // Populate the PriorityQueue with task priority scores
      const priorityScore = PriorityQueue.calculateScore(deadline, priority);
      taskQueue.insert({ taskId: _id, priorityScore });

      // Populate the DependencyGraph with task prerequisites
      dependencyGraph.addTask(_id);
      if (prerequisites) {
        prerequisites.forEach((prerequisiteId) => {
          dependencyGraph.addDependency(prerequisiteId, _id);
        });
      }

      // Populate the IntervalScheduler with task intervals
      if (deadline && duration) {
        const startTime = new Date(deadline).getTime() - duration * 60 * 1000;
        const endTime = new Date(deadline).getTime();
        intervalScheduler.addInterval(startTime, endTime, _id);
      }
    });

    // Merge intervals in the IntervalScheduler
    intervalScheduler.mergeIntervals();

    console.log('Data structures initialized successfully.');
  } catch (err) {
    console.error('Error initializing data structures:', err);
  }
};

// Connect to MongoDB using the URI from your .env file
const uri = process.env.MONGODB_URI;
mongoose
  .connect(uri)
  .then(() => {
    console.log('MongoDB database connection established successfully');
    initializeDataStructures(); // Initialize data structures after DB connection
  })
  .catch((err) => console.log('MongoDB connection error:', err));

// Import and use routes
const taskRouter = require('./routes/taskRoutes');
const authRouter = require('./routes/authRoutes');

app.use('/api/tasks', taskRouter);
app.use('/api/auth', authRouter);

// A simple route to test if the server is working
app.get('/', (req, res) => {
  res.send('ChronoDeX Server is running!');
});

// Set port and start listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});