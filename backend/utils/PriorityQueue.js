class MinHeap {
  constructor() {
    this.heap = [];
  }

  // Insert a new node into the heap
  insert(node) {
    this.heap.push(node);
    this._heapifyUp(this.heap.length - 1);
  }

  // Extract the node with the minimum priorityScore
  extractMin() {
    if (this.heap.length === 0) return null;

    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._heapifyDown(0);

    return min;
  }

  // Peek at the node with the minimum priorityScore without removing it
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  // Static method to calculate priorityScore
  static calculateScore(deadline, priority) {
    const priorityMap = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    const now = new Date();
    const timeDifference = Math.max(0, new Date(deadline) - now); // Time difference in milliseconds
    const daysUntilDeadline = timeDifference / (1000 * 60 * 60 * 24); // Convert to days

    const priorityWeight = priorityMap[priority] || 0;

    // Lower score = more urgent (closer deadline and higher priority)
    return daysUntilDeadline / priorityWeight;
  }

  // Helper method to maintain heap property after insertion
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

  // Helper method to maintain heap property after extraction
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

module.exports = MinHeap;