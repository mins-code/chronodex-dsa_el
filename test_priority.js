const PriorityQueue = require('./backend/utils/PriorityQueue');

// Mock Data
// Priority Weights: High=10, Medium=5, Low=1
// Formula: Weight + (1 / HoursUntilDeadline)

const now = new Date();

function testScoring() {
    console.log('Testing Scoring Logic...');
    
    // Case 1: High Priority, Distant Deadline (100 hours)
    const deadline1 = new Date(now.getTime() + 100 * 60 * 60 * 1000);
    const score1 = PriorityQueue.calculateScore(deadline1, 'High');
    console.log(`High Priority, 100h: Score = ${score1.toFixed(3)} (Expected ~ 10 + 0.01 = 10.01)`);
    
    // Case 2: Low Priority, Urgent Deadline (6 mins = 0.1 hours)
    const deadline2 = new Date(now.getTime() + 6 * 60 * 1000);
    const score2 = PriorityQueue.calculateScore(deadline2, 'Low');
    console.log(`Low Priority, 6m: Score = ${score2.toFixed(3)} (Expected ~ 1 + 10 = 11.00)`);
    
    // Case 3: Medium Priority, 5 hours
    const deadline3 = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const score3 = PriorityQueue.calculateScore(deadline3, 'Medium');
    console.log(`Medium Priority, 5h: Score = ${score3.toFixed(3)} (Expected ~ 5 + 0.2 = 5.20)`);
    
    // Verification
    if (score2 > score1) console.log('PASS: Urgent Low > Distant High');
    else console.error('FAIL: Urgent Low <= Distant High');
    
    if (score1 > score3) console.log('PASS: Distant High > Medium');
    else console.error('FAIL: Distant High <= Medium');
}

function testHeap() {
    console.log('\nTesting MaxHeap Logic...');
    const pq = new PriorityQueue();
    
    pq.insert({ id: 'low_urgent', priorityScore: 11 });
    pq.insert({ id: 'high_distant', priorityScore: 10 });
    pq.insert({ id: 'medium', priorityScore: 5 });
    
    const first = pq.extract();
    console.log(`First extracted: ${first.id} (Score: ${first.priorityScore})`);
    
    const second = pq.extract();
    console.log(`Second extracted: ${second.id} (Score: ${second.priorityScore})`);
    
    const third = pq.extract();
    console.log(`Third extracted: ${third.id} (Score: ${third.priorityScore})`);
    
    if (first.id === 'low_urgent' && second.id === 'high_distant' && third.id === 'medium') {
        console.log('PASS: MaxHeap order is correct.');
    } else {
        console.error('FAIL: MaxHeap order is incorrect.');
    }
}

testScoring();
testHeap();
