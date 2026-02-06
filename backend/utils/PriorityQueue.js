class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  // Insert a new node into the heap
  insert(node) {
    this.heap.push(node);
    this._heapifyUp(this.heap.length - 1);
  }

  // Extract the node with the minimum priorityScore (most urgent)
  extract() {
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

  // Static method to calculate priorityScore (MIN HEAP: lower score = more urgent)
  static calculateScore(deadline, priority) {
    const priorityMap = {
      Critical: 1,   // Most urgent = lowest weight
      High: 5,
      Medium: 10,
      Low: 20,       // Least urgent = highest weight
    };

    const priorityWeight = priorityMap[priority] || 20; // Default to Low if unknown

    const now = new Date();
    const deadlineDate = new Date(deadline);
    // Time difference in hours
    const hoursUntilDeadline = (deadlineDate - now) / (1000 * 60 * 60);

    let urgencyScore = 0;

    // If deadline is passed or extremely close (<= 0), assign a very low urgency score
    // to ensure it bubbles to top of min heap (most urgent)
    if (hoursUntilDeadline <= 0) {
      urgencyScore = -1000;
    } else {
      // Closer deadlines get lower scores (more urgent)
      urgencyScore = hoursUntilDeadline;
    }

    // Score = (PriorityWeight) + (HoursUntilDeadline)
    // Lower total score = more urgent
    return priorityWeight + urgencyScore;
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