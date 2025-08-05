#!/usr/bin/env node

import jwt from 'jsonwebtoken';
import axios from 'axios';

const API_BASE = 'http://192.168.0.148:3001/api';

async function debugJWT() {
  try {
    console.log('🔍 JWT Debug Session');
    
    // Get a fresh token
    console.log('\n1. Getting fresh token...');
    const loginResponse = await axios.post(`${API_BASE}/auth/sign-in`, {
      email: 'doctor@healthapp.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.payload.tokens.accessToken;
    console.log('Token received:', token);
    
    // Decode without verification to see payload
    console.log('\n2. Decoding token (without verification)...');
    const decoded = jwt.decode(token, { complete: true });
    console.log('Header:', decoded.header);
    console.log('Payload:', decoded.payload);
    
    // Try to verify with different secrets
    console.log('\n3. Testing JWT verification with different secrets...');
    
    const possibleSecrets = [
      'your-super-secret-jwt-key', // Default from jwt.js
      'dev-jwt-secret-key-change-in-production', // From docker-compose
      'dev-25af6001e43881f727388f44e0f6fff837510b0649fe9393987f009c595156f778442654270516863b00617b478aa46dea6311f74fb95325d3c9a344b125d033' // From container
    ];
    
    for (const secret of possibleSecrets) {
      try {
        const verified = jwt.verify(token, secret);
        console.log(`✅ SUCCESS with secret: ${secret.substring(0, 20)}...`);
        console.log('Verified payload:', verified);
        break;
      } catch (error) {
        console.log(`❌ FAILED with secret: ${secret.substring(0, 20)}... - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugJWT();