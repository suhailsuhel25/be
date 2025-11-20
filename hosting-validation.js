const axios = require('axios');

/**
 * Validates if a backend service is running on a specific URL
 * @param {string} url - The URL to validate (default: http://localhost:5000)
 * @param {number} timeout - Request timeout in milliseconds (default: 5000)
 * @returns {Promise<Object>} - Validation result with details
 */
async function validateBackendService(url = 'http://localhost:5000', timeout = 5000) {
  const startTime = Date.now();
  
  try {
    console.log(`Validating service on ${url}...`);
    
    const response = await axios.get(url, { 
      timeout: timeout,
      validateStatus: (status) => status < 500 // Accept any status < 500 as valid for basic connectivity
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Response time: ${responseTime}ms`);
    console.log(`✅ Service is running on ${url}`);
    
    return {
      success: true,
      status: response.status,
      responseTime,
      headers: response.headers,
      data: response.data,
      url
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    let errorMessage = '';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = `Connection refused. No service running on ${url}`;
    } else if (error.code === 'ECONNRESET') {
      errorMessage = `Connection reset by server on ${url}`;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = `Host not found: ${url}`;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = `Request timed out after ${timeout}ms for ${url}`;
    } else if (error.response) {
      // Server responded with error status
      errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
    } else {
      errorMessage = `Error connecting to ${url}: ${error.message}`;
    }
    
    console.error(`❌ ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
      responseTime,
      url,
      status: error.response ? error.response.status : null
    };
  }
}

/**
 * Validates multiple critical endpoints of the backend service
 * @param {string} baseUrl - Base URL of the service (default: http://localhost:5000)
 * @returns {Promise<Object>} - Object containing validation results for all endpoints
 */
async function validateMultipleEndpoints(baseUrl = 'http://localhost:5000') {
  const endpoints = [
    { path: '/', name: 'Home' },
    { path: '/health', name: 'Health Check' },
    { path: '/api/status', name: 'API Status' },
    { path: '/api/health', name: 'API Health' },
    { path: '/status', name: 'Status' }
  ];
  
  const results = {
    baseUrl,
    timestamp: new Date().toISOString(),
    endpoints: []
  };
  
  console.log(`\nValidating multiple endpoints on ${baseUrl}:`);
  
  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.path}`;
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      console.log(`✅ ${endpoint.name} (${endpoint.path}): ${response.status} - ${responseTime}ms`);
      
      results.endpoints.push({
        path: endpoint.path,
        name: endpoint.name,
        status: response.status,
        responseTime,
        success: response.status >= 200 && response.status < 300,
        data: response.data
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      let status = 'ERROR';
      if (error.response) {
        status = error.response.status;
      } else if (error.code) {
        status = error.code;
      }
      
      console.log(`❌ ${endpoint.name} (${endpoint.path}): ${status} - ${responseTime}ms`);
      
      results.endpoints.push({
        path: endpoint.path,
        name: endpoint.name,
        status: status,
        responseTime,
        success: false,
        error: error.message
      });
    }
  }
  
  // Calculate summary
  const successfulEndpoints = results.endpoints.filter(ep => ep.success).length;
  results.summary = {
    total: endpoints.length,
    successful: successfulEndpoints,
    failed: endpoints.length - successfulEndpoints,
    successRate: Math.round((successfulEndpoints / endpoints.length) * 100)
  };
  
  console.log(`\nEndpoint Validation Summary:`);
  console.log(`  Successful: ${results.summary.successful}/${results.summary.total} (${results.summary.successRate}%)`);
  
  return results;
}

/**
 * Performs comprehensive hosting service validation
 * @param {string} url - URL of the service to validate
 * @returns {Promise<Object>} - Comprehensive validation result
 */
async function comprehensiveHostValidation(url = 'http://localhost:5000') {
  console.log(`\n🔍 Starting comprehensive hosting validation for: ${url}`);
  console.log(`='.repeat(60)}`);
  
  // Basic connectivity test
  const basicResult = await validateBackendService(url);
  
  if (!basicResult.success) {
    console.log(`\n❌ Service is not accessible. Skipping additional tests.`);
    return {
      url,
      timestamp: new Date().toISOString(),
      basicConnectivity: basicResult,
      detailedValidation: null,
      overallStatus: 'FAILED'
    };
  }
  
  // Detailed endpoint validation
  const detailedResult = await validateMultipleEndpoints(url);
  
  // Determine overall status
  const overallStatus = detailedResult.summary.successRate === 100 ? 'HEALTHY' : 
                       detailedResult.summary.successRate >= 50 ? 'DEGRADED' : 'UNHEALTHY';
  
  console.log(`\n🎉 Overall Service Status: ${overallStatus}`);
  console.log(`='.repeat(60)}`);
  
  return {
    url,
    timestamp: new Date().toISOString(),
    basicConnectivity: basicResult,
    detailedValidation: detailedResult,
    overallStatus
  };
}

/**
 * Validation for hosting environment with multiple checks
 */
async function hostingValidation(baseUrl = 'http://localhost:5000') {
  console.log('🌐 Hosting Service Validation Suite');
  console.log('='.repeat(40));
  
  const result = await comprehensiveHostValidation(baseUrl);
  
  // Exit with appropriate code
  const exitCode = result.overallStatus === 'HEALTHY' ? 0 : 1;
  
  return { result, exitCode };
}

// Run validation if this file is executed directly
if (require.main === module) {
  const targetUrl = process.argv[2] || 'http://localhost:5000';
  
  hostingValidation(targetUrl)
    .then(({ exitCode }) => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Validation error:', error);
      process.exit(1);
    });
}

module.exports = {
  validateBackendService,
  validateMultipleEndpoints,
  comprehensiveHostValidation,
  hostingValidation
};