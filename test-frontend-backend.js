// Simple test to verify frontend can reach backend
const testFrontendBackend = async () => {
  const API_URL = 'http://localhost:3001';
  
  console.log('Testing connection to backend...');
  console.log('API_URL:', API_URL);
  
  try {
    // Test health endpoint
    const health = await fetch(`${API_URL}/health`);
    console.log('Health check:', health.status);
    
    // Test login endpoint with wrong credentials
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: '123456',
      }),
    });
    
    console.log('Login response status:', loginResponse.status);
    const data = await loginResponse.json();
    console.log('Login response data:', data);
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testFrontendBackend();
