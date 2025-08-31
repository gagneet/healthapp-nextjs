// 008-comprehensive-patient-data.ts - Comprehensive patient data seeder for dashboard testing
'use strict';

import { v4 as uuidv4 } from 'uuid';

export default {
  async up(queryInterface: any, Sequelize: any) {
    console.log('📊 Seeding comprehensive patient data (idempotent)...');
    
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Check if comprehensive test data already exists (idempotent)
      const existingComprehensiveData = await queryInterface.sequelize.query(
        "SELECT email FROM users WHERE email IN ('patient1@healthapp.com', 'patient2@healthapp.com', 'doctor1@healthapp.com')",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );
      
      if (existingComprehensiveData.length > 0) {
        console.log(`ℹ️ Comprehensive test data already exists (${existingComprehensiveData.length} users found), skipping seeding`);
        await transaction.rollback();
        return;
      }

      // Create test users with different roles (using deterministic UUIDs)
      const testUsers = [
        {
          id: '77777777-7777-7777-7777-777777777777', // Deterministic UUID for patient1
          email: 'patient1@healthapp.com',
          password_hash: '$2b$10$rX8X9YUjF1L5yG4zP2wKJ.8HhYh9kXzP2wKJ8rX9YUjF1L5yG4zP2',
          role: 'PATIENT',
          firstName: 'Sarah',
          lastName: 'Johnson',
          phone: '+1-555-0101',
          date_of_birth: '1985-06-15',
          gender: 'FEMALE',
          account_status: 'ACTIVE',
          email_verified: true,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date()
        },
        {
          id: '88888888-8888-8888-8888-888888888888', // Deterministic UUID for patient2
          email: 'patient2@healthapp.com',
          password_hash: '$2b$10$rX8X9YUjF1L5yG4zP2wKJ.8HhYh9kXzP2wKJ8rX9YUjF1L5yG4zP2',
          role: 'PATIENT',
          firstName: 'Michael',
          lastName: 'Chen',
          phone: '+1-555-0102',
          date_of_birth: '1978-03-22',
          gender: 'MALE',
          account_status: 'ACTIVE',
          email_verified: true,
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date()
        },
        {
          id: '99999999-9999-9999-9999-999999999999', // Deterministic UUID for doctor1
          email: 'doctor1@healthapp.com',
          password_hash: '$2b$10$rX8X9YUjF1L5yG4zP2wKJ.8HhYh9kXzP2wKJ8rX9YUjF1L5yG4zP2',
          role: 'DOCTOR',
          firstName: 'Dr. Emily',
          lastName: 'Rodriguez',
          phone: '+1-555-0201',
          date_of_birth: '1975-11-08',
          gender: 'FEMALE',
          account_status: 'ACTIVE',
          email_verified: true,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date()
        }
      ];

      await queryInterface.bulkInsert('users', testUsers, { transaction, ignoreDuplicates: true });

      // Create patient records (using deterministic UUIDs)
      const patients = [
        {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Deterministic UUID for patient profile 1
          userId: testUsers[0].id,
          patientId: 'PAT-2025-001',
          height_cm: 165.0,
          weight_kg: 68.5,
          blood_type: 'A+',
          primary_language: 'en',
          risk_level: 'medium',
          allergies: JSON.stringify([
            { name: 'Penicillin', severity: 'severe', reaction: 'rash' },
            { name: 'Shellfish', severity: 'moderate', reaction: 'hives' }
          ]),
          medical_history: JSON.stringify([
            { condition: 'Type 2 Diabetes', diagnosed: '2022-03-15', status: 'active' },
            { condition: 'Hypertension', diagnosed: '2021-08-20', status: 'controlled' }
          ]),
          emergency_contacts: JSON.stringify([
            { name: 'John Johnson', relationship: 'spouse', phone: '+1-555-0103', primary: true }
          ]),
          communication_preferences: JSON.stringify({
            preferred_contact_method: 'email',
            appointment_reminders: true,
            medication_reminders: true,
            health_tips: true,
            language: 'en',
            time_zone: 'America/Chicago'
          }),
          overallAdherenceScore: 85.5,
          last_adherence_calculation: new Date(),
          total_appointments: 8,
          missed_appointments: 1,
          last_visit_date: new Date('2025-01-15'),
          next_appointment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date()
        },
        {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Deterministic UUID for patient profile 2
          userId: testUsers[1].id,
          patientId: 'PAT-2025-002',
          height_cm: 178.0,
          weight_kg: 82.3,
          blood_type: 'O-',
          primary_language: 'en',
          risk_level: 'low',
          allergies: JSON.stringify([]),
          medical_history: JSON.stringify([
            { condition: 'Seasonal Allergies', diagnosed: '2020-05-10', status: 'active' }
          ]),
          emergency_contacts: JSON.stringify([
            { name: 'Lisa Chen', relationship: 'wife', phone: '+1-555-0104', primary: true }
          ]),
          communication_preferences: JSON.stringify({
            preferred_contact_method: 'sms',
            appointment_reminders: true,
            medication_reminders: true,
            health_tips: false,
            language: 'en',
            time_zone: 'America/Chicago'
          }),
          overallAdherenceScore: 92.0,
          last_adherence_calculation: new Date(),
          total_appointments: 5,
          missed_appointments: 0,
          last_visit_date: new Date('2025-01-10'),
          next_appointment_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          isActive: true,
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date()
        }
      ];

      await queryInterface.bulkInsert('patients', patients, { transaction, ignoreDuplicates: true });

      // Create doctor record
      const doctors = [{
        id: uuidv4(),
        userId: testUsers[2].id,
        medical_license_number: 'MD123456',
        speciality_id: null, // Will be set after specialties are created
        years_of_experience: 15,
        boardCertifications: ['Board Certified Internal Medicine', 'Diabetes Care Specialist'],
        residency_programs: JSON.stringify([
          { program: 'Internal Medicine', institution: 'Mayo Clinic', year: 2013 }
        ]),
        medical_school: 'Harvard Medical School',
        specialties: ['internal_medicine', 'diabetes_care'],
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date()
      }];

      await queryInterface.bulkInsert('doctors', doctors, { transaction, ignoreDuplicates: true });

      // Get medicine IDs (assuming medicines seeder has run)
      const medicines = await queryInterface.sequelize.query(
        'SELECT id, name FROM medicines LIMIT 10',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // Create medications for patients
      const medications = [];
      const patient1Id = patients[0].id;
      const patient2Id = patients[1].id;

      if (medicines.length > 0) {
        // Sarah's medications (diabetes + hypertension)
        medications.push(
          {
            id: uuidv4(),
            participant_id: patient1Id,
            organizer_type: 'doctor',
            organizer_id: doctors[0].id,
            medicine_id: medicines[0].id,
            description: 'Take with breakfast for diabetes management',
            startDate: new Date('2025-01-01'),
            endDate: null,
            details: JSON.stringify({
              frequency: 'daily',
              time_of_day: ['08:00'],
              dosage: '500mg',
              instructions: 'Take with food',
              duration_days: null
            }),
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date()
          },
          {
            id: uuidv4(),
            participant_id: patient1Id,
            organizer_type: 'doctor',
            organizer_id: doctors[0].id,
            medicine_id: medicines[1].id,
            description: 'Blood pressure medication',
            startDate: new Date('2025-01-01'),
            endDate: null,
            details: JSON.stringify({
              frequency: 'daily',
              time_of_day: ['08:00', '20:00'],
              dosage: '5mg',
              instructions: 'Take at same time daily',
              duration_days: null
            }),
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date()
          }
        );

        // Michael's medications (allergies)
        if (medicines.length > 2) {
          medications.push({
            id: uuidv4(),
            participant_id: patient2Id,
            organizer_type: 'doctor',
            organizer_id: doctors[0].id,
            medicine_id: medicines[2].id,
            description: 'Seasonal allergy relief',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-06-01'),
            details: JSON.stringify({
              frequency: 'daily',
              time_of_day: ['20:00'],
              dosage: '10mg',
              instructions: 'Take before bedtime',
              duration_days: 120
            }),
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date()
          });
        }
      }

      await queryInterface.bulkInsert('medications', medications, { transaction, ignoreDuplicates: true });

      // Create scheduled events for the next 7 days
      const scheduledEvents = [];
      const currentDate = new Date();

      // Generate medication events for Sarah
      for (let i = 0; i < 7; i++) {
        const eventDate = new Date(currentDate);
        eventDate.setDate(currentDate.getDate() + i);
        
        // Morning medication (Metformin)
        scheduledEvents.push({
          id: uuidv4(),
          patientId: patient1Id,
          event_type: 'MEDICATION',
          event_id: medications[0]?.id,
          title: 'Take Metformin',
          description: '500mg with breakfast',
          scheduled_for: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 8, 0),
          timezone: 'America/Chicago',
          status: i < 1 ? 'COMPLETED' : i < 2 ? 'MISSED' : 'SCHEDULED',
          priority: 'HIGH',
          event_data: JSON.stringify({
            medication_id: medications[0]?.id,
            dosage: '500mg',
            instructions: 'Take with food'
          }),
          completed_at: i < 1 ? new Date() : null,
          completed_by: i < 1 ? testUsers[0].id : null,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Evening medication (Lisinopril)
        scheduledEvents.push({
          id: uuidv4(),
          patientId: patient1Id,
          event_type: 'MEDICATION',
          event_id: medications[1]?.id,
          title: 'Take Lisinopril',
          description: '5mg evening dose',
          scheduled_for: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 20, 0),
          timezone: 'America/Chicago',
          status: i < 1 ? 'COMPLETED' : 'SCHEDULED',
          priority: 'HIGH',
          event_data: JSON.stringify({
            medication_id: medications[1]?.id,
            dosage: '5mg',
            instructions: 'Take at same time daily'
          }),
          completed_at: i < 1 ? new Date() : null,
          completed_by: i < 1 ? testUsers[0].id : null,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Vital checks
        if (i % 3 === 0) { // Every 3 days
          scheduledEvents.push({
            id: uuidv4(),
            patientId: patient1Id,
            event_type: 'VITAL_CHECK',
            event_id: null,
            title: 'Check Blood Pressure',
            description: 'Morning blood pressure reading',
            scheduled_for: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 9, 0),
            timezone: 'America/Chicago',
            status: i < 1 ? 'COMPLETED' : 'SCHEDULED',
            priority: 'MEDIUM',
            event_data: JSON.stringify({
              vitalType: 'blood_pressure',
              target_range: { systolic: '120-140', diastolic: '70-90' }
            }),
            completed_at: i < 1 ? new Date() : null,
            completed_by: i < 1 ? testUsers[0].id : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        // Exercise events
        if (i % 2 === 1) { // Every other day
          scheduledEvents.push({
            id: uuidv4(),
            patientId: patient1Id,
            event_type: 'EXERCISE',
            event_id: null,
            title: '30-minute Walk',
            description: 'Moderate cardio exercise',
            scheduled_for: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 17, 0),
            timezone: 'America/Chicago',
            status: i < 2 ? 'COMPLETED' : 'SCHEDULED',
            priority: 'MEDIUM',
            event_data: JSON.stringify({
              exercise_type: 'walking',
              duration_minutes: 30,
              intensity: 'moderate'
            }),
            completed_at: i < 2 ? new Date() : null,
            completed_by: i < 2 ? testUsers[0].id : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      // Michael's events (fewer, he's more compliant)
      for (let i = 0; i < 7; i++) {
        const eventDate = new Date(currentDate);
        eventDate.setDate(currentDate.getDate() + i);
        
        if (medications[2]) {
          scheduledEvents.push({
            id: uuidv4(),
            patientId: patient2Id,
            event_type: 'MEDICATION',
            event_id: medications[2].id,
            title: 'Take Allergy Medicine',
            description: '10mg before bedtime',
            scheduled_for: new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 20, 0),
            timezone: 'America/Chicago',
            status: i < 2 ? 'COMPLETED' : 'SCHEDULED',
            priority: 'MEDIUM',
            event_data: JSON.stringify({
              medication_id: medications[2].id,
              dosage: '10mg',
              instructions: 'Take before bedtime'
            }),
            completed_at: i < 2 ? new Date() : null,
            completed_by: i < 2 ? testUsers[1].id : null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      await queryInterface.bulkInsert('scheduled_events', scheduledEvents, { transaction, ignoreDuplicates: true });

      // Create adherence records
      const adherenceRecords = [];
      
      // Generate adherence records for the past 30 days
      for (let i = 1; i <= 30; i++) {
        const recordDate = new Date(currentDate);
        recordDate.setDate(currentDate.getDate() - i);

        // Sarah's adherence (85% rate)
        const sarahCompliance = Math.random() > 0.15; // 85% compliance
        adherenceRecords.push({
          id: uuidv4(),
          patientId: patient1Id,
          scheduled_event_id: null,
          adherence_type: 'MEDICATION',
          due_at: new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), 8, 0),
          recordedAt: sarahCompliance ? new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), 8, 15) : null,
          is_completed: sarahCompliance,
          is_partial: false,
          is_missed: !sarahCompliance,
          response_data: sarahCompliance ? JSON.stringify({ taken: true, notes: 'Taken with breakfast' }) : JSON.stringify({}),
          createdAt: recordDate,
          updatedAt: recordDate
        });

        // Michael's adherence (92% rate)
        const michaelCompliance = Math.random() > 0.08; // 92% compliance
        adherenceRecords.push({
          id: uuidv4(),
          patientId: patient2Id,
          scheduled_event_id: null,
          adherence_type: 'MEDICATION',
          due_at: new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), 20, 0),
          recordedAt: michaelCompliance ? new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate(), 20, 10) : null,
          is_completed: michaelCompliance,
          is_partial: false,
          is_missed: !michaelCompliance,
          response_data: michaelCompliance ? JSON.stringify({ taken: true }) : JSON.stringify({}),
          createdAt: recordDate,
          updatedAt: recordDate
        });
      }

      await queryInterface.bulkInsert('adherence_records', adherenceRecords, { transaction, ignoreDuplicates: true });

      // First, create vital types if they don't exist
      const vitalTypesData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440201',
          name: 'Systolic Blood Pressure',
          unit: 'mmHg',
          normalRangeMin: 90,
          normalRangeMax: 140,
          description: 'Systolic blood pressure measurement',
          validation_rules: JSON.stringify({ min: 60, max: 200 }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440202',
          name: 'Diastolic Blood Pressure',
          unit: 'mmHg',
          normalRangeMin: 60,
          normalRangeMax: 90,
          description: 'Diastolic blood pressure measurement',
          validation_rules: JSON.stringify({ min: 40, max: 120 }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440203',
          name: 'Blood Glucose',
          unit: 'mg/dL',
          normalRangeMin: 70,
          normalRangeMax: 140,
          description: 'Blood glucose level measurement',
          validation_rules: JSON.stringify({ min: 30, max: 400 }),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440204',
          name: 'Weight',
          unit: 'kg',
          normalRangeMin: 30,
          normalRangeMax: 200,
          description: 'Body weight measurement',
          validation_rules: JSON.stringify({ min: 10, max: 500 }),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Insert vital types (idempotent)
      await queryInterface.bulkInsert('vital_types', vitalTypesData, { 
        transaction, 
        ignoreDuplicates: true 
      });

      // Get vital type IDs for proper foreign key references
      const vitalTypeIds = {
        systolic: '550e8400-e29b-41d4-a716-446655440201',
        diastolic: '550e8400-e29b-41d4-a716-446655440202', 
        glucose: '550e8400-e29b-41d4-a716-446655440203',
        weight: '550e8400-e29b-41d4-a716-446655440204'
      };

      // Create vital readings
      const vitalReadings = [];
      
      for (let i = 1; i <= 14; i++) {
        const readingDate = new Date(currentDate);
        readingDate.setDate(currentDate.getDate() - i);

        // Sarah's vitals (diabetic with hypertension) - separate readings for systolic/diastolic
        vitalReadings.push(
          // Systolic blood pressure reading
          {
            id: uuidv4(),
            patientId: patient1Id,
            vitalTypeId: vitalTypeIds.systolic,
            value: 125 + Math.floor(Math.random() * 20), // 125-145
            unit: 'mmHg',
            readingTime: new Date(readingDate.getFullYear(), readingDate.getMonth(), readingDate.getDate(), 9, 0),
            notes: 'Morning systolic BP reading',
            createdAt: readingDate,
            updatedAt: readingDate
          },
          // Diastolic blood pressure reading
          {
            id: uuidv4(),
            patientId: patient1Id,
            vitalTypeId: vitalTypeIds.diastolic,
            value: 80 + Math.floor(Math.random() * 15), // 80-95
            unit: 'mmHg',
            readingTime: new Date(readingDate.getFullYear(), readingDate.getMonth(), readingDate.getDate(), 9, 0),
            notes: 'Morning diastolic BP reading',
            createdAt: readingDate,
            updatedAt: readingDate
          },
          // Blood glucose reading
          {
            id: uuidv4(),
            patientId: patient1Id,
            vitalTypeId: vitalTypeIds.glucose,
            value: 95 + Math.floor(Math.random() * 30), // 95-125 mg/dL
            unit: 'mg/dL',
            readingTime: new Date(readingDate.getFullYear(), readingDate.getMonth(), readingDate.getDate(), 12, 0),
            notes: 'Before lunch glucose reading',
            createdAt: readingDate,
            updatedAt: readingDate
          },
          // Weight reading
          {
            id: uuidv4(),
            patientId: patient1Id,
            vitalTypeId: vitalTypeIds.weight,
            value: 68.5 + (Math.random() - 0.5) * 2, // +/- 1kg variation
            unit: 'kg',
            readingTime: new Date(readingDate.getFullYear(), readingDate.getMonth(), readingDate.getDate(), 7, 30),
            notes: 'Morning weight reading',
            createdAt: readingDate,
            updatedAt: readingDate
          }
        );

        // Michael's vitals (healthy)
        if (i % 3 === 0) { // Less frequent for healthy patient
          vitalReadings.push({
            id: uuidv4(),
            patientId: patient2Id,
            vitalTypeId: vitalTypeIds.weight,
            value: 82.3 + (Math.random() - 0.5) * 1, // +/- 0.5kg variation
            unit: 'kg',
            readingTime: new Date(readingDate.getFullYear(), readingDate.getMonth(), readingDate.getDate(), 7, 0),
            notes: 'Weekly weigh-in',
            createdAt: readingDate,
            updatedAt: readingDate
          });
        }
      }

      await queryInterface.bulkInsert('vital_readings', vitalReadings, { transaction, ignoreDuplicates: true });

      // Create symptoms for Sarah (using correct schema)
      const symptoms = [
        {
          id: uuidv4(),
          patientId: patient1Id,
          symptom_name: 'Mild Headache',
          description: 'Dull headache, especially in the morning',
          severity: 4,
          body_location: JSON.stringify({ region: 'head', specific: 'frontal' }),
          onsetTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          recordedAt: new Date(),
          triggers: JSON.stringify(['stress', 'lack of sleep']),
          relieving_factors: JSON.stringify(['rest', 'hydration']),
          associated_symptoms: JSON.stringify([]),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          patientId: patient1Id,
          symptom_name: 'Foot Numbness',
          description: 'Tingling sensation in toes, possibly diabetes-related',
          severity: 6,
          body_location: JSON.stringify({ region: 'foot', specific: 'left_toes' }),
          onsetTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          recordedAt: new Date(),
          triggers: JSON.stringify(['prolonged standing', 'tight shoes']),
          relieving_factors: JSON.stringify(['elevation', 'massage']),
          associated_symptoms: JSON.stringify(['tingling']),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      ];

      await queryInterface.bulkInsert('symptoms', symptoms, { transaction, ignoreDuplicates: true });

      // Create appointments (using correct appointments schema)
      const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const futureDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      
      const appointments = [
        {
          id: uuidv4(),
          participant_one_type: 'patient',
          participant_one_id: patient1Id,
          participant_two_type: 'doctor',
          participant_two_id: doctors[0].id,
          organizer_type: 'doctor',
          organizer_id: doctors[0].id,
          doctorId: doctors[0].id,
          patientId: patient1Id,
          startDate: futureDate1,
          endDate: futureDate1,
          startTime: new Date(futureDate1.getFullYear(), futureDate1.getMonth(), futureDate1.getDate(), 10, 0),
          endTime: new Date(futureDate1.getFullYear(), futureDate1.getMonth(), futureDate1.getDate(), 10, 30),
          description: 'Quarterly diabetes checkup and medication review',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          participant_one_type: 'patient',
          participant_one_id: patient2Id,
          participant_two_type: 'doctor',
          participant_two_id: doctors[0].id,
          organizer_type: 'doctor',
          organizer_id: doctors[0].id,
          doctorId: doctors[0].id,
          patientId: patient2Id,
          startDate: futureDate2,
          endDate: futureDate2,
          startTime: new Date(futureDate2.getFullYear(), futureDate2.getMonth(), futureDate2.getDate(), 14, 0),
          endTime: new Date(futureDate2.getFullYear(), futureDate2.getMonth(), futureDate2.getDate(), 14, 30),
          description: 'Annual physical examination and health assessment',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await queryInterface.bulkInsert('appointments', appointments, { transaction, ignoreDuplicates: true });

      await transaction.commit();
      console.log('✅ Comprehensive patient data seeded successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error seeding comprehensive patient data:', error);
      throw error;
    }
  },

  async down(queryInterface: any, Sequelize: any) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Clean up in reverse order of creation
      await queryInterface.bulkDelete('appointments', { 
        patientId: { [Sequelize.Op.in]: await queryInterface.sequelize.query(
          'SELECT id FROM patients WHERE patientId IN (?, ?)',
          { 
            replacements: ['PAT-2025-001', 'PAT-2025-002'],
            type: Sequelize.QueryTypes.SELECT 
          }
        ).then((results: any) => results.map((r: any) => r.id)) }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('symptoms', {
        patientId: { [Sequelize.Op.in]: await queryInterface.sequelize.query(
          'SELECT id FROM patients WHERE patientId IN (?, ?)',
          { 
            replacements: ['PAT-2025-001', 'PAT-2025-002'],
            type: Sequelize.QueryTypes.SELECT 
          }
        ).then((results: any) => results.map((r: any) => r.id)) }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('vital_readings', {
        patientId: { [Sequelize.Op.in]: await queryInterface.sequelize.query(
          'SELECT id FROM patients WHERE patientId IN (?, ?)',
          { 
            replacements: ['PAT-2025-001', 'PAT-2025-002'],
            type: Sequelize.QueryTypes.SELECT 
          }
        ).then((results: any) => results.map((r: any) => r.id)) }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('adherence_records', {
        patientId: { [Sequelize.Op.in]: await queryInterface.sequelize.query(
          'SELECT id FROM patients WHERE patientId IN (?, ?)',
          { 
            replacements: ['PAT-2025-001', 'PAT-2025-002'],
            type: Sequelize.QueryTypes.SELECT 
          }
        ).then((results: any) => results.map((r: any) => r.id)) }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('scheduled_events', {
        patientId: { [Sequelize.Op.in]: await queryInterface.sequelize.query(
          'SELECT id FROM patients WHERE patientId IN (?, ?)',
          { 
            replacements: ['PAT-2025-001', 'PAT-2025-002'],
            type: Sequelize.QueryTypes.SELECT 
          }
        ).then((results: any) => results.map((r: any) => r.id)) }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('medications', {
        participant_id: { [Sequelize.Op.in]: await queryInterface.sequelize.query(
          'SELECT id FROM patients WHERE patientId IN (?, ?)',
          { 
            replacements: ['PAT-2025-001', 'PAT-2025-002'],
            type: Sequelize.QueryTypes.SELECT 
          }
        ).then((results: any) => results.map((r: any) => r.id)) }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('doctors', {
        userId: { [Sequelize.Op.in]: await queryInterface.sequelize.query(
          'SELECT id FROM users WHERE email = ?',
          { 
            replacements: ['doctor1@healthapp.com'],
            type: Sequelize.QueryTypes.SELECT 
          }
        ).then((results: any) => results.map((r: any) => r.id)) }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('patients', { 
        patientId: { [Sequelize.Op.in]: ['PAT-2025-001', 'PAT-2025-002'] }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('user_roles', {
        userId: { [Sequelize.Op.in]: await queryInterface.sequelize.query(
          'SELECT id FROM users WHERE email IN (?, ?, ?)',
          { 
            replacements: ['patient1@healthapp.com', 'patient2@healthapp.com', 'doctor1@healthapp.com'],
            type: Sequelize.QueryTypes.SELECT 
          }
        ).then((results: any) => results.map((r: any) => r.id)) }
      }, { transaction, ignoreDuplicates: true });

      await queryInterface.bulkDelete('users', {
        email: { [Sequelize.Op.in]: ['patient1@healthapp.com', 'patient2@healthapp.com', 'doctor1@healthapp.com'] }
      }, { transaction, ignoreDuplicates: true });

      await transaction.commit();
      console.log('✅ Comprehensive patient data cleanup completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error cleaning up comprehensive patient data:', error);
      throw error;
    }
  }
};