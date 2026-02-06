const PriorityQueue = require('./utils/PriorityQueue');
const DependencyGraph = require('./utils/DependencyGraph');
const Trie = require('./utils/Trie');
const IntervalScheduler = require('./utils/IntervalScheduler');
const UndoStack = require('./utils/UndoStack');

// Create single instances of each utility class
const taskQueue = new PriorityQueue();
const dependencyGraph = new DependencyGraph();
const taskTrie = new Trie();
const intervalScheduler = new IntervalScheduler();
const undoStack = new UndoStack();

const Task = require('./models/Task');

// Export the instances
module.exports = {
  taskQueue,
  dependencyGraph,
  taskTrie,
  intervalScheduler,
  undoStack,
  initializeState: async () => {
    try {
      console.log('Initializing in-memory data structures...');
      const tasks = await Task.find();

      tasks.forEach((task) => {
        const { _id, title, deadline, priority, prerequisites, duration } = task;

        // Insert into Trie
        taskTrie.insert(title, _id);

        // Insert into PriorityQueue
        const priorityScore = PriorityQueue.calculateScore(deadline, priority);
        taskQueue.insert({ taskId: _id, priorityScore });

        // Insert into DependencyGraph
        dependencyGraph.addTask(_id);
        if (prerequisites && prerequisites.length > 0) {
          prerequisites.forEach((prerequisiteId) => {
            dependencyGraph.addDependency(prerequisiteId, _id);
          });
        }

        // Insert into IntervalScheduler
        if (deadline && duration) {
          const startTime = new Date(deadline).getTime() - duration * 60 * 1000;
          const endTime = new Date(deadline).getTime();
          intervalScheduler.addInterval(startTime, endTime, _id);
        }
      });

      // mergeIntervals removed to preserve task IDs for deletion and conflict checking
      // intervalScheduler.mergeIntervals();

      console.log('In-memory state initialized successfully with ' + tasks.length + ' tasks.');
    } catch (error) {
      console.error('Error initializing state:', error);
      throw error;
    }
  }
};