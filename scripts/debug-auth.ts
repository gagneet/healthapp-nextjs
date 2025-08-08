#!/usr/bin/env node

import axios from 'axios';

const API_BASE = 'http://192.168.0.148:3001/api';

async function testAuth() {
  try {
    console.log('🔐 Testing authentication flow...');
    
    // Step 1: Login
    console.log('\n1. Attempting login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/sign-in`, {
      email: 'doctor@healthapp.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful');
    console.log('Response status:', loginResponse.data.status);
    
    if (!loginResponse.data.payload?.tokens?.accessToken) {
      console.error('❌ No access token in response');
      return;
    }
    
    const token = loginResponse.data.payload.tokens.accessToken;
    console.log('🎫 Token received:', token.substring(0, 50) + '...');
    
    // Step 2: Verify token
    console.log('\n2. Testing token verification...');
    try {
      const verifyResponse = await axios.get(`${API_BASE}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Token verification successful');
      console.log('Verify status:', verifyResponse.data.status);
    } catch (verifyError) {
      console.error('❌ Token verification failed:', (verifyError as any).response?.data || (verifyError as any).message);
    }
    
    // Step 3: Test patients endpoint
    console.log('\n3. Testing patients endpoint...');
    try {
      const patientsResponse = await axios.get(`${API_BASE}/patients/pagination?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Patients endpoint successful');
      console.log('Patients status:', patientsResponse.data.status);
    } catch (patientsError) {
      console.error('❌ Patients endpoint failed:', (patientsError as any).response?.data || (patientsError as any).message);
    }
    
  } catch (error) {
    console.error('❌ Login failed:', (error as any).response?.data || (error as any).message);
  }
}

testAuth();