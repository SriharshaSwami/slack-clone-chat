// Using built-in fetch in Node 22
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function testDelete() {
  console.log('--- Step 1: Login ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testuser1@mail.com', password: 'testuser1' })
  });
  
  const loginData = await loginRes.json();
  console.log('Login Response:', JSON.stringify(loginData, null, 2));
  
  if (!loginRes.ok) {
    console.error('Login failed!');
    return;
  }
  
  // Extract cookie
  const cookie = loginRes.headers.get('set-cookie');
  console.log('Cookie obtained:', cookie);
  
  console.log('\n--- Step 2: Delete Channel ---');
  // Use the ID for 'mern' channel found earlier
  const channelId = '69b9117bd046f4a0db6caace'; 
  
  const deleteRes = await fetch(`${BASE_URL}/channels/${channelId}`, {
    method: 'DELETE',
    headers: { 
      'Cookie': cookie,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Delete Status:', deleteRes.status);
  if (deleteRes.status !== 204) {
    const errorData = await deleteRes.json();
    console.log('Delete Error Response:', JSON.stringify(errorData, null, 2));
  } else {
    console.log('Successfully deleted channel (204 No Content)');
  }
}

testDelete();
