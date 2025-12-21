const Task = require('../models/Task');
const { taskQueue, taskTrie, dependencyGraph, intervalScheduler, undoStack } = require('../state');
const PriorityQueue = require('../utils/PriorityQueue'); // Make sure this is imported

const createTask = async (req, res) => {
  try {
    const { title, description, deadline, priority, duration, prerequisites } = req.body;

    // Validate required fields
    if (!title || !deadline || !priority) {
      return res.status(400).json({ error: 'Title, deadline, and priority are required.' });
    }

    // Calculate priorityScore before saving
    const priorityScore = PriorityQueue.calculateScore(deadline, priority);

    // Create and save the new task to MongoDB, including priorityScore
    const newTask = new Task({
      title,
      description,
      deadline,
      priority,
      duration,
      prerequisites,
      priorityScore, // <-- Add this line
    });

    const savedTask = await newTask.save();

    // 1. Calculate priorityScore and insert into PriorityQueue
    // const priorityScore = PriorityQueue.calculateScore(deadline, priority); // Fixed the syntax error
    taskQueue.insert({ taskId: savedTask._id, priorityScore });

    // 2. Insert the title into the Trie for searching
    taskTrie.insert(title, savedTask._id);

    // 3. Add the task and its prerequisites to the DependencyGraph
    dependencyGraph.addTask(savedTask._id);
    if (prerequisites && prerequisites.length > 0) {
      prerequisites.forEach((prerequisiteId) => {
        dependencyGraph.addDependency(prerequisiteId, savedTask._id);
      });

      // Check for cycles in the DependencyGraph
      if (dependencyGraph.detectCycle()) {
        return res.status(400).json({
          error: 'Adding this task creates a circular dependency.',
        });
      }
    }

    // 4. Check for conflicts using IntervalScheduler
    let conflictWarning = null;
    if (deadline && duration) {
      const startTime = new Date(deadline).getTime() - duration * 60 * 1000; // Calculate start time
      const endTime = new Date(deadline).getTime(); // Deadline as end time

      const conflicts = intervalScheduler.findConflicts(startTime, endTime);
      if (conflicts.length > 0) {
        conflictWarning = 'The specified time slot conflicts with existing tasks.';
      } else {
        intervalScheduler.addInterval(startTime, endTime, savedTask._id);
      }
    }

    // Respond with the saved task and any warnings
    res.status(201).json({
      message: 'Task created successfully.',
      task: savedTask,
      warning: conflictWarning,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'An error occurred while creating the task.' });
  }
};

const completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Fetch the task from MongoDB
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Get the list of completed task IDs
    const completedTaskIds = await Task.find({ status: 'completed' }).distinct('_id');

    // Check if all prerequisites are met
    const canComplete = dependencyGraph.canComplete(taskId, completedTaskIds);
    if (!canComplete) {
      return res.status(400).json({
        error: 'Cannot complete task. Prerequisites not finished.',
      });
    }

    // Update the task status to "completed" in MongoDB
    task.status = 'completed';
    await task.save();

    res.status(200).json({
      message: 'Task marked as completed successfully.',
      task,
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'An error occurred while completing the task.' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find the task in MongoDB
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Push the full task object into the undoStack
    try {
      undoStack.push({
        type: 'DELETE',
        taskData: task,
        timestamp: new Date(),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to push task to undo stack.' });
    }

    // Delete the task from MongoDB
    await Task.findByIdAndDelete(taskId);

    // Remove the task from the PriorityQueue
    taskQueue.heap = taskQueue.heap.filter(
      (node) => node.taskId && node.taskId.toString() !== taskId.toString()
    );

    // Remove the task from the Trie
    if (task.title) {
      taskTrie.insert(task.title, null); // Remove taskId from the Trie
    }

    // Remove the task from the IntervalScheduler
    intervalScheduler.intervals = intervalScheduler.intervals.filter(
      ([, , id]) => id && id.toString() !== taskId.toString()
    );

    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'An error occurred while deleting the task.' });
  }
};

const undoDelete = async (req, res) => {
  try {
    // Check if the undoStack is empty
    if (undoStack.isEmpty()) {
      return res.status(400).json({ error: 'Undo stack is empty. No task to restore.' });
    }

    // Pop the last deleted task from the stack
    const lastDeleted = undoStack.pop();

    // Extract the task data
    let { taskData } = lastDeleted;

    // Convert to a plain object if it isn't one already
    if (typeof taskData.toObject === 'function') {
      taskData = taskData.toObject();
    }

    // Remove the __v property to avoid VersionError
    delete taskData.__v;

    // Save the task back to MongoDB
    const restoredTask = new Task(taskData);
    await restoredTask.save();

    // Re-insert the task into the PriorityQueue
    const priorityScore = PriorityQueue.calculateScore(restoredTask.deadline, restoredTask.priority);
    taskQueue.insert({ taskId: restoredTask._id, priorityScore });

    // Re-insert the task into the Trie
    taskTrie.insert(restoredTask.title, restoredTask._id);

    // Re-insert the task into the DependencyGraph
    dependencyGraph.addTask(restoredTask._id);
    if (restoredTask.prerequisites && restoredTask.prerequisites.length > 0) {
      restoredTask.prerequisites.forEach((prerequisiteId) => {
        dependencyGraph.addDependency(prerequisiteId, restoredTask._id);
      });
    }

    // Re-insert the task into the IntervalScheduler
    if (restoredTask.deadline && restoredTask.duration) {
      const startTime = new Date(restoredTask.deadline).getTime() - restoredTask.duration * 60 * 1000;
      const endTime = new Date(restoredTask.deadline).getTime();
      intervalScheduler.addInterval(startTime, endTime, restoredTask._id);
    }

    res.status(200).json({
      message: 'Task restored successfully.',
      task: restoredTask,
    });
  } catch (error) {
    console.error('Error restoring task:', error);
    res.status(500).json({ error: 'An error occurred while restoring the task.' });
  }
};

module.exports = { createTask, completeTask, deleteTask, undoDelete };