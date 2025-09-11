const https = require('https');

// Create a test patient data object similar to what the form sends
const patientData = {
  firstName: "John",
  middleName: "",
  lastName: "Doe",
  email: "john.doe.test@example.com",
  phone: "9876543210",
  gender: "MALE",
  dateOfBirth: "1990-01-01",
  height: 175,
  weight: 70,
  medicalRecordNumber: "TEST123",
  allergies: "None known",
  emergency_contacts: [],
  insurance_information: {}
};

const postData = JSON.stringify(patientData);

// Test credentials - you'll need to get a valid session token
// For now, this will fail with 401, but we can see the API structure
const options = {
  hostname: 'healthapp.gagneet.com',
  port: 443,
  path: '/api/patients',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  },
  rejectUnauthorized: false // For testing only
};

console.log('Testing patient creation API...');
console.log('Sending data:', JSON.stringify(patientData, null, 2));

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\n--- Response ---');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('\nParsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();