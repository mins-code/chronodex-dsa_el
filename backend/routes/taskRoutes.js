const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { createTask, completeTask, deleteTask, undoDelete, clearAllTasks, getTasks, updateTask } = require('../controllers/taskController');
const { taskTrie, taskQueue } = require('../state');
const authMiddleware = require('../middleware/authMiddleware');

console.log('[DEBUG] taskRoutes.js is being evaluated/loaded');

// GET /distribution - Return task counts grouped by date (protected)
router.get('/distribution', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + days);

    // Fetch all tasks for this user within the date range
    const tasks = await Task.find({
      userId: req.userId,
      deadline: {
        $gte: now,
        $lt: endDate
      }
    });

    // Group tasks by date
    // Group tasks by date
    const distribution = {};

    for (let i = 0; i < days; i++) {
      // Use local time construction to match user's perspective
      const currentDate = new Date();
      currentDate.setDate(now.getDate() + i);

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      distribution[dateKey] = {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
    }

    // Count tasks by date and priority
    tasks.forEach(task => {
      if (!task.deadline) return;

      const taskDate = new Date(task.deadline);
      if (isNaN(taskDate.getTime())) return;

      const year = taskDate.getFullYear();
      const month = String(taskDate.getMonth() + 1).padStart(2, '0');
      const day = String(taskDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      if (distribution[dateKey]) {
        distribution[dateKey].total++;
        const priority = (task.priority || 'Low').toLowerCase();
        if (distribution[dateKey][priority] !== undefined) {
          distribution[dateKey][priority]++;
        }
      }
    });

    res.status(200).json(distribution);
  } catch (error) {
    console.error('Error fetching task distribution:', error);
    res.status(500).json({ error: 'An error occurred while fetching task distribution.' });
  }
});

// GET /priority - Return tasks in the order provided by the PriorityQueue (protected)
router.get('/priority', authMiddleware, async (req, res) => {
  console.log('GET /priority route hit');
  try {
    // Check if the taskQueue is empty
    if (taskQueue.heap.length === 0) {
      return res.status(200).json([]);
    }

    const tasksInPriorityOrder = [];
    const tempQueue = [...taskQueue.heap]; // Create a temporary copy of the heap

    // Sort the temporary queue by priorityScore (ascending for min heap - lowest = most urgent)
    tempQueue.sort((a, b) => a.priorityScore - b.priorityScore);

    // Iterate through the sorted temporary queue
    while (tempQueue.length > 0) {
      const node = tempQueue.shift(); // Remove the first element
      if (!node || !node.taskId) continue; // Null check before destructuring

      const task = await Task.findById(node.taskId);
      // Only include the task if it exists AND is not completed
      if (task && task.status !== 'completed') {
        tasksInPriorityOrder.push(task);
      }
    }

    // Fetch completed tasks from MongoDB to append at the end
    const completedTasks = await Task.find({
      userId: req.userId,
      status: 'completed'
    }).sort({ updatedAt: -1 }); // Optional: sort completed by most recently updated

    // Combine: Pending (Priority Order) + Completed
    const finalTaskList = [...tasksInPriorityOrder, ...completedTasks];

    res.status(200).json(finalTaskList);
  } catch (error) {
    console.error('Error fetching tasks by priority:', error);
    res.status(500).json({ error: 'An error occurred while fetching tasks by priority.' });
  }
});

// GET /search?q= - Search for tasks using the Trie (protected)
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    // Use taskTrie to search for matching task IDs
    const matchingTaskIds = taskTrie.search(query);

    // Fetch full task details from MongoDB
    const matchingTasks = await Task.find({ _id: { $in: matchingTaskIds } });

    res.status(200).json(matchingTasks);
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ error: 'An error occurred while searching for tasks.' });
  }
});

// POST / - Create a new task (protected)
router.post('/', authMiddleware, createTask);

// PATCH /:taskId/complete - Mark a task as completed (protected)
router.patch('/:taskId/complete', authMiddleware, completeTask);

// DELETE /clear - Clear all tasks (protected)
// MOVE THIS BEFORE /:taskId to avoid shadowing
router.delete('/clear', authMiddleware, clearAllTasks);

// DELETE /:taskId - Delete a task (protected)
router.delete('/:taskId', authMiddleware, deleteTask);

// POST /undo - Undo the last deleted task (protected)
router.post('/undo', authMiddleware, undoDelete);

// GET / - Fetch all tasks for the authenticated user (protected)
router.get('/', authMiddleware, getTasks);

// GET /:taskId - Fetch a single task by ID
router.get('/:taskId', async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'An error occurred while fetching the task.' });
  }
});

// PUT /:taskId - Update a task (protected)
router.put('/:taskId', authMiddleware, updateTask);

// PATCH /:taskId - Update task (including status) - uses updateTask controller
router.patch('/:taskId', authMiddleware, updateTask);

module.exports = router;