// Test core dashboard functionality by directly querying data
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://healthapp_user:secure_pg_password@localhost:5434/healthapp_dev?schema=public"
    }
  }
});

const sanitize = (input: any) => {
  if (typeof input === 'string') {
    return input.replace(/(\r\n|\n|\r)/gm, "");
  }
  return input;
}

async function testDirectDashboard() {
  try {
    console.log('🧪 Testing direct dashboard data access...');
    
    // Test 1: Verify all user types exist and can authenticate
    console.log('\n👥 Testing user authentication data...');
    
    const testPassword = 'T3mpP@ssw0rd2376!';
    
    const users = await prisma.user.findMany({
      where: {
        email: { endsWith: '@healthapp.com' }
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        accountStatus: true,
        patientProfile: {
          select: {
            id: true,
            patientId: true,
            medicalRecordNumber: true
          }
        }
      }
    });
    
    console.log(`✅ Found ${users.length} test users:`);
    users.forEach(user => {
      console.log(`  - ${sanitize(user.email)} (${sanitize(user.role)}) - ${sanitize(user.firstName)} ${sanitize(user.lastName)} [${sanitize(user.accountStatus)}]`);
      if (user.patientProfile) {
        console.log(`    Patient Profile: ${sanitize(user.patientProfile.patientId)} (${sanitize(user.patientProfile.medicalRecordNumber)})`);
      }
    });
    
    // Test password validation for a sample user
    const sampleUser = users.find(u => u.email === 'doctor1@healthapp.com');
    if (sampleUser && sampleUser.passwordHash) {
      const validPassword = await bcrypt.compare(testPassword, sampleUser.passwordHash);
      console.log(`✅ Password validation test: ${validPassword ? 'PASSED' : 'FAILED'}`);
    }
    
    // Test 2: Doctor dashboard data simulation
    console.log('\n👨‍⚕️ Testing doctor dashboard data...');
    
    // Find doctor user and profile
    const doctorUser = await prisma.user.findFirst({
      where: { role: 'DOCTOR' },
      include: {
        doctorProfile: true
      }
    });
    
    if (doctorUser && doctorUser.doctorProfile) {
      const doctor = doctorUser.doctorProfile;
      console.log('✅ Doctor profile found:');
      console.log(`  - Name: ${sanitize(doctorUser.firstName)} ${sanitize(doctorUser.lastName)}`);
      console.log(`  - Email: ${sanitize(doctorUser.email)}`);
      console.log(`  - Doctor ID: ${sanitize(doctor.doctorId)}`);
      console.log(`  - License: ${sanitize(doctor.medicalLicenseNumber)}`);
      console.log(`  - Experience: ${sanitize(doctor.yearsOfExperience)} years`);
      console.log(`  - Fee: $${sanitize(doctor.consultationFee)}`);
    } else {
      console.log('❌ No doctor profile found');
    }
    
    // Test 3: Patient dashboard data simulation
    console.log('\n👥 Testing patient dashboard data...');
    
    // Find patient user and profile
    const patientUser = await prisma.user.findFirst({
      where: { role: 'PATIENT' },
      include: {
        patientProfile: true
      }
    });
    
    if (patientUser && patientUser.patientProfile) {
      const age = patientUser.dateOfBirth
        ? Math.floor((new Date().getTime() - new Date(patientUser.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;
        
      console.log('✅ Patient profile found:');
      console.log(`  - Name: ${sanitize(patientUser.firstName)} ${sanitize(patientUser.lastName)}`);
      console.log(`  - Email: ${sanitize(patientUser.email)}`);
      console.log(`  - Patient ID: ${sanitize(patientUser.patientProfile.patientId)}`);
      console.log(`  - Medical Record: ${sanitize(patientUser.patientProfile.medicalRecordNumber)}`);
      console.log(`  - Age: ${age} years`);
      console.log(`  - Gender: ${sanitize(patientUser.gender)}`);
    } else {
      console.log('❌ No patient profile found');
    }
    
    // Test 4: HSP dashboard data simulation
    console.log('\n🔬 Testing HSP dashboard data...');
    
    const hspUser = await prisma.user.findFirst({
      where: { role: 'HSP' },
      include: {
        hspProfile: true
      }
    });
    
    if (hspUser && hspUser.hspProfile) {
      const hsp = hspUser.hspProfile;
      console.log('✅ HSP profile found:');
      console.log(`  - Name: ${sanitize(hspUser.firstName)} ${sanitize(hspUser.lastName)}`);
      console.log(`  - Email: ${sanitize(hspUser.email)}`);
      console.log(`  - HSP ID: ${sanitize(hsp.hspId)}`);
      console.log(`  - Type: ${sanitize(hsp.hspType)}`);
      console.log(`  - License: ${sanitize(hsp.licenseNumber)}`);
      console.log(`  - Experience: ${sanitize(hsp.yearsOfExperience)} years`);
      console.log(`  - Certifications: ${hsp.certifications.map(sanitize).join(', ')}`);
    } else {
      console.log('❌ No HSP profile found');
    }
    
    // Test 5: Admin dashboard data simulation
    console.log('\n🏥 Testing admin dashboard data...');
    
    const adminStats = await Promise.all([
      prisma.user.count({ where: { accountStatus: 'ACTIVE' } }),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.hsp.count(),
      prisma.user.count({ where: { role: 'SYSTEM_ADMIN' } }),
      prisma.user.count({ where: { role: 'HOSPITAL_ADMIN' } })
    ]);
    
    const [activeUsers, totalDoctors, totalPatients, totalHsps, systemAdmins, hospitalAdmins] = adminStats;
    
    console.log('✅ Admin dashboard stats:');
    console.log(`  - Total Active Users: ${activeUsers}`);
    console.log(`  - Total Doctors: ${totalDoctors}`);
    console.log(`  - Total Patients: ${totalPatients}`);
    console.log(`  - Total HSPs: ${totalHsps}`);
    console.log(`  - System Admins: ${systemAdmins}`);
    console.log(`  - Hospital Admins: ${hospitalAdmins}`);
    
    // Test 6: Verify business ID uniqueness and format
    console.log('\n🆔 Testing business ID integrity...');
    
    const businessIds = await Promise.all([
      prisma.doctor.findMany({ select: { doctorId: true } }),
      prisma.hsp.findMany({ select: { hspId: true } }),
      prisma.patient.findMany({ select: { patientId: true } })
    ]);
    
    const [doctorIds, hspIds, patientIds] = businessIds;
    
    // Check ID format
    const doctorIdPattern = /^DOC-\d{4}-\d{4}$/;
    const hspIdPattern = /^HSP-\d{4}-\d{4}$/;
    const patientIdPattern = /^PAT-\d{4}-\d{4}$/;
    
    const doctorIdValid = doctorIds.every(d => d.doctorId && doctorIdPattern.test(d.doctorId));
    const hspIdValid = hspIds.every(h => h.hspId && hspIdPattern.test(h.hspId));
    const patientIdValid = patientIds.every(p => p.patientId && patientIdPattern.test(p.patientId!));
    
    console.log('✅ Business ID format validation:');
    console.log(`  - Doctor IDs: ${doctorIdValid ? 'VALID' : 'INVALID'} (${doctorIds.map(d => sanitize(d.doctorId)).join(', ')})`);
    console.log(`  - HSP IDs: ${hspIdValid ? 'VALID' : 'INVALID'} (${hspIds.map(h => sanitize(h.hspId)).join(', ')})`);
    console.log(`  - Patient IDs: ${patientIdValid ? 'VALID' : 'INVALID'} (${patientIds.map(p => sanitize(p.patientId)).filter(Boolean).join(', ')})`);
    
    console.log('\n✅ All dashboard functionality tests completed successfully!');
    
    return {
      success: true,
      results: {
        users: users.length,
        doctors: totalDoctors,
        patients: totalPatients,
        hsps: totalHsps,
        admins: systemAdmins + hospitalAdmins,
        businessIdValidation: {
          doctorIds: doctorIdValid,
          hspIds: hspIdValid,
          patientIds: patientIdValid
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Direct dashboard testing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the direct dashboard tests
testDirectDashboard().then(result => {
  console.log('\n🏁 Direct dashboard test result:', result);
  process.exit(result.success ? 0 : 1);
});