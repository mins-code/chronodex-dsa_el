class DirectedGraph {
  constructor() {
    this.adjacencyList = new Map();
  }

  // Add a new task to the graph
  addTask(taskId) {
    const id = String(taskId);
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
    }
  }

  // Add a dependency (edge) from prerequisiteId to taskId
  addDependency(prerequisiteId, taskId) {
    const preId = String(prerequisiteId);
    const currId = String(taskId);

    this.addTask(preId);
    this.addTask(currId);
    this.adjacencyList.get(preId).push(currId);
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

      const neighbors = this.adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
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
    const targetId = String(taskId);
    const prerequisites = [];
    for (const [key, value] of this.adjacencyList.entries()) {
      if (value.includes(targetId)) {
        prerequisites.push(key);
      }
    }
    return prerequisites;
  }

  // Check if a task can be completed based on completedTaskIds
  canComplete(taskId, completedTaskIds) {
    const targetId = String(taskId);
    // Ensure completedTaskIds are also strings for consistent comparison
    const completedIdsAsStrings = new Set(completedTaskIds.map(String));
    const prerequisites = this.getPrerequisites(targetId);
    return prerequisites.every((prerequisite) =>
      completedIdsAsStrings.has(prerequisite)
    );
  }

  // Resolve the execution order of tasks (Topological Sort)
  resolve() {
    const visited = new Set();
    const stack = [];

    const tSort = (node) => {
      visited.add(node);

      const neighbors = this.adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          tSort(neighbor);
        }
      }

      stack.push(node);
    };

    for (const node of this.adjacencyList.keys()) {
      if (!visited.has(node)) {
        tSort(node);
      }
    }

    // Stack has dependencies at the bottom (pushed last if we consider post-order of DFS on graph where edges are dependencies)
    // Wait, with A->B (A is prereq):
    // Visit A -> Call tSort(B) -> Visit B -> B has no neighbors -> Push B -> Return -> Push A.
    // Stack: [B, A]. 
    // We want A then B.
    // So we need to reverse the stack.
    return stack.reverse();
  }

  // Helper to get all descendants of a given task
  getAllDescendants(taskId) {
    const id = String(taskId);
    const descendants = new Set();
    const queue = [...(this.adjacencyList.get(id) || [])];
    const visited = new Set(); // To prevent infinite loops in case of cycles (though cycles should be detected elsewhere)

    while (queue.length > 0) {
      const current = queue.shift();
      if (!visited.has(current)) {
        visited.add(current);
        descendants.add(current);
        const neighbors = this.adjacencyList.get(current) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }
    return Array.from(descendants);
  }

  // Calculate impact score (number of unique descendants) for each task
  getBottleneckTasks() {
    const bottleneckMap = new Map(); // Use Map to consolidate by taskId

    // Iterate over all tasks in the graph
    for (const taskId of this.adjacencyList.keys()) {
      const dependentSet = new Set();

      // Get all tasks that depend on this task (direct dependents)
      const dependents = this.adjacencyList.get(taskId) || [];

      for (const depId of dependents) {
        dependentSet.add(depId);

        // Recursively add all descendants
        const descendants = this.getAllDescendants(depId);
        descendants.forEach(d => dependentSet.add(d));
      }

      const blockedCount = dependentSet.size;
      const blockedTaskIds = Array.from(dependentSet);

      // Only add to map if this task blocks at least one other task
      if (blockedCount > 0) {
        // If taskId already exists, merge the blocked tasks
        if (bottleneckMap.has(taskId)) {
          const existing = bottleneckMap.get(taskId);
          // Merge blocked task IDs (remove duplicates)
          const mergedBlockedIds = [...new Set([...existing.blockedTaskIds, ...blockedTaskIds])];
          existing.blockedTaskIds = mergedBlockedIds;
          existing.blockedCount = mergedBlockedIds.length;
        } else {
          bottleneckMap.set(taskId, {
            taskId,
            blockedCount,
            blockedTaskIds
          });
        }
      }
    }

    // Convert map to array and sort by impact (descending)
    const bottlenecks = Array.from(bottleneckMap.values());
    return bottlenecks.sort((a, b) => b.blockedCount - a.blockedCount);
  }
}

module.exports = DirectedGraph;

const performanceLogger = require('./performanceLogger');

// Wrap the resolve method with performance logging
DirectedGraph.prototype.resolve = performanceLogger(DirectedGraph.prototype.resolve, 'DependencyGraph.resolve');