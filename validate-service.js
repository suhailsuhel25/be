const http = require('http');

/**
 * Validates if a service is running on localhost:5000
 * @returns {Promise<boolean>} - True if service is accessible, false otherwise
 */
function validateService() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET',
      timeout: 5000 // 5 seconds timeout
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on('error', (e) => {
      console.error(`Error connecting to localhost:5000: ${e.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('Request to localhost:5000 timed out');
      req.destroy();
      resolve(false);
    });

    req.setTimeout(options.timeout);
    req.end();
  });
}

// Run validation
async function runValidation() {
  console.log('Validating service on localhost:5000...');
  
  const isRunning = await validateService();
  
  if (isRunning) {
    console.log('✅ Service is running and accessible on localhost:5000');
    process.exit(0);
  } else {
    console.log('❌ Service is not accessible on localhost:5000');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runValidation();
}

module.exports = { validateService };