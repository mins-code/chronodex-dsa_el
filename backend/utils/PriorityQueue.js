class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  // Insert a new node into the heap
  insert(node) {
    this.heap.push(node);
    this._heapifyUp(this.heap.length - 1);
  }

  // Extract the node with the maximum priorityScore
  extract() {
    if (this.heap.length === 0) return null;

    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._heapifyDown(0);

    return max;
  }

  // Peek at the node with the maximum priorityScore without removing it
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  // Static method to calculate priorityScore
  static calculateScore(deadline, priority) {
    const priorityMap = {
      High: 10,
      Medium: 5,
      Low: 1,
    };

    const priorityWeight = priorityMap[priority] || 1; // Default to Low if unknown

    const now = new Date();
    const deadlineDate = new Date(deadline);
    // Time difference in hours
    const hoursUntilDeadline = (deadlineDate - now) / (1000 * 60 * 60);

    let urgencyScore = 0;
    
    // If deadline is passed or extremely close (<= 0), assign a very high urgency score
    // to ensure it bubbles up. 
    // Using a large cap for 1/0 or negative values.
    if (hoursUntilDeadline <= 0) {
      urgencyScore = 1000; 
    } else {
      urgencyScore = 1 / hoursUntilDeadline;
    }

    // Score = (PriorityWeight) + (1 / HoursUntilDeadline)
    return priorityWeight + urgencyScore;
  }

  // Helper method to maintain heap property after insertion
  _heapifyUp(index) {
    let parentIndex = Math.floor((index - 1) / 2);

    while (
      index > 0 &&
      this.heap[index].priorityScore > this.heap[parentIndex].priorityScore
    ) {
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
      parentIndex = Math.floor((index - 1) / 2);
    }
  }

  // Helper method to maintain heap property after extraction
  _heapifyDown(index) {
    let largest = index;
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;

    if (
      leftChild < this.heap.length &&
      this.heap[leftChild].priorityScore > this.heap[largest].priorityScore
    ) {
      largest = leftChild;
    }

    if (
      rightChild < this.heap.length &&
      this.heap[rightChild].priorityScore > this.heap[largest].priorityScore
    ) {
      largest = rightChild;
    }

    if (largest !== index) {
      [this.heap[index], this.heap[largest]] = [
        this.heap[largest],
        this.heap[index],
      ];
      this._heapifyDown(largest);
    }
  }
}

module.exports = PriorityQueue;