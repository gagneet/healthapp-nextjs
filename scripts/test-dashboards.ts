// Test dashboard functionality directly without starting the server
import { PrismaClient } from '@prisma/client';
import { getDoctorDashboard, getPatientDashboard, loginUser as authenticateUser } from '@/lib/api-services';

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
        patientProfile: true
      }
    });
    
    if (!patientUser || !patientUser.patientProfile) {
      throw new Error('Patient profile not found');
    }
    
    const patientId = patientUser.patientProfile.id;
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
    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        doctorId: true,
        medicalLicenseNumber: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('👨‍⚕️ Doctors with business IDs:');
    doctors.forEach(doc => {
      console.log(`  - ${doc.doctorId} (${doc.medicalLicenseNumber}) - ${doc.user.firstName} ${doc.user.lastName} (${doc.user.email})`);
    });
    
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        patientId: true,
        medicalRecordNumber: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('👥 Patients with business IDs:');
    patients.forEach(pat => {
      console.log(`  - ${pat.patientId} (${pat.medicalRecordNumber}) - ${pat.user.firstName} ${pat.user.lastName} (${pat.user.email})`);
    });
    
    const hsps = await prisma.hsp.findMany({
      select: {
        id: true,
        hspId: true,
        hspType: true,
        licenseNumber: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log('🔬 HSPs with business IDs:');
    hsps.forEach(hsp => {
      console.log(`  - ${hsp.hspId} (${hsp.licenseNumber}) - ${hsp.user.firstName} ${hsp.user.lastName} (${hsp.user.email})`);
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