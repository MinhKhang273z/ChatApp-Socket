// Test script to check authentication
const API_URL = 'http://localhost:3001';

async function testRegister() {
  try {
    console.log('Testing registration...');
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser3',
        email: 'test3@test.com',
        password: '123456',
      }),
    });

    const data = await response.json();
    console.log('Register response:', data);
    console.log('Status:', response.status);
    return data.token;
  } catch (error) {
    console.error('Register error:', error);
  }
}

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: '123456',
      }),
    });

    const data = await response.json();
    console.log('Login response:', data);
    console.log('Status:', response.status);
    return data.token;
  } catch (error) {
    console.error('Login error:', error);
  }
}

async function main() {
  await testRegister();
  await testLogin();
}

main();
