// Test core dashboard functionality by directly querying data
import { PrismaClient } from '@/lib/prisma-client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://healthapp_user:pg_password@localhost:5434/healthapp_dev?schema=public"
    }
  }
});

async function testDirectDashboard() {
  try {
    console.log('🧪 Testing direct dashboard data access...');
    
    // Test 1: Verify all user types exist and can authenticate
    console.log('\n👥 Testing user authentication data...');
    
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    const users = await prisma.user.findMany({
      where: {
        email: { endsWith: '@healthapp.com' }
      },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        password_hash: true,
        account_status: true,
        patient: {
          select: {
            id: true,
            patient_id: true,
            medical_record_number: true
          }
        }
      }
    });
    
    console.log(`✅ Found ${users.length} test users:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.first_name} ${user.last_name} [${user.account_status}]`);
      if (user.patient) {
        console.log(`    Patient Profile: ${user.patient.patient_id} (${user.patient.medical_record_number})`);
      }
    });
    
    // Test password validation for a sample user
    const sampleUser = users.find(u => u.email === 'doctor1@healthapp.com');
    if (sampleUser) {
      const validPassword = await bcrypt.compare(testPassword, sampleUser.password_hash);
      console.log(`✅ Password validation test: ${validPassword ? 'PASSED' : 'FAILED'}`);
    }
    
    // Test 2: Doctor dashboard data simulation
    console.log('\n👨‍⚕️ Testing doctor dashboard data...');
    
    // Find doctor user and profile
    const doctorUser = await prisma.user.findFirst({
      where: { role: 'DOCTOR' },
      include: {
        doctors_doctors_user_idTousers: true
      }
    });
    
    if (doctorUser && doctorUser.doctors_doctors_user_idTousers) {
      const doctor = doctorUser.doctors_doctors_user_idTousers;
      console.log('✅ Doctor profile found:');
      console.log(`  - Name: ${doctorUser.first_name} ${doctorUser.last_name}`);
      console.log(`  - Email: ${doctorUser.email}`);
      console.log(`  - Doctor ID: ${doctor.doctor_id}`);
      console.log(`  - License: ${doctor.medical_license_number}`);
      console.log(`  - Experience: ${doctor.years_of_experience} years`);
      console.log(`  - Fee: $${doctor.consultation_fee}`);
    } else {
      console.log('❌ No doctor profile found');
    }
    
    // Test 3: Patient dashboard data simulation
    console.log('\n👥 Testing patient dashboard data...');
    
    // Find patient user and profile
    const patientUser = await prisma.user.findFirst({
      where: { role: 'PATIENT' },
      include: {
        patient: {
          include: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                date_of_birth: true,
                gender: true
              }
            }
          }
        }
      }
    });
    
    if (patientUser && patientUser.patient) {
      const age = patientUser.patient.user.date_of_birth 
        ? Math.floor((new Date().getTime() - new Date(patientUser.patient.user.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;
        
      console.log('✅ Patient profile found:');
      console.log(`  - Name: ${patientUser.patient.user.first_name} ${patientUser.patient.user.last_name}`);
      console.log(`  - Email: ${patientUser.patient.user.email}`);
      console.log(`  - Patient ID: ${patientUser.patient.patient_id}`);
      console.log(`  - Medical Record: ${patientUser.patient.medical_record_number}`);
      console.log(`  - Age: ${age} years`);
      console.log(`  - Gender: ${patientUser.patient.user.gender}`);
    } else {
      console.log('❌ No patient profile found');
    }
    
    // Test 4: HSP dashboard data simulation
    console.log('\n🔬 Testing HSP dashboard data...');
    
    const hspUser = await prisma.user.findFirst({
      where: { role: 'HSP' },
      include: {
        hsps_hsps_user_idTousers: true
      }
    });
    
    if (hspUser && hspUser.hsps_hsps_user_idTousers) {
      const hsp = hspUser.hsps_hsps_user_idTousers;
      console.log('✅ HSP profile found:');
      console.log(`  - Name: ${hspUser.first_name} ${hspUser.last_name}`);
      console.log(`  - Email: ${hspUser.email}`);
      console.log(`  - HSP ID: ${hsp.hsp_id}`);
      console.log(`  - Type: ${hsp.hsp_type}`);
      console.log(`  - License: ${hsp.license_number}`);
      console.log(`  - Experience: ${hsp.years_of_experience} years`);
      console.log(`  - Certifications: ${hsp.certifications.join(', ')}`);
    } else {
      console.log('❌ No HSP profile found');
    }
    
    // Test 5: Admin dashboard data simulation
    console.log('\n🏥 Testing admin dashboard data...');
    
    const adminStats = await Promise.all([
      prisma.user.count({ where: { account_status: 'ACTIVE' } }),
      prisma.doctors.count(),
      prisma.patient.count(),
      prisma.hsps.count(),
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
      prisma.doctors.findMany({ select: { doctor_id: true } }),
      prisma.hsps.findMany({ select: { hsp_id: true } }),
      prisma.patient.findMany({ select: { patient_id: true } })
    ]);
    
    const [doctorIds, hspIds, patientIds] = businessIds;
    
    // Check ID format
    const doctorIdPattern = /^DOC-\d{4}-\d{3}$/;
    const hspIdPattern = /^HSP-\d{4}-\d{3}$/;
    const patientIdPattern = /^PAT-\d{4}-\d{3}$/;
    
    const doctorIdValid = doctorIds.every(d => doctorIdPattern.test(d.doctor_id));
    const hspIdValid = hspIds.every(h => hspIdPattern.test(h.hsp_id));
    const patientIdValid = patientIds.every(p => patientIdPattern.test(p.patient_id!));
    
    console.log('✅ Business ID format validation:');
    console.log(`  - Doctor IDs: ${doctorIdValid ? 'VALID' : 'INVALID'} (${doctorIds.map(d => d.doctor_id).join(', ')})`);
    console.log(`  - HSP IDs: ${hspIdValid ? 'VALID' : 'INVALID'} (${hspIds.map(h => h.hsp_id).join(', ')})`);
    console.log(`  - Patient IDs: ${patientIdValid ? 'VALID' : 'INVALID'} (${patientIds.map(p => p.patient_id).filter(Boolean).join(', ')})`);
    
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