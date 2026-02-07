class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  // Insert a new node into the heap
  insert(node) {
    // Refresh heap before operation to ensure current order is correct (aging effect)
    this.refreshHeap();

    this.heap.push(node);
    this._heapifyUp(this.heap.length - 1);
  }

  // Extract the node with the minimum priorityScore (most urgent)
  extract() {
    // Refresh heap to ensure we pop the truly most urgent task right now
    this.refreshHeap();

    if (this.heap.length === 0) return null;

    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._heapifyDown(0);

    return min;
  }

  // Peek at the node with the minimum priorityScore (most urgent) without removing it
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  // Static method to calculate priorityScore (Live Score)
  static calculateScore(deadline, priority) {
    const priorityMap = {
      Critical: 0,
      High: 10,
      Medium: 20,
      Low: 30
    };

    const weight = priorityMap[priority] !== undefined ? priorityMap[priority] : 30;

    // Handle invalid deadline
    if (!deadline) {
      return weight + 100; // Push to back if no deadline
    }

    const now = Date.now();
    const deadlineDate = new Date(deadline).getTime();

    // Check if deadline is valid date
    if (isNaN(deadlineDate)) {
      return weight + 100; // Push to back if invalid deadline
    }

    // Time difference in hours
    const diffInHours = (deadlineDate - now) / 3600000;

    // If overdue (negative diff), return a negative score based on weight
    // This ensures Critical (-100) < High (-90) < Medium (-80) < Low (-70)
    // All overdue tasks will still be "smaller" (more urgent) than any upcoming task (0+)
    if (diffInHours < 0) {
      return parseFloat((weight - 100).toFixed(4));
    }

    // Formula: Weight + Math.min(diffInHours, 19)
    // Capped at 19 hours. Tasks due in 19+ hours get max score (weight + 19).
    const score = weight + Math.min(diffInHours, 19);

    return parseFloat(score.toFixed(4));
  }

  // Re-calculate all scores based on current time and re-heapify
  refreshHeap() {
    for (let i = 0; i < this.heap.length; i++) {
      const node = this.heap[i];
      if (node.deadline && node.priority) {
        // Note: duration is not used in this new formula, just deadline and priority
        node.priorityScore = PriorityQueue.calculateScore(node.deadline, node.priority);
      }
    }

    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this._heapifyDown(i);
    }
  }

  // Build heap from an array of tasks (Self-Healing logic)
  buildHeap(tasks) {
    this.heap = [];
    tasks.forEach(task => {
      // Calculate live score logic is mostly handled by refreshHeap if we insert raw nodes?
      // Or we calculate here. calculateScore is static.
      const score = PriorityQueue.calculateScore(task.deadline, task.priority);

      this.heap.push({
        taskId: task._id || task.taskId, // Handle potentially different object structures
        priorityScore: score,
        deadline: task.deadline,
        priority: task.priority,
        duration: task.duration
      });
    });

    // Heapify entire array
    for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
      this._heapifyDown(i);
    }
  }

  // Helper method to maintain min heap property after insertion
  _heapifyUp(index) {
    let parentIndex = Math.floor((index - 1) / 2);

    while (
      index > 0 &&
      this.heap[index].priorityScore < this.heap[parentIndex].priorityScore
    ) {
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
      parentIndex = Math.floor((index - 1) / 2);
    }
  }

  // Helper method to maintain min heap property after extraction
  _heapifyDown(index) {
    let smallest = index;
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;

    if (
      leftChild < this.heap.length &&
      this.heap[leftChild].priorityScore < this.heap[smallest].priorityScore
    ) {
      smallest = leftChild;
    }

    if (
      rightChild < this.heap.length &&
      this.heap[rightChild].priorityScore < this.heap[smallest].priorityScore
    ) {
      smallest = rightChild;
    }

    if (smallest !== index) {
      [this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ];
      this._heapifyDown(smallest);
    }
  }
}

module.exports = PriorityQueue;