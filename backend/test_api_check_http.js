const http = require('http');

function checkRoute(path) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'GET'
  };

  console.log(`Testing GET ${path}...`);
  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => { console.log('BODY:', data); });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });
  req.end();
}

checkRoute('/api/tasks/antigravity_ping');
setTimeout(() => checkRoute('/api/tasks/priority'), 1000);
