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

// Export the instances
module.exports = {
  taskQueue,
  dependencyGraph,
  taskTrie,
  intervalScheduler,
  undoStack,
};