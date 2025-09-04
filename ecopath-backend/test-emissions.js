// Test script for Emissions Calculator API
const http = require('http');

console.log('🌱 Emissions Calculator API - Testing');
console.log('=====================================\n');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TESTS = [
  {
    name: '✅ Get Supported Units',
    method: 'GET',
    path: '/api/emissions/supported-units',
    expectedStatus: 200,
    description: 'Should return supported time units and units for energy and transport'
  },
  {
    name: '✅ Get Emissions Factors - VIC',
    method: 'GET',
    path: '/api/emissions/factors?state=VIC',
    expectedStatus: 200,
    description: 'Should return emissions factors for Victoria'
  },
  {
    name: '✅ Get Emissions Factors - NSW',
    method: 'GET',
    path: '/api/emissions/factors?state=NSW',
    expectedStatus: 200,
    description: 'Should return emissions factors for New South Wales'
  },
  {
    name: '✅ Calculate Energy Only - Monthly',
    method: 'POST',
    path: '/api/emissions/calculate',
    body: {
      energy: {
        electricity: 100,
        gas: 50,
        timeUnit: 'month'
      },
      state: 'VIC'
    },
    expectedStatus: 200,
    description: 'Should calculate emissions for monthly energy usage in Victoria'
  },
  {
    name: '✅ Calculate Transport Only - Weekly',
    method: 'POST',
    path: '/api/emissions/calculate',
    body: {
      transport: {
        mode: 'car',
        distance: 20,
        timeUnit: 'week',
        frequency: 5
      },
      state: 'VIC'
    },
    expectedStatus: 200,
    description: 'Should calculate emissions for weekly car usage in Victoria'
  },
  {
    name: '✅ Calculate Both Energy and Transport - Quarterly',
    method: 'POST',
    path: '/api/emissions/calculate',
    body: {
      energy: {
        electricity: 300,
        gas: 150,
        timeUnit: 'quarter'
      },
      transport: {
        mode: 'train',
        distance: 15,
        timeUnit: 'quarter',
        frequency: 60
      },
      state: 'NSW'
    },
    expectedStatus: 200,
    description: 'Should calculate total emissions for quarterly energy and transport in NSW'
  },
  {
    name: '✅ Calculate with Partial Data - Only Electricity',
    method: 'POST',
    path: '/api/emissions/calculate',
    body: {
      energy: {
        electricity: 200,
        timeUnit: 'year'
      },
      state: 'SA'
    },
    expectedStatus: 200,
    description: 'Should calculate emissions with only electricity data (no gas)'
  },
  {
    name: '✅ Calculate with Partial Data - Only Transport',
    method: 'POST',
    path: '/api/emissions/calculate',
    body: {
      transport: {
        mode: 'bicycle',
        distance: 10,
        timeUnit: 'day'
      },
      state: 'TAS'
    },
    expectedStatus: 200,
    description: 'Should calculate emissions with only transport data (no energy)'
  },
  {
    name: '❌ Missing State Parameter',
    method: 'POST',
    path: '/api/emissions/calculate',
    body: {
      energy: {
        electricity: 100,
        timeUnit: 'month'
      }
    },
    expectedStatus: 400,
    description: 'Should return 400 for missing state parameter'
  },
  {
    name: '❌ No Data Provided',
    method: 'POST',
    path: '/api/emissions/calculate',
    body: {
      state: 'VIC'
    },
    expectedStatus: 400,
    description: 'Should return 400 when no energy or transport data is provided'
  },
  {
    name: '❌ Invalid State Code',
    method: 'POST',
    path: '/api/emissions/calculate',
    body: {
      energy: {
        electricity: 100,
        timeUnit: 'month'
      },
      state: 'XYZ'
    },
    expectedStatus: 400,
    description: 'Should return 400 for invalid state code'
  },
  {
    name: '❌ Missing State in Factors',
    method: 'GET',
    path: '/api/emissions/factors',
    expectedStatus: 400,
    description: 'Should return 400 for missing state parameter in factors endpoint'
  }
];

// Test function
function runTest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: test.path,
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const success = res.statusCode === test.expectedStatus;
        const status = success ? '✅ PASS' : '❌ FAIL';
        
        console.log(`${status} ${test.name}`);
        console.log(`   Method: ${test.method} ${test.path}`);
        console.log(`   Expected: ${test.expectedStatus}, Got: ${res.statusCode}`);
        console.log(`   Description: ${test.description}`);
        
        if (data) {
          try {
            const jsonData = JSON.parse(data);
            if (success && test.expectedStatus === 200) {
              if (test.method === 'POST' && test.path.includes('/api/emissions/calculate')) {
                console.log(`   Total Emissions: ${jsonData.totalEmissions} kg CO2-e`);
                console.log(`   Time Unit: ${jsonData.timeUnit}`);
                if (jsonData.breakdown.energy) {
                  console.log(`   Energy Emissions: ${jsonData.breakdown.energy.total} kg CO2-e`);
                }
                if (jsonData.breakdown.transport) {
                  console.log(`   Transport Emissions: ${jsonData.breakdown.transport.total} kg CO2-e`);
                }
              } else if (test.method === 'GET' && test.path.includes('/api/emissions/factors')) {
                console.log(`   State: ${jsonData.state}`);
                console.log(`   Electricity Factor: ${jsonData.electricity} kg CO2-e/kWh`);
                console.log(`   Gas Factor: ${jsonData.gas} kg CO2-e/kWh`);
              } else if (test.method === 'GET' && test.path.includes('/api/emissions/supported-units')) {
                console.log(`   Energy Time Units: ${jsonData.energy.timeUnits.join(', ')}`);
                console.log(`   Transport Time Units: ${jsonData.transport.timeUnits.join(', ')}`);
                console.log(`   Transport Modes: ${jsonData.transport.modes.join(', ')}`);
              }
            } else if (!success) {
              console.log(`   Error: ${jsonData.error}`);
              if (jsonData.message) {
                console.log(`   Message: ${jsonData.message}`);
              }
            }
          } catch (e) {
            console.log(`   Raw Response: ${data.substring(0, 100)}...`);
          }
        }
        console.log('');
        resolve(success);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ FAIL ${test.name}`);
      console.log(`   Network Error: ${error.message}`);
      console.log(`   Description: ${test.description}`);
      console.log('');
      resolve(false);
    });

    if (test.body && test.method === 'POST') {
      req.write(JSON.stringify(test.body));
    }

    req.end();
  });
}

// Health check function
function checkServerHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/healthz',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Server is running and accessible');
          resolve(true);
        } else {
          console.log('❌ Server responded but with error status');
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.log('❌ Cannot connect to server. Make sure the backend is running on port 3001.');
      resolve(false);
    });

    req.end();
  });
}

// Main test runner
async function runAllTests() {
  console.log('Checking server health...\n');
  
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.log('Please start the server first using: npm run dev:back');
    console.log('Then run this test script again.');
    return;
  }

  console.log('Running all emissions calculator tests...\n');
  
  let passedTests = 0;
  let totalTests = TESTS.length;

  for (const test of TESTS) {
    const passed = await runTest(test);
    if (passed) passedTests++;
  }

  console.log('=====================================');
  console.log(`Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The Emissions Calculator API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests
runAllTests().catch(console.error);

