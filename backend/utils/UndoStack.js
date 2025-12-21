class UndoStack {
  constructor(maxSize = 10) {
    this.stack = [];
    this.maxSize = maxSize;
  }

  // Push a new operation onto the stack
  push(operation) {
    if (!operation || !operation.type || !operation.taskData || !operation.timestamp) {
      throw new Error("Invalid operation object. Must include 'type', 'taskData', and 'timestamp'.");
    }

    // If the stack exceeds maxSize, remove the oldest operation
    if (this.stack.length >= this.maxSize) {
      this.stack.shift();
    }

    this.stack.push(operation);
  }

  // Pop the most recent operation from the stack
  pop() {
    if (this.isEmpty()) {
      throw new Error("Undo stack is empty.");
    }

    return this.stack.pop();
  }

  // Check if the stack is empty
  isEmpty() {
    return this.stack.length === 0;
  }
}

module.exports = UndoStack;
