const Task = require('../models/Task');
const PriorityQueue = require('../utils/PriorityQueue');

async function recalculateAllPriorityScores() {
    try {
        console.log('Starting priority score recalculation...');

        const tasks = await Task.find({});
        let updated = 0;

        for (const task of tasks) {
            const newScore = PriorityQueue.calculateScore(task.deadline, task.priority);

            await Task.findByIdAndUpdate(task._id, {
                priorityScore: newScore
            });

            updated++;
            console.log(`Updated task ${task.title}: ${task.priority} -> Score: ${newScore.toFixed(2)}`);
        }

        console.log(`✅ Successfully recalculated ${updated} task priority scores`);
        console.log('Please restart the server to reload the in-memory priority queue.');

    } catch (error) {
        console.error('Error recalculating priority scores:', error);
    }
}

// Run the recalculation
recalculateAllPriorityScores()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
