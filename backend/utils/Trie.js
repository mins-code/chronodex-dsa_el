class TrieNode {
  constructor() {
    this.children = new Map(); // Map of child nodes
    this.taskIds = []; // Array of taskIds that match the prefix at this node
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert a title and taskId into the Trie
  insert(title, taskId) {
    const words = title.toLowerCase().split(/\s+/); // Split title into words (case-insensitive)
    for (const word of words) {
      let currentNode = this.root;

      for (const char of word) {
        if (!currentNode.children.has(char)) {
          currentNode.children.set(char, new TrieNode());
        }
        currentNode = currentNode.children.get(char);
      }

      // Add the taskId to the node's taskIds array
      if (!currentNode.taskIds.includes(taskId)) {
        currentNode.taskIds.push(taskId);
      }
    }
  }

  // Search for all taskIds associated with a given prefix
  search(prefix) {
    let currentNode = this.root;
    prefix = prefix.toLowerCase(); // Make the search case-insensitive

    for (const char of prefix) {
      if (!currentNode.children.has(char)) {
        return []; // Prefix not found
      }
      currentNode = currentNode.children.get(char);
    }

    // Collect all taskIds from the current node and its descendants
    return this._collectTaskIds(currentNode);
  }

  // Helper method to collect all taskIds from a node and its descendants
  _collectTaskIds(node) {
    const taskIds = [...node.taskIds];

    for (const child of node.children.values()) {
      taskIds.push(...this._collectTaskIds(child));
    }

    return taskIds;
  }
}

module.exports = Trie;