const axios = require('axios');

/**
 * Validates if a backend service is running on localhost:5000
 * @param {string} url - The URL to validate (default: http://localhost:5000)
 * @returns {Promise<boolean>} - True if service is accessible, false otherwise
 */
async function validateBackendService(url = 'http://localhost:5000') {
  try {
    console.log(`Validating service on ${url}...`);
    
    // Test the root endpoint
    const response = await axios.get(url, { timeout: 5000 });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Service is running on ${url}`);
    console.log(`✅ Response headers: Content-Type=${response.headers['content-type']}`);
    
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`❌ Connection refused. No service running on ${url}`);
    } else if (error.code === 'ECONNRESET') {
      console.error(`❌ Connection reset by server on ${url}`);
    } else if (error.code === 'ENOTFOUND') {
      console.error(`❌ Host not found: ${url}`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`❌ Request timed out for ${url}`);
    } else {
      console.error(`❌ Error connecting to ${url}: ${error.message}`);
    }
    
    return false;
  }
}

/**
 * Validates multiple endpoints of the backend service
 * @param {string} baseUrl - Base URL of the service (default: http://localhost:5000)
 * @returns {Promise<boolean>} - True if all endpoints are accessible, false otherwise
 */
async function validateMultipleEndpoints(baseUrl = 'http://localhost:5000') {
  const endpoints = ['/', '/health', '/api/status'];
  let allValid = true;
  
  console.log(`\nValidating multiple endpoints on ${baseUrl}:`);
  
  for (const endpoint of endpoints) {
    try {
      const url = `${baseUrl}${endpoint}`;
      const response = await axios.get(url, { timeout: 5000 });
      
      console.log(`✅ ${endpoint}: ${response.status} - OK`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response ? error.response.status : error.code || 'ERROR'} - FAILED`);
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Complete service validation
 */
async function completeValidation() {
  const isServiceRunning = await validateBackendService();
  
  if (isServiceRunning) {
    console.log('\nService is running. Checking multiple endpoints...');
    const endpointsValid = await validateMultipleEndpoints();
    
    if (endpointsValid) {
      console.log('\n🎉 All endpoints are accessible! Service is fully operational.');
      return true;
    } else {
      console.log('\n⚠️  Some endpoints are not accessible, but service is running.');
      return false;
    }
  } else {
    console.log('\n❌ Service is not accessible. Please check if the backend is running on localhost:5000');
    return false;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  completeValidation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation error:', error);
      process.exit(1);
    });
}

module.exports = {
  validateBackendService,
  validateMultipleEndpoints,
  completeValidation
};