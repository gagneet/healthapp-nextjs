#!/usr/bin/env node

import axios from 'axios';

const API_BASE = 'http://192.168.0.148:3001/api';
// Use the token from our successful JWT debug
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MjY5N2ExZi1mYjkxLTRiMTgtYWVjNi00ZjE4OTMxNjZlN2IiLCJ1c2VyQ2F0ZWdvcnkiOiJET0NUT1IiLCJwZXJtaXNzaW9ucyI6W10sImlhdCI6MTc1NDM3OTMzNSwiZXhwIjoxNzU0NDY1NzM1fQ.hsSW-_DyvGpdtNCk3vvlB1OLqOCKummjlcT7K5d74SE';

async function testEndpoints() {
  console.log('🔐 Testing endpoints with known good token...');
  
  // Test verify endpoint
  console.log('\n1. Testing /auth/verify...');
  try {
    const verifyResponse = await axios.get(`${API_BASE}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Token verification successful');
    console.log('Status:', verifyResponse.data.status);
  } catch (error) {
    console.error('❌ Token verification failed:', error.response?.data || error.message);
  }
  
  // Test patients endpoint
  console.log('\n2. Testing /patients/pagination...');
  try {
    const patientsResponse = await axios.get(`${API_BASE}/patients/pagination?page=1&limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Patients endpoint successful');
    console.log('Status:', patientsResponse.data.status);
    console.log('Patients count:', patientsResponse.data.payload?.data?.patients ? Object.keys(patientsResponse.data.payload.data.patients).length : 0);
  } catch (error) {
    console.error('❌ Patients endpoint failed:', error.response?.data || error.message);
  }
}

testEndpoints();