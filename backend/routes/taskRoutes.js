const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { createTask, completeTask, deleteTask, undoDelete } = require('../controllers/taskController'); // Import undoDelete
const { taskTrie, taskQueue } = require('../state'); // Import data structure instances

// POST / - Create a new task
router.post('/', createTask);

// PATCH /:taskId/complete - Mark a task as completed
router.patch('/:taskId/complete', completeTask);

// DELETE /:taskId - Delete a task
router.delete('/:taskId', deleteTask);

// POST /undo - Undo the last deleted task
router.post('/undo', undoDelete);

// GET / - Fetch all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'An error occurred while fetching tasks.' });
  }
});

// GET /priority - Return tasks in the order provided by the PriorityQueue
router.get('/priority', async (req, res) => {
  try {
    // Check if the taskQueue is empty
    if (taskQueue.heap.length === 0) {
      return res.status(200).json({ message: 'No tasks in the priority queue.' });
    }

    const tasksInPriorityOrder = [];
    const tempQueue = [...taskQueue.heap]; // Create a temporary copy of the heap

    // Sort the temporary queue by priorityScore to preserve the original queue
    tempQueue.sort((a, b) => a.priorityScore - b.priorityScore);

    // Iterate through the sorted temporary queue
    while (tempQueue.length > 0) {
      const node = tempQueue.shift(); // Remove the first element
      if (!node || !node.taskId) continue; // Null check before destructuring

      const task = await Task.findById(node.taskId);
      if (task) tasksInPriorityOrder.push(task);
    }

    res.status(200).json(tasksInPriorityOrder);
  } catch (error) {
    console.error('Error fetching tasks by priority:', error);
    res.status(500).json({ error: 'An error occurred while fetching tasks by priority.' });
  }
});

// GET /search?q= - Search for tasks using the Trie
router.get('/search', async (req, res) => {
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

// PUT /:taskId - Update a task (for adding dependencies)
router.put('/:taskId', async (req, res) => {
  try {
    const { prerequisites } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { prerequisites },
      { new: true }
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// PATCH /:taskId - Update task status
router.patch('/:taskId', async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['to-do', 'in-progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be to-do, in-progress, or completed.' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { status },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status.' });
  }
});

module.exports = router;