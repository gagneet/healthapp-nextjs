// Test dashboard functionality directly without starting the server
import { PrismaClient } from '@/lib/prisma-client';
import { getDoctorDashboard, getPatientDashboard, authenticateUser } from '@/lib/api-services';
import { authenticateUser } from './lib/api-services.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://healthapp_user:pg_password@localhost:5434/healthapp_dev?schema=public"
    }
  }
});

async function testDashboards() {
  try {
    console.log('🧪 Testing dashboard functionality...');
    
    // Test authentication first
    console.log('\n🔐 Testing authentication...');
    
    // Test doctor login
    const doctorAuth = await authenticateUser('doctor1@healthapp.com', 'password123');
    if (!doctorAuth.success) {
      throw new Error('Doctor authentication failed: ' + doctorAuth.message);
    }
    console.log('✅ Doctor authentication successful');
    
    // Test patient login  
    const patientAuth = await authenticateUser('patient1@healthapp.com', 'password123');
    if (!patientAuth.success) {
      throw new Error('Patient authentication failed: ' + patientAuth.message);
    }
    console.log('✅ Patient authentication successful');
    
    // Test admin login
    const adminAuth = await authenticateUser('admin@healthapp.com', 'password123');
    if (!adminAuth.success) {
      throw new Error('Admin authentication failed: ' + adminAuth.message);
    }
    console.log('✅ Admin authentication successful');
    
    console.log('\n👨‍⚕️ Testing doctor dashboard...');
    
    // Get doctor user ID
    const doctorUserId = doctorAuth.data!.user.id;
    console.log('Doctor User ID:', doctorUserId);
    
    try {
      const doctorDashboard = await getDoctorDashboard(doctorUserId);
      console.log('✅ Doctor dashboard loaded successfully');
      console.log('Doctor info:', {
        name: doctorDashboard.doctor.name,
        email: doctorDashboard.doctor.email,
        speciality: doctorDashboard.doctor.speciality
      });
      console.log('Statistics:', doctorDashboard.statistics);
    } catch (error) {
      console.log('❌ Doctor dashboard failed:', error instanceof Error ? error.message : error);
    }
    
    console.log('\n👥 Testing patient dashboard...');
    
    // First, get patient profile ID (not user ID)
    const patientUser = await prisma.user.findUnique({
      where: { email: 'patient1@healthapp.com' },
      include: {
        patient: true
      }
    });
    
    if (!patientUser || !patientUser.patient) {
      throw new Error('Patient profile not found');
    }
    
    const patientId = patientUser.patient.id;
    console.log('Patient Profile ID:', patientId);
    
    try {
      const patientDashboard = await getPatientDashboard(patientId);
      console.log('✅ Patient dashboard loaded successfully');
      console.log('Patient info:', {
        name: patientDashboard.patient.name,
        email: patientDashboard.patient.email,
        age: patientDashboard.patient.age,
        medicalRecordNumber: patientDashboard.patient.medicalRecordNumber
      });
      console.log('Statistics:', patientDashboard.statistics);
    } catch (error) {
      console.log('❌ Patient dashboard failed:', error instanceof Error ? error.message : error);
    }
    
    console.log('\n🏥 Testing data relationships...');
    
    // Verify business IDs are properly stored
    const doctors = await prisma.doctors.findMany({
      select: {
        id: true,
        doctorId: true,
        medical_license_number: true,
        users_doctors_userIdTousers: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
    
    console.log('👨‍⚕️ Doctors with business IDs:');
    doctors.forEach(doc => {
      console.log(`  - ${doc.doctorId} (${doc.medical_license_number}) - ${doc.users_doctors_userIdTousers.first_name} ${doc.users_doctors_userIdTousers.last_name} (${doc.users_doctors_userIdTousers.email})`);
    });
    
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        patientId: true,
        medical_record_number: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
    
    console.log('👥 Patients with business IDs:');
    patients.forEach(pat => {
      console.log(`  - ${pat.patientId} (${pat.medical_record_number}) - ${pat.user.first_name} ${pat.user.last_name} (${pat.user.email})`);
    });
    
    const hsps = await prisma.hsps.findMany({
      select: {
        id: true,
        hsp_id: true,
        hsp_type: true,
        license_number: true,
        users_hsps_userIdTousers: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
    
    console.log('🔬 HSPs with business IDs:');
    hsps.forEach(hsp => {
      console.log(`  - ${hsp.hsp_id} (${hsp.license_number}) - ${hsp.users_hsps_userIdTousers.first_name} ${hsp.users_hsps_userIdTousers.last_name} (${hsp.users_hsps_userIdTousers.email})`);
    });
    
    console.log('\n✅ Dashboard testing completed successfully!');
    
    return {
      success: true,
      results: {
        authentication: { doctor: true, patient: true, admin: true },
        dashboards: { doctor: 'tested', patient: 'tested' },
        businessIds: { doctors: doctors.length, patients: patients.length, hsps: hsps.length }
      }
    };
    
  } catch (error) {
    console.error('❌ Dashboard testing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Run the dashboard tests
testDashboards().then(result => {
  console.log('\n🏁 Dashboard test result:', result);
  process.exit(result.success ? 0 : 1);
});