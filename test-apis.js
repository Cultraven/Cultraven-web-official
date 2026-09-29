const http = require('http');

function testEndpoint(path, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', (e) => resolve({ status: 500, error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Testing APIs...');
  
  const res1 = await testEndpoint('/api/products');
  console.log('GET /api/products -> ' + res1.status);
  
  const res2 = await testEndpoint('/api/orders');
  console.log('GET /api/orders -> ' + res2.status);
  
  const res3 = await testEndpoint('/api/auth/admin-login', 'POST', { email: 'admin@cultraven.com', password: 'password123' });
  console.log('POST /api/auth/admin-login -> ' + res3.status);
  
  const res4 = await testEndpoint('/api/auth/login', 'POST', { email: 'test@example.com', password: 'password123' });
  console.log('POST /api/auth/login -> ' + res4.status);
}

run();
