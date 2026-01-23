const axios = require('axios');

async function checkPriorityRoute() {
  try {
    console.log('Testing GET http://localhost:5000/api/tasks/priority...');
    const response = await axios.get('http://localhost:5000/api/tasks/priority');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

checkPriorityRoute();
