const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://sahasra:chronodex@cluster0.yr4uk0p.mongodb.net/?appName=Cluster0';

async function clearAllTasks() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        // Mongoose default database is usually 'test' if not specified in URI
        const database = client.db('test');
        const tasks = database.collection('tasks');

        const count = await tasks.countDocuments();
        console.log(`Found ${count} tasks in 'test' database`);

        if (count > 0) {
            const result = await tasks.deleteMany({});
            console.log(`✅ Deleted ${result.deletedCount} tasks from 'test' database`);
        } else {
            console.log('No tasks found in test database. Checking other databases...');

            const adminDb = client.db().admin();
            const dbs = await adminDb.listDatabases();

            for (const dbInfo of dbs.databases) {
                if (dbInfo.name !== 'local' && dbInfo.name !== 'admin' && dbInfo.name !== 'test') {
                    const db = client.db(dbInfo.name);
                    const collection = db.collection('tasks');
                    const dbCount = await collection.countDocuments();

                    if (dbCount > 0) {
                        const res = await collection.deleteMany({});
                        console.log(`✅ Deleted ${res.deletedCount} tasks from '${dbInfo.name}' database`);
                    }
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

clearAllTasks();
