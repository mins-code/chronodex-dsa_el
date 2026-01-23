
const Trie = require('../backend/utils/Trie');
const DependencyGraph = require('../backend/utils/DependencyGraph');

console.log('--- Efficient Implementation Demonstration ---');
console.log('This script executes the optimized data structure operations wrapped with the performance logger.\n');

// ---------------------------------------------------------
// Demo 1: Trie Search (Prefix Search)
// ---------------------------------------------------------
console.log('1. Testing Trie Search (O(k) complexity):');
const trie = new Trie();
// Populate Trie with some dummy data
const words = ['apple', 'application', 'app', 'apply', 'apartment', 'ape', 'apricot', 'banana', 'band', 'bandana'];
words.forEach((w, i) => trie.insert(w, `task_${i}`));

console.log(`   Populated Trie with ${words.length} words.`);
console.log('   Searching for prefix "app"...');

// The logger will print 'Trie.search: <time>ms' to the console
const searchResults = trie.search('app');
console.log(`   Found ${searchResults.length} matches.`);


// ---------------------------------------------------------
// Demo 2: Dependency Graph Resolution (Topological Sort)
// ---------------------------------------------------------
console.log('\n2. Testing Dependency Graph Resolution (Topological Sort):');
const graph = new DependencyGraph();

// Create a complex dependency chain
// A -> B -> C
// A -> D
// E -> F -> G -> C
graph.addDependency('A', 'B');
graph.addDependency('B', 'C');
graph.addDependency('A', 'D');
graph.addDependency('E', 'F');
graph.addDependency('F', 'G');
graph.addDependency('G', 'C');

console.log('   Constructed dependency graph with multiple chains.');
console.log('   Resolving execution order...');

// The logger will print 'DependencyGraph.resolve: <time>ms' to the console
const order = graph.resolve();
console.log('   Resolved Order:', order);

console.log('\n--- Demonstration Complete ---');
console.log('Note: The execution times logged above verify the low time complexity.');
