'use strict';

import { v4 as uuidv4 } from 'uuid';

export default {
  async up(queryInterface: any, Sequelize: any) {
    console.log('🚀 Seeding comprehensive chart test data (idempotent)...');

    // Check if comprehensive chart data already exists (idempotent)
    const existingChartData = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM medication_logs',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingChartData[0].count > 100) {
      console.log(`ℹ️ Comprehensive chart test data already exists (${existingChartData[0].count} records found), skipping seeding`);
      return;
    }

    // Helper to generate random date within range
    const randomDate = (start: any, end: any) => {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    // Get existing data
    const existingPatients = await queryInterface.sequelize.query(
      'SELECT p.id, p.userId FROM patients p JOIN users u ON p.userId = u.id WHERE u.deleted_at IS NULL LIMIT 20',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingDoctors = await queryInterface.sequelize.query(
      'SELECT d.id, d.userId FROM doctors d JOIN users u ON d.userId = u.id WHERE u.deleted_at IS NULL LIMIT 10',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingMedicines = await queryInterface.sequelize.query(
      'SELECT id, name FROM medicines LIMIT 50',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingPatients.length === 0 || existingDoctors.length === 0) {
      console.log('⚠️ No patients or doctors found, skipping chart test data seeding');
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    console.log('Creating medications for patients...');
    
    // Create medications for patients
    const medicationsData = [];
    const medicationLogsData = [];
    const patientAlertsData = [];
    const vitalReadingsData = [];
    const dashboardMetricsData = [];

    for (let i = 0; i < existingPatients.length && i < 15; i++) {
      const patient = existingPatients[i];
      const medicinesForPatient = existingMedicines.slice(i * 3, (i * 3) + 3);

      // Create 2-4 medications per patient
      for (let j = 0; j < Math.min(medicinesForPatient.length, Math.floor(Math.random() * 3) + 2); j++) {
        const medicine = medicinesForPatient[j];
        if (!medicine) continue;

        const medicationId = uuidv4();
        const startDate = randomDate(thirtyDaysAgo, sevenDaysAgo);
        
        medicationsData.push({
          id: medicationId,
          participant_id: patient.id,
          organizer_type: 'doctor',
          organizer_id: existingDoctors[i % existingDoctors.length]?.id || existingDoctors[0].id,
          medicine_id: medicine.id,
          description: `${medicine.name} prescribed for ongoing treatment`,
          start_date: startDate,
          end_date: new Date(startDate.getTime() + (60 * 24 * 60 * 60 * 1000)), // 60 days later
          details: JSON.stringify({
            dosage: `${Math.floor(Math.random() * 500) + 50}mg`,
            frequency: ['once_daily', 'twice_daily', 'three_times_daily'][Math.floor(Math.random() * 3)],
            instructions: 'Take with food',
            route: 'oral'
          }),
          created_at: startDate,
          updated_at: startDate
        });

        // Create medication logs for the past 30 days
        const frequencyMap = {
          'once_daily': 1,
          'twice_daily': 2,
          'three_times_daily': 3
        };
        
        const frequency = JSON.parse(medicationsData[medicationsData.length - 1].details).frequency;
        const dailyDoses = (frequencyMap as any)[frequency] || 1;
        
        for (let day = 0; day < 30; day++) {
          const dayDate = new Date(startDate.getTime() + (day * 24 * 60 * 60 * 1000));
          
          for (let dose = 0; dose < dailyDoses; dose++) {
            const scheduledTime = new Date(dayDate);
            scheduledTime.setHours(8 + (dose * 8), Math.floor(Math.random() * 60), 0, 0);
            
            const adherenceRate = 0.7 + (Math.random() * 0.25); // 70-95% adherence
            const isTaken = Math.random() < adherenceRate;
            
            let takenAt = null;
            let status = 'missed';
            
            if (isTaken) {
              const delay = Math.random() * 2 * 60 * 60 * 1000; // Up to 2 hours late
              takenAt = new Date(scheduledTime.getTime() + delay);
              status = delay > 60 * 60 * 1000 ? 'late' : 'taken'; // Late if more than 1 hour
            }

            medicationLogsData.push({
              id: uuidv4(),
              medication_id: medicationId,
              patientId: patient.id,
              scheduled_at: scheduledTime,
              taken_at: takenAt,
              dosage_taken: isTaken ? JSON.parse(medicationsData[medicationsData.length - 1].details).dosage : null,
              notes: isTaken ? null : 'Missed dose',
              adherence_status: status,
              reminder_sent: true,
              created_at: scheduledTime,
              updated_at: takenAt || scheduledTime
            });
          }
        }
      }

      // Create vital readings for patients
      const vitalTypes = [
        { type: 'blood_pressure', unit: 'mmHg', normalMin: 110, normalMax: 140 },
        { type: 'heart_rate', unit: 'bpm', normalMin: 60, normalMax: 100 },
        { type: 'weight', unit: 'kg', normalMin: 50, normalMax: 120 },
        { type: 'blood_sugar', unit: 'mg/dL', normalMin: 70, normalMax: 140 },
        { type: 'temperature', unit: '°F', normalMin: 97, normalMax: 99 }
      ];

      for (const vitalType of vitalTypes) {
        // Create readings every 2-3 days
        for (let day = 0; day < 30; day += Math.floor(Math.random() * 2) + 2) {
          const readingDate = new Date(thirtyDaysAgo.getTime() + (day * 24 * 60 * 60 * 1000));
          
          let value, systolic, diastolic;
          const isFlagged = Math.random() < 0.1; // 10% chance of abnormal reading
          
          // Generate medical data following proper standards
          if (vitalType.type === 'blood_pressure') {
            // Generate realistic blood pressure readings
            if (isFlagged) {
              // Generate abnormal BP (hypertension or hypotension)
              if (Math.random() < 0.7) {
                // Hypertension (70% of abnormal cases)
                systolic = Math.floor(Math.random() * 40) + 140; // 140-180
                diastolic = Math.floor(Math.random() * 30) + 90;  // 90-120
              } else {
                // Hypotension (30% of abnormal cases)
                systolic = Math.floor(Math.random() * 20) + 70;   // 70-90
                diastolic = Math.floor(Math.random() * 20) + 40;  // 40-60
              }
            } else {
              // Normal blood pressure ranges
              systolic = Math.floor(Math.random() * 30) + 110;  // 110-140 (normal)
              diastolic = Math.floor(Math.random() * 20) + 70;  // 70-90 (normal)
            }
            
            // Ensure diastolic is reasonably related to systolic (medical reality)
            if (diastolic >= systolic) {
              diastolic = Math.floor(systolic * 0.6) + Math.floor(Math.random() * 10);
            }
            
            value = null; // Don't use value for BP, use separate fields
          } else {
            // Handle other vital signs (weight, temperature, etc.)
            if (vitalType.type === 'weight') {
              // Generate realistic weight variations (±2kg around base)
              const baseWeight = 70; // kg
              value = baseWeight + (Math.random() - 0.5) * 4;
            } else if (vitalType.type === 'temperature') {
              // Generate temperature readings
              if (isFlagged) {
                value = Math.random() < 0.5 ? 
                  Math.random() * 2 + 38.5 : // fever: 38.5-40.5°C
                  Math.random() * 2 + 34;     // hypothermia: 34-36°C
              } else {
                value = Math.random() * 1.5 + 36.2; // normal: 36.2-37.7°C
              }
            } else {
              // Generic vital sign generation
              value = isFlagged ?
                (Math.random() < 0.5 ? 
                  vitalType.normalMax + Math.floor(Math.random() * 50) : 
                  vitalType.normalMin - Math.floor(Math.random() * 20)) :
                Math.floor(Math.random() * (vitalType.normalMax - vitalType.normalMin)) + vitalType.normalMin;
            }
            systolic = null;
            diastolic = null;
          }

          // Generate pulse rate (medical best practice - usually taken with BP)
          let pulseRate = null;
          if (vitalType.type === 'blood_pressure' || Math.random() < 0.3) {
            if (isFlagged) {
              pulseRate = Math.random() < 0.5 ? 
                Math.floor(Math.random() * 50) + 100 : // tachycardia: 100-150
                Math.floor(Math.random() * 20) + 45;   // bradycardia: 45-65
            } else {
              pulseRate = Math.floor(Math.random() * 30) + 65; // normal: 65-95
            }
          }

          // Use existing vital_readings table structure
          const vitalTypeId = await queryInterface.sequelize.query(
            `SELECT id FROM vital_types WHERE name ILIKE '%${vitalType.type}%' LIMIT 1`,
            { type: Sequelize.QueryTypes.SELECT }
          );

          if (vitalTypeId.length > 0) {
            vitalReadingsData.push({
              id: uuidv4(),
              patientId: patient.id,
              vital_type_id: vitalTypeId[0].id,
              value: value,
              unit: vitalType.unit,
              // Medical standard fields
              systolic_value: systolic,
              diastolic_value: diastolic,
              pulse_rate: pulseRate,
              respiratory_rate: vitalType.type === 'blood_pressure' && Math.random() < 0.2 ? 
                Math.floor(Math.random() * 8) + 14 : null, // 14-22 (occasionally measured)
              oxygen_saturation: vitalType.type === 'blood_pressure' && Math.random() < 0.15 ? 
                Math.floor(Math.random() * 5) + 96 : null, // 96-100% (occasionally measured)
              readingTime: readingDate,
              device_info: JSON.stringify({
                device_type: ['manual', 'smart_watch', 'home_monitor', 'hospital_grade'][Math.floor(Math.random() * 4)],
                model: ['Omron BP652', 'Apple Watch Series 8', 'Manual Sphygmomanometer', 'Philips IntelliVue'][Math.floor(Math.random() * 4)]
              }),
              is_flagged: isFlagged,
              // Alert system will be calculated automatically by model hooks
              alert_level: 'normal', // Will be recalculated by model
              alert_reasons: JSON.stringify([]),
              notes: isFlagged ? `Abnormal ${vitalType.type} reading - requires medical follow-up` : 
                     `Routine ${vitalType.type} monitoring`,
              created_at: readingDate,
              updated_at: readingDate
            });
          }
        }
      }

      // Create patient alerts
      const alertTypes = ['medication', 'vital', 'appointment', 'symptom'];
      const severities = ['low', 'medium', 'high', 'critical'];
      
      for (let alert = 0; alert < Math.floor(Math.random() * 5) + 1; alert++) {
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const alertDate = randomDate(sevenDaysAgo, now);
        const isAcknowledged = Math.random() < 0.6;

        patientAlertsData.push({
          id: uuidv4(),
          patientId: patient.id,
          alert_type: alertType,
          severity: severity,
          title: `${alertType.charAt(0).toUpperCase() + alertType.slice(1)} Alert`,
          message: `Patient requires attention for ${alertType}-related issue. Severity: ${severity}`,
          action_required: severity === 'critical' || severity === 'high',
          acknowledged: isAcknowledged,
          acknowledged_at: isAcknowledged ? new Date(alertDate.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
          acknowledged_by: isAcknowledged ? existingDoctors[Math.floor(Math.random() * existingDoctors.length)]?.id : null,
          resolved: isAcknowledged && Math.random() < 0.8,
          resolved_at: isAcknowledged && Math.random() < 0.8 ? 
            new Date(alertDate.getTime() + Math.random() * 48 * 60 * 60 * 1000) : null,
          metadata: JSON.stringify({
            source: 'automated_monitoring',
            priority_score: Math.floor(Math.random() * 100)
          }),
          created_at: alertDate,
          updated_at: alertDate
        });
      }

      // Create dashboard metrics for patient
      const adherenceScore = Math.floor(Math.random() * 30) + 70; // 70-100%
      dashboardMetricsData.push({
        id: uuidv4(),
        entity_type: 'patient',
        entity_id: patient.id,
        metric_type: 'adherence_summary',
        metric_data: JSON.stringify({
          overall_adherence: adherenceScore,
          medication_adherence: adherenceScore + Math.floor(Math.random() * 10) - 5,
          appointment_adherence: Math.floor(Math.random() * 20) + 80,
          vital_readings_compliance: Math.floor(Math.random() * 15) + 75,
          trend: adherenceScore > 85 ? 'improving' : adherenceScore < 75 ? 'declining' : 'stable',
          last_30_days: {
            medications_taken: Math.floor(Math.random() * 50) + 30,
            medications_missed: Math.floor(Math.random() * 15) + 5,
            appointments_attended: Math.floor(Math.random() * 5) + 2,
            vitals_recorded: Math.floor(Math.random() * 20) + 10
          }
        }),
        calculated_at: now,
        valid_until: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Valid for 24 hours
        created_at: now,
        updated_at: now
      });
    }

    // Create doctor-level dashboard metrics
    for (let i = 0; i < existingDoctors.length && i < 5; i++) {
      const doctor = existingDoctors[i];
      const doctorPatientsCount = Math.floor(Math.random() * 20) + 10;
      
      dashboardMetricsData.push({
        id: uuidv4(),
        entity_type: 'doctor',
        entity_id: doctor.id,
        metric_type: 'dashboard_summary',
        metric_data: JSON.stringify({
          total_patients: doctorPatientsCount,
          active_patients: Math.floor(doctorPatientsCount * 0.9),
          critical_alerts: Math.floor(Math.random() * 8) + 2,
          appointments_today: Math.floor(Math.random() * 12) + 3,
          medication_adherence_avg: Math.floor(Math.random() * 20) + 75,
          vital_readings_pending: Math.floor(Math.random() * 15) + 5,
          recent_activities: Math.floor(Math.random() * 25) + 15
        }),
        calculated_at: now,
        valid_until: new Date(now.getTime() + 6 * 60 * 60 * 1000), // Valid for 6 hours
        created_at: now,
        updated_at: now
      });

      dashboardMetricsData.push({
        id: uuidv4(),
        entity_type: 'doctor',
        entity_id: doctor.id,
        metric_type: 'adherence_analytics',
        metric_data: JSON.stringify({
          overview: {
            excellent: Math.floor(Math.random() * 30) + 20,
            good: Math.floor(Math.random() * 25) + 25,
            fair: Math.floor(Math.random() * 15) + 15,
            poor: Math.floor(Math.random() * 10) + 5
          },
          monthly_trends: Array.from({length: 6}, (_, i) => ({
            month: new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString().slice(0, 7),
            adherence: Math.floor(Math.random() * 20) + 70
          })).reverse()
        }),
        calculated_at: now,
        valid_until: new Date(now.getTime() + 12 * 60 * 60 * 1000), // Valid for 12 hours
        created_at: now,
        updated_at: now
      });
    }

    // Insert data in batches
    console.log(`Inserting ${medicationsData.length} medications...`);
    if (medicationsData.length > 0) {
      await queryInterface.bulkInsert('medications', medicationsData, { ignoreDuplicates: true });
    }

    console.log(`Inserting ${medicationLogsData.length} medication logs...`);
    if (medicationLogsData.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < medicationLogsData.length; i += batchSize) {
        const batch = medicationLogsData.slice(i, i + batchSize);
        await queryInterface.bulkInsert('medication_logs', batch, { ignoreDuplicates: true });
        console.log(`  Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(medicationLogsData.length/batchSize)}`);
      }
    }

    console.log(`Inserting ${vitalReadingsData.length} vital readings...`);
    if (vitalReadingsData.length > 0) {
      await queryInterface.bulkInsert('vital_readings', vitalReadingsData, { ignoreDuplicates: true });
    }

    console.log(`Inserting ${patientAlertsData.length} patient alerts...`);
    if (patientAlertsData.length > 0) {
      await queryInterface.bulkInsert('patient_alerts', patientAlertsData, { ignoreDuplicates: true });
    }

    console.log(`Inserting ${dashboardMetricsData.length} dashboard metrics...`);
    if (dashboardMetricsData.length > 0) {
      await queryInterface.bulkInsert('dashboard_metrics', dashboardMetricsData, { ignoreDuplicates: true });
    }

    console.log('✅ Comprehensive chart test data seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`  - ${medicationsData.length} medications created`);
    console.log(`  - ${medicationLogsData.length} medication logs created`);
    console.log(`  - ${vitalReadingsData.length} vital readings created`);
    console.log(`  - ${patientAlertsData.length} patient alerts created`);
    console.log(`  - ${dashboardMetricsData.length} dashboard metrics created`);
  },

  async down(queryInterface: any, Sequelize: any) {
    console.log('Removing comprehensive chart test data...');
    
    // Remove in reverse order of creation
    await queryInterface.bulkDelete('dashboard_metrics', {
      metric_type: {
        [Sequelize.Op.in]: ['adherence_summary', 'dashboard_summary', 'adherence_analytics']
      }
    });
    
    await queryInterface.bulkDelete('patient_alerts', {
      message: {
        [Sequelize.Op.like]: '%requires attention%'
      }
    });
    
    // Remove test medication logs (keep real ones)
    await queryInterface.bulkDelete('medication_logs', {
      created_at: {
        [Sequelize.Op.gte]: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // Last 35 days
      }
    });
    
    // Remove test medications
    await queryInterface.bulkDelete('medications', {
      description: {
        [Sequelize.Op.like]: '%prescribed for ongoing treatment'
      }
    });
    
    console.log('✅ Comprehensive chart test data removed successfully!');
  }
};