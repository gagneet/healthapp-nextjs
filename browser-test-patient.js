// BROWSER TEST SCRIPT FOR PATIENT CREATION
// Copy and paste this into the browser console when logged in as doctor@healthapp.com

// Test patient data similar to what was failing
const testPatientData = {
  firstName: "Test",
  middleName: "M", 
  lastName: "Patient",
  email: "test.patient@example.com",
  phone: "9876543210",
  gender: "MALE",
  dateOfBirth: "1990-01-01",
  height: 175, // Changed from null to actual number
  weight: 70,  // Changed from null to actual number
  
  // Optional fields
  allergies: "None known",
  emergency_contacts: [],
  insurance_information: {}
};

console.log('Testing patient creation with data:', testPatientData);

// Make the API call
fetch('/api/patients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Session cookies will be sent automatically
  },
  body: JSON.stringify(testPatientData)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('SUCCESS! Patient created:', data);
})
.catch(error => {
  console.error('ERROR creating patient:', error);
});

// Alternative test with minimal data
const minimalTestData = {
  firstName: "Minimal",
  lastName: "Test",
  email: "minimal.test@example.com", 
  phone: "9876543211",
  dateOfBirth: "1985-01-01"
};

console.log('Testing minimal patient data:', minimalTestData);

fetch('/api/patients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(minimalTestData)
})
.then(response => {
  console.log('Minimal test response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('SUCCESS! Minimal patient created:', data);
})
.catch(error => {
  console.error('ERROR creating minimal patient:', error);
});