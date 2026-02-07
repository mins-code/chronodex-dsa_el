const Task = require('../models/Task');
const { taskQueue, taskTrie, dependencyGraph, intervalScheduler, undoStack } = require('../state');
const PriorityQueue = require('../utils/PriorityQueue');
const { calculateTimeDeviation } = require('../utils/UserPatternAnalyzer');

const getTasks = async (req, res) => {
  try {
    // Fetch only tasks belonging to the authenticated user
    const tasks = await Task.find({ userId: req.userId });

    // Calculate deviation based on pattern analysis
    const userId = req.userId;

    const deviationPercentage = await calculateTimeDeviation(userId);

    // Convert to plain objects
    const plainTasks = tasks.map(t => t.toObject());

    // Inject live scores into Minheap (Self-Healing)
    // This rebuilds the global heap with fresh scores relative to NOW
    taskQueue.buildHeap(plainTasks);

    // Enrich tasks with dynamic priority score for display
    const tasksWithDynamicScore = plainTasks.map(t => {
      t.priorityScore = PriorityQueue.calculateScore(t.deadline, t.priority);
      return t;
    });

    // Sort by priorityScore (ascending) - Lower score = Higher Urgency
    tasksWithDynamicScore.sort((a, b) => a.priorityScore - b.priorityScore);

    // Structure response with tasks and suggestion
    res.status(200).json({
      tasks: tasksWithDynamicScore,
      suggestedBufferTime: deviationPercentage // percentage, e.g. 20 for 20%
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'An error occurred while fetching tasks.' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    delete updates._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // 1. Handle Priority/Deadline updates (Recalculate Internal Score)
    if (
      (updates.deadline && updates.deadline !== task.deadline) ||
      (updates.priority && updates.priority !== task.priority) ||
      (updates.duration && updates.duration !== task.duration)
    ) {
      const newDeadline = updates.deadline || task.deadline;
      const newPriority = updates.priority || task.priority;
      const newDuration = updates.duration || task.duration;

      // Note: duration unused in new formula but kept for compatibility
      const newScore = PriorityQueue.calculateScore(newDeadline, newPriority);
      updates.priorityScore = newScore;

      // Update PriorityQueue
      taskQueue.heap = taskQueue.heap.filter(
        (node) => node.taskId && node.taskId.toString() !== taskId.toString()
      );
      taskQueue.insert({
        taskId: taskId,
        priorityScore: newScore,
        deadline: newDeadline,
        priority: newPriority,
        duration: newDuration
      });

      // Also update estimatedDuration if duration changed
      if (updates.duration) {
        updates.estimatedDuration = updates.duration;
      }
    }

    // 2. Handle Title updates (Trie)
    if (updates.title && updates.title !== task.title) {
      taskTrie.insert(task.title, null);
      taskTrie.insert(updates.title, taskId);
    }


    // 3. Handle Status Update to 'completed' (Calculate actualDuration)
    console.log(`[DEBUG] updateTask: updates.status='${updates.status}', task.status='${task.status}'`);
    if (updates.status === 'completed' && task.status !== 'completed') {
      const finalDeadline = updates.deadline || task.deadline;
      const finalDuration = updates.duration || task.duration;

      // Set completedAt timestamp
      updates.completedAt = new Date();

      console.log(`[DEBUG] updateTask: Entering actualDuration calculation. Deadline: ${finalDeadline}, Duration: ${finalDuration}`);
      if (finalDeadline && finalDuration) {
        const durationInMs = finalDuration * 60 * 1000;
        const startTime = new Date(finalDeadline).getTime() - durationInMs;
        const endTime = Date.now();
        const actualDurationMinutes = (endTime - startTime) / (60 * 1000);

        updates.actualDuration = parseFloat(actualDurationMinutes.toFixed(2));

        // Ensure estimatedDuration is present for future calculations
        if (!task.estimatedDuration && !updates.estimatedDuration) {
          updates.estimatedDuration = finalDuration;
        }
        console.log(`[DEBUG] updateTask: Calculated actualDuration: ${updates.actualDuration} (Est: ${updates.estimatedDuration || task.estimatedDuration})`);
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
      new: true,
    });

    // 4. Handle IntervalScheduler updates
    if (
      (updates.deadline && updates.deadline !== task.deadline) ||
      (updates.duration && updates.duration !== task.duration)
    ) {
      intervalScheduler.intervals = intervalScheduler.intervals.filter(
        ([, , id]) => id && id.toString() !== taskId.toString()
      );

      const finalDeadline = updates.deadline || task.deadline;
      const finalDuration = updates.duration || task.duration;

      if (finalDeadline && finalDuration) {
        const startTime = new Date(finalDeadline).getTime() - finalDuration * 60 * 1000;
        const endTime = new Date(finalDeadline).getTime();
        intervalScheduler.addInterval(startTime, endTime, taskId);
      }
    }




    // Enrich response
    const responseTask = updatedTask.toObject();
    responseTask.priorityScore = PriorityQueue.calculateScore(responseTask.deadline, responseTask.priority);

    res.status(200).json(responseTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task.' });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, deadline, priority, duration, prerequisites } = req.body;

    // Validate required fields
    if (!title || !deadline || !priority) {
      return res.status(400).json({ error: 'Title, deadline, and priority are required.' });
    }

    // Check for conflicts BEFORE creating the task
    if (deadline && duration) {
      const startTime = new Date(deadline).getTime() - duration * 60 * 1000; // Calculate start time
      const endTime = new Date(deadline).getTime(); // Deadline as end time

      const conflicts = intervalScheduler.findConflicts(startTime, endTime);
      if (conflicts.length > 0) {
        // Return 409 Conflict status and do NOT save the task
        return res.status(409).json({
          error: 'The specified time slot conflicts with existing tasks.',
          conflicts: conflicts
        });
      }
    }

    // Calculate priorityScore before saving (Internal Absolute Score)
    const priorityScore = PriorityQueue.calculateScore(deadline, priority);

    // Create and save the new task to MongoDB, including priorityScore and userId
    // Ensure duration is stored in minutes (as received from frontend)
    const newTask = new Task({
      userId: req.userId,
      title,
      description,
      deadline,
      priority,
      duration,
      estimatedDuration: duration, // Set estimatedDuration = duration initially
      prerequisites,
      priorityScore,
    });

    const savedTask = await newTask.save();

    // 1. Insert into PriorityQueue with full details for dynamic recalculation
    taskQueue.insert({
      taskId: savedTask._id,
      priorityScore,
      deadline,
      priority,
      duration
    });

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
        // Rollback: delete the task from MongoDB
        await Task.findByIdAndDelete(savedTask._id);
        return res.status(400).json({
          error: 'Adding this task creates a circular dependency.',
        });
      }
    }

    // 4. Add interval to scheduler (only if no conflict was detected)
    if (deadline && duration) {
      const startTime = new Date(deadline).getTime() - duration * 60 * 1000;
      const endTime = new Date(deadline).getTime();
      intervalScheduler.addInterval(startTime, endTime, savedTask._id);
    }

    // Enrich response
    const responseTask = savedTask.toObject();
    responseTask.priorityScore = PriorityQueue.calculateScore(deadline, priority);

    // Respond with the saved task
    res.status(201).json({
      message: 'Task created successfully.',
      task: responseTask,
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

    // Calculate actualDuration if not present
    // Assuming startTime = deadline - duration
    // If deadline or duration is missing, we cannot calculate it accurately without explicit startTime
    if (task.deadline && task.duration) {
      const durationInMs = task.duration * 60 * 1000;
      const startTime = new Date(task.deadline).getTime() - durationInMs;
      const endTime = Date.now();
      const actualDurationMinutes = (endTime - startTime) / (60 * 1000);
      task.actualDuration = parseFloat(actualDurationMinutes.toFixed(2));
      task.estimatedDuration = task.duration; // Ensure this is set for future reference
      console.log(`[DEBUG] Calculated actualDuration for task '${task.title}': ${task.actualDuration} (Est: ${task.estimatedDuration})`);
    }

    // Update the task status to "completed" in MongoDB
    task.status = 'completed';
    await task.save();

    // Remove the task from the PriorityQueue since it's now completed
    taskQueue.heap = taskQueue.heap.filter(
      (node) => node.taskId && node.taskId.toString() !== taskId.toString()
    );

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
    taskQueue.insert({
      taskId: restoredTask._id,
      priorityScore,
      deadline: restoredTask.deadline,
      priority: restoredTask.priority,
      duration: restoredTask.duration
    });

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

// Clear all tasks and reset data structures
const clearAllTasks = async (req, res) => {
  try {
    // Delete all tasks from MongoDB
    await Task.deleteMany({});

    // Reset all in-memory data structures
    taskQueue.heap = [];
    taskTrie.root = { children: {}, taskIds: [] };
    dependencyGraph.adjacencyList = new Map();
    intervalScheduler.intervals = [];
    undoStack.stack = [];

    res.status(200).json({
      message: 'All tasks cleared and data structures reset successfully.',
    });
  } catch (error) {
    console.error('Error clearing tasks:', error);
    res.status(500).json({ error: 'An error occurred while clearing tasks.' });
  }
};

// GET /analytics/efficiency - Return user efficiency stats
const getEfficiencyAnalytics = async (req, res) => {
  try {
    const { calculateTimeDeviation } = require('../utils/UserPatternAnalyzer');
    const userId = req.userId;

    // Request detailed stats
    const stats = await calculateTimeDeviation(userId, true);

    if (stats.error) {
      throw new Error('Failed to calculate deviation');
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching efficiency analytics:', error);
    res.status(500).json({ error: 'Failed to fetch efficiency analytics.' });
  }
};

// Calculate Daily Load
const calculateDailyLoad = async (req, res) => {
  try {
    const { date } = req.query; // Expecting YYYY-MM-DD
    const userId = req.userId;

    // 1. Determine date range (start to end of the specific day)
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 2. Fetch tasks for this day
    // We filter by deadline falling within this day
    const dayTasks = await Task.find({
      userId,
      deadline: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'completed' } // Only count active tasks? Or all? User said "daily load", usually implies active work. Let's assume active for "load".
      // Actually, for "load" it might refer to total planned work. 
      // User prompt says: "sum (estimatedDuration ...)". If I did it, it's done. 
      // But typically "daily load" helps you plan *upcoming* work. 
      // Let's include ALL tasks for that day to show TOTAL planned load, maybe?
      // "Return a JSON object for each day containing... status: Light/Busy/Overloaded"
      // If I finished a heavy task, my day *was* overloaded.
      // Let's stick to ALL tasks due on that day to represent the "Daily Schedule Load".
    });

    // 3. Get User Efficiency (Buffer Multiplier)
    // calculateTimeDeviation returns a percentage (e.g. 20) or object if requested.
    // We need the multiplier.
    // The UserPatternAnalyzer has 'calculateTimeDeviation'.
    // It returns 'result' (percentage) by default. 
    // We need to call it with true for details? No, let's just get the percentage and convert.
    // actually getEfficiencyAnalytics uses `calculateTimeDeviation(userId, true)`.
    // Let's do that.

    // Calculate total hours logic
    const weights = { Critical: 2.0, High: 1.5, Medium: 1.0, Low: 0.5 };

    // Fetch efficiency stats
    // Note: calculateTimeDeviation is async
    const efficiencyStats = await calculateTimeDeviation(userId, true);
    // If error or no data, default multiplier to 1.1 (10% buffer)
    const bufferMultiplier = efficiencyStats && efficiencyStats.efficiencyMultiplier
      ? efficiencyStats.efficiencyMultiplier
      : 1.1;

    let totalWeightedMinutes = 0;

    dayTasks.forEach(task => {
      const duration = task.estimatedDuration || task.duration || 30; // Default 30 min
      const weight = weights[task.priority] || 1.0;

      // Formula: (estimatedDuration * priorityWeight) * bufferMultiplier
      const weightedTaskLoad = (duration * weight) * bufferMultiplier;
      totalWeightedMinutes += weightedTaskLoad;
    });

    const totalHours = totalWeightedMinutes / 60;

    // Determine Status
    let status = '🟢 Light';
    if (totalHours > 7) status = '🔴 Overloaded';
    else if (totalHours >= 4) status = '🟡 Busy';

    // Format Total Time
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    const totalTimeWithBuffer = `${hours}h ${minutes}m`;

    res.status(200).json({
      date: startOfDay.toISOString().split('T')[0],
      loadScore: parseFloat(totalWeightedMinutes.toFixed(2)),
      status,
      totalTimeWithBuffer,
      taskCount: dayTasks.length,
      bufferMultiplier: parseFloat(bufferMultiplier.toFixed(2))
    });

  } catch (error) {
    console.error('Error calculating daily load:', error);
    res.status(500).json({ error: 'Failed to calculate daily load.' });
  }
};

const getDependencyBottlenecks = async (req, res) => {
  try {
    const bottlenecks = dependencyGraph.getBottleneckTasks();

    if (bottlenecks.length === 0) {
      return res.status(200).json([]);
    }

    const bottleneckIds = bottlenecks.map(b => b.taskId);
    const allBlockedIds = bottlenecks.flatMap(b => b.blockedTaskIds || []);
    const distinctIds = [...new Set([...bottleneckIds, ...allBlockedIds])];

    const tasks = await Task.find({
      _id: { $in: distinctIds },
      userId: req.userId
    }).select('title priority status');

    const taskMap = {};
    tasks.forEach(t => {
      taskMap[t._id.toString()] = t;
    });

    const enrichedBottlenecks = bottlenecks
      .filter(b => {
        const task = taskMap[b.taskId];
        // Only show non-completed tasks that block at least 1 other task
        return task && task.status !== 'completed' && b.blockedCount > 0;
      })
      .map(b => {
        const task = taskMap[b.taskId];
        const blockedDetails = (b.blockedTaskIds || [])
          .map(id => taskMap[id])
          .filter(Boolean)
          .map(t => ({ id: t._id, title: t.title }));

        return {
          taskId: b.taskId,
          title: task.title,
          blockedCount: b.blockedCount,
          blockedTasks: blockedDetails, // Send ALL blocked tasks
          priority: task.priority,
          status: task.status
        };
      })
      .sort((a, b) => b.blockedCount - a.blockedCount); // Sort by most blocking first

    console.log('[DEBUG] Bottlenecks being returned:', JSON.stringify(enrichedBottlenecks, null, 2));
    res.status(200).json(enrichedBottlenecks);
  } catch (error) {
    console.error('Error fetching bottlenecks:', error);
    res.status(500).json({ error: 'Failed to fetch bottleneck data' });
  }
};

module.exports = {
  createTask,
  completeTask,
  deleteTask,
  undoDelete,
  clearAllTasks,
  getTasks,
  updateTask,
  getEfficiencyAnalytics,
  calculateDailyLoad,
  getDependencyBottlenecks
};