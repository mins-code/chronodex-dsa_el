const IntervalScheduler = require('../backend/utils/IntervalScheduler');

function generateTestPairs() {
  const pairs = [];
  
  // Generate 50 overlapping pairs
  for (let i = 0; i < 50; i++) {
    const start1 = Math.floor(Math.random() * 1000);
    const end1 = start1 + Math.floor(Math.random() * 100) + 1;
    
    const start2 = start1 + Math.floor(Math.random() * (end1 - start1)); // start2 is strictly inside interval 1 (or at start)
    const end2 = start2 + Math.floor(Math.random() * 100) + 1;
    
    // Ensure actual overlap for strict checking (start2 < end1)
    // The construction above ensures start2 >= start1. 
    // If start2 < end1 then they overlap.
    // If we want to guarantee overlap, strict inequality is needed.
    // However, the random logic above: start2 is between start1 and end1-1. So start2 < end1 is guaranteed.
    
    pairs.push({
      existing: [start1, end1],
      new: [start2, end2],
      shouldOverlap: true
    });
  }
  
  // Generate 50 non-overlapping pairs
  for (let i = 0; i < 50; i++) {
    const start1 = Math.floor(Math.random() * 1000);
    const end1 = start1 + Math.floor(Math.random() * 100) + 1;
    
    // Create an interval completely after the first one
    const start2 = end1 + Math.floor(Math.random() * 100) + 1;
    const end2 = start2 + Math.floor(Math.random() * 100) + 1;
    
    pairs.push({
      existing: [start1, end1],
      new: [start2, end2],
      shouldOverlap: false
    });
  }
  
  return pairs;
}

function runValidation() {
  const scheduler = new IntervalScheduler();
  const testPairs = generateTestPairs();
  let correctCount = 0;

  console.log("Running Interval Scheduler Validation...");
  console.log(`Total Test Cases: ${testPairs.length}`);

  testPairs.forEach((pair, index) => {
    // We need a fresh scheduler or at least clear it for each pair to test isolated collision
    // optimizing: just use a fresh instance or clear intervals. 
    // The class doesn't have a clear method, so simpler to instantiate new or manually clear.
    // Actually, for "findConflicts", it checks against *existing* intervals.
    // So for each test case:
    // 1. Add 'existing' interval.
    // 2. Check conflicts for 'new' interval.
    
    const singleTestScheduler = new IntervalScheduler();
    singleTestScheduler.addInterval(pair.existing[0], pair.existing[1], `task_existing_${index}`);
    
    const conflicts = singleTestScheduler.findConflicts(pair.new[0], pair.new[1]);
    const hasConflict = conflicts.length > 0;
    
    const isCorrect = (hasConflict === pair.shouldOverlap);
    
    if (isCorrect) {
      correctCount++;
    } else {
        // Optional: Log failures for debugging
        // console.log(`Failed Test #${index}: Expected overlap=${pair.shouldOverlap}, Got=${hasConflict}`);
        // console.log(`   Existing: [${pair.existing}], New: [${pair.new}]`);
    }
  });

  const accuracy = (correctCount / testPairs.length) * 100;
  console.log(`Correct Predictions: ${correctCount}`);
  console.log(`Accuracy: ${accuracy}%`);

  if (accuracy > 95) {
    console.log("SUCCESS: Accuracy is above 95%");
  } else {
    console.log("FAILURE: Accuracy is not above 95%");
  }
}

runValidation();
