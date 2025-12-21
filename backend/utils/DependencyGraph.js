class DirectedGraph {
  constructor() {
    this.adjacencyList = new Map();
  }

  // Add a new task to the graph
  addTask(taskId) {
    if (!this.adjacencyList.has(taskId)) {
      this.adjacencyList.set(taskId, []);
    }
  }

  // Add a dependency (edge) from prerequisiteId to taskId
  addDependency(prerequisiteId, taskId) {
    this.addTask(prerequisiteId);
    this.addTask(taskId);
    this.adjacencyList.get(prerequisiteId).push(taskId);
  }

  // Detect cycles in the graph using DFS
  detectCycle() {
    const visited = new Set();
    const stack = new Set();

    const dfs = (node) => {
      if (stack.has(node)) return true; // Cycle detected
      if (visited.has(node)) return false;

      visited.add(node);
      stack.add(node);

      for (const neighbor of this.adjacencyList.get(node) || []) {
        if (dfs(neighbor)) return true;
      }

      stack.delete(node);
      return false;
    };

    for (const node of this.adjacencyList.keys()) {
      if (dfs(node)) return true;
    }

    return false;
  }

  // Get all prerequisites for a given taskId
  getPrerequisites(taskId) {
    const prerequisites = [];
    for (const [key, value] of this.adjacencyList.entries()) {
      if (value.includes(taskId)) {
        prerequisites.push(key);
      }
    }
    return prerequisites;
  }

  // Check if a task can be completed based on completedTaskIds
  canComplete(taskId, completedTaskIds) {
    const prerequisites = this.getPrerequisites(taskId);
    return prerequisites.every((prerequisite) =>
      completedTaskIds.includes(prerequisite)
    );
  }
}

module.exports = DirectedGraph;