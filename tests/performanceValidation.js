
const Trie = require('../backend/utils/Trie');
const DependencyGraph = require('../backend/utils/DependencyGraph');

console.log('--- Starting Performance Verification ---');

// Test Trie
console.log('\nTesting Trie Performance Wrapper:');
const trie = new Trie();
trie.insert('hello', 'id_1');
trie.insert('help', 'id_2');
trie.insert('world', 'id_3');

console.log('Calling trie.search("hel")...');
const searchResults = trie.search('hel');
console.log('Search Results:', searchResults);


// Test DependencyGraph
console.log('\nTesting DependencyGraph Performance Wrapper:');
const graph = new DependencyGraph();
graph.addDependency('A', 'B'); // A -> B
graph.addDependency('B', 'C'); // B -> C
graph.addDependency('A', 'D'); // A -> D

console.log('Calling graph.resolve()...');
const executionOrder = graph.resolve();
console.log('Execution Order:', executionOrder);

console.log('\n--- Verification Complete ---');
