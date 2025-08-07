// src/models/associations.js
// Essential associations for Doctor Dashboard functionality

export default function defineAssociations(models) {
  const {
    // Core models
    User,
    Doctor,
    HSP,
    Patient,
    Speciality,
    Clinic,
    Appointment,
    
    // Care management
    CarePlan,
    Medication,
    Vital,
    Medicine,
    VitalTemplate,
    
    // Other models (optional)
    Organization,
    UserRole,
    Role,
    TreatmentPlan,
    HealthcareProvider,
    ServicePlan,
    PatientSubscription,
    Notification,
    Device,
    AuditLog,
    PatientDoctorAssignment,
    DoctorAvailability,
    AppointmentSlot,
    Payment,
    PaymentMethod,
    ScheduledEvent,
    AdherenceRecord,
    VitalReading,
    Symptom,
    VitalRequirement,
    
    // New chart analytics models
    MedicationLog,
    PatientAlert,
    DashboardMetric,
    
    // New consent workflow models
    SecondaryDoctorAssignment,
    PatientConsentOtp
  } = models;

  // ====== CORE USER ASSOCIATIONS ======
  
  // User -> Profile relationships
  if (User && Doctor) {
    User.hasOne(Doctor, {
      foreignKey: 'user_id',
      as: 'doctorProfile'
    });
    Doctor.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }

  if (User && Patient) {
    User.hasOne(Patient, {
      foreignKey: 'user_id',
      as: 'patientProfile'
    });
    Patient.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }

  // ====== DOCTOR ASSOCIATIONS ======
  
  if (Doctor && Speciality) {
    Doctor.belongsTo(Speciality, {
      foreignKey: 'speciality_id',
      as: 'speciality'
    });
    Speciality.hasMany(Doctor, {
      foreignKey: 'speciality_id',
      as: 'doctors'
    });
  }

  if (Doctor && Patient) {
    Doctor.hasMany(Patient, {
      foreignKey: 'primary_care_doctor_id',
      as: 'primaryCarePatients'
    });
    Patient.belongsTo(Doctor, {
      foreignKey: 'primary_care_doctor_id',
      as: 'primaryCareDoctor'
    });
  }

  if (Doctor && Clinic) {
    Doctor.hasMany(Clinic, {
      foreignKey: 'doctor_id',
      as: 'clinics'
    });
    Clinic.belongsTo(Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });
  }

  // ====== APPOINTMENT ASSOCIATIONS ======
  
  if (Appointment && Doctor) {
    Appointment.belongsTo(Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });
    Doctor.hasMany(Appointment, {
      foreignKey: 'doctor_id',
      as: 'appointments'
    });
  }

  if (Appointment && Patient) {
    Appointment.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    Patient.hasMany(Appointment, {
      foreignKey: 'patient_id',
      as: 'patientAppointments'
    });
  }

  // ====== CARE PLAN ASSOCIATIONS ======
  
  if (CarePlan && Patient) {
    CarePlan.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    Patient.hasMany(CarePlan, {
      foreignKey: 'patient_id',
      as: 'carePlans'
    });
  }

  if (CarePlan && Doctor) {
    CarePlan.belongsTo(Doctor, {
      foreignKey: 'created_by_doctor_id',
      as: 'createdByDoctor'
    });
    Doctor.hasMany(CarePlan, {
      foreignKey: 'created_by_doctor_id',
      as: 'createdCarePlans'
    });
  }

  // ====== MEDICATION ASSOCIATIONS ======
  
  if (Medication && CarePlan) {
    Medication.belongsTo(CarePlan, {
      foreignKey: 'care_plan_id',
      as: 'carePlan'
    });
    CarePlan.hasMany(Medication, {
      foreignKey: 'care_plan_id',
      as: 'medicationPrescriptions'
    });
  }

  if (Medication && Medicine) {
    Medication.belongsTo(Medicine, {
      foreignKey: 'medicine_id',
      as: 'medicine'
    });
    Medicine.hasMany(Medication, {
      foreignKey: 'medicine_id',
      as: 'prescriptions'
    });
  }

  // ====== VITAL ASSOCIATIONS ======
  
  if (Vital && CarePlan) {
    Vital.belongsTo(CarePlan, {
      foreignKey: 'care_plan_id',
      as: 'carePlan'
    });
    CarePlan.hasMany(Vital, {
      foreignKey: 'care_plan_id',
      as: 'vitalReadings'
    });
  }

  if (Vital && VitalTemplate) {
    Vital.belongsTo(VitalTemplate, {
      foreignKey: 'vital_template_id',
      as: 'template'
    });
    VitalTemplate.hasMany(Vital, {
      foreignKey: 'vital_template_id',
      as: 'vitalInstances'
    });
  }

  // ====== OPTIONAL ASSOCIATIONS (for advanced features) ======
  
  // Organization relationships (if needed)
  if (Organization && Doctor) {
    Doctor.belongsTo(Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });
    Organization.hasMany(Doctor, {
      foreignKey: 'organization_id',
      as: 'organizationDoctors'
    });
  }

  if (Organization && Patient) {
    Patient.belongsTo(Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });
    Organization.hasMany(Patient, {
      foreignKey: 'organization_id',
      as: 'organizationPatients'
    });
  }

  // Treatment Plan associations
  if (TreatmentPlan && Doctor) {
    TreatmentPlan.belongsTo(Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });
    Doctor.hasMany(TreatmentPlan, {
      foreignKey: 'doctor_id',
      as: 'treatmentPlans'
    });
  }

  if (TreatmentPlan && Patient) {
    TreatmentPlan.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    Patient.hasMany(TreatmentPlan, {
      foreignKey: 'patient_id',
      as: 'patientTreatmentPlans'
    });
  }

  // Role associations (if using role-based access)
  if (User && Role && UserRole) {
    User.belongsToMany(Role, {
      through: UserRole,
      foreignKey: 'user_id',
      otherKey: 'role_id',
      as: 'roles'
    });
    Role.belongsToMany(User, {
      through: UserRole,
      foreignKey: 'role_id',
      otherKey: 'user_id',
      as: 'users'
    });
  }

  // Service plans and subscriptions (minimal for dashboard)
  if (HealthcareProvider && ServicePlan) {
    HealthcareProvider.hasMany(ServicePlan, {
      foreignKey: 'provider_id',
      as: 'servicePlans'
    });
    ServicePlan.belongsTo(HealthcareProvider, {
      foreignKey: 'provider_id',
      as: 'provider'
    });
  }

  if (Patient && PatientSubscription) {
    Patient.hasMany(PatientSubscription, {
      foreignKey: 'patient_id',
      as: 'subscriptions'
    });
    PatientSubscription.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
  }

  // Notifications
  if (Notification && User) {
    Notification.belongsTo(User, {
      foreignKey: 'recipient_id',
      as: 'recipient'
    });
    User.hasMany(Notification, {
      foreignKey: 'recipient_id',
      as: 'notifications'
    });
  }

  // Audit logs
  if (AuditLog && User) {
    AuditLog.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    User.hasMany(AuditLog, {
      foreignKey: 'user_id',
      as: 'auditLogs'
    });
  }

  // ====== NEW CHART ANALYTICS ASSOCIATIONS ======

  // MedicationLog associations
  if (MedicationLog && Medication) {
    MedicationLog.belongsTo(Medication, {
      foreignKey: 'medication_id',
      as: 'medication'
    });
    Medication.hasMany(MedicationLog, {
      foreignKey: 'medication_id',
      as: 'logs'
    });
  }

  if (MedicationLog && Patient) {
    MedicationLog.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    Patient.hasMany(MedicationLog, {
      foreignKey: 'patient_id',
      as: 'medicationLogs'
    });
  }

  // PatientAlert associations
  if (PatientAlert && Patient) {
    PatientAlert.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    Patient.hasMany(PatientAlert, {
      foreignKey: 'patient_id',
      as: 'alerts'
    });
  }

  // VitalReading associations (if not already defined)
  if (VitalReading && Patient) {
    VitalReading.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    Patient.hasMany(VitalReading, {
      foreignKey: 'patient_id',
      as: 'vitalReadings'
    });
  }

  // Additional Patient associations for provider linkage
  if (Patient && Organization) {
    Patient.belongsTo(Organization, {
      foreignKey: 'linked_provider_id',
      as: 'linkedProvider'
    });
    Organization.hasMany(Patient, {
      foreignKey: 'linked_provider_id',
      as: 'linkedPatients'
    });
  }

  // ====== CONSENT WORKFLOW ASSOCIATIONS ======
  
  // Secondary Doctor Assignment associations
  if (SecondaryDoctorAssignment) {
    // Patient relationships
    if (Patient) {
      SecondaryDoctorAssignment.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      Patient.hasMany(SecondaryDoctorAssignment, {
        foreignKey: 'patient_id',
        as: 'secondaryDoctorAssignments'
      });
    }
    
    // Primary Doctor relationships
    if (Doctor) {
      SecondaryDoctorAssignment.belongsTo(Doctor, {
        foreignKey: 'primary_doctor_id',
        as: 'primaryDoctor'
      });
      Doctor.hasMany(SecondaryDoctorAssignment, {
        foreignKey: 'primary_doctor_id',
        as: 'primaryDoctorAssignments'
      });
      
      // Secondary Doctor relationships
      SecondaryDoctorAssignment.belongsTo(Doctor, {
        foreignKey: 'secondary_doctor_id',
        as: 'secondaryDoctor'
      });
      Doctor.hasMany(SecondaryDoctorAssignment, {
        foreignKey: 'secondary_doctor_id',
        as: 'secondaryDoctorAssignments'
      });
    }
    
    // HSP relationships
    if (HSP) {
      SecondaryDoctorAssignment.belongsTo(HSP, {
        foreignKey: 'secondary_hsp_id',
        as: 'secondaryHsp'
      });
      HSP.hasMany(SecondaryDoctorAssignment, {
        foreignKey: 'secondary_hsp_id',
        as: 'secondaryHspAssignments'
      });
    }
    
    // Provider organization relationships
    if (Organization) {
      SecondaryDoctorAssignment.belongsTo(Organization, {
        foreignKey: 'primary_doctor_provider_id',
        as: 'primaryDoctorProvider'
      });
      SecondaryDoctorAssignment.belongsTo(Organization, {
        foreignKey: 'secondary_doctor_provider_id',
        as: 'secondaryDoctorProvider'
      });
      
      Organization.hasMany(SecondaryDoctorAssignment, {
        foreignKey: 'primary_doctor_provider_id',
        as: 'primaryDoctorProviderAssignments'
      });
      Organization.hasMany(SecondaryDoctorAssignment, {
        foreignKey: 'secondary_doctor_provider_id',
        as: 'secondaryDoctorProviderAssignments'
      });
    }
  }

  // Patient Consent OTP associations
  if (PatientConsentOtp) {
    // Secondary Assignment relationship
    if (SecondaryDoctorAssignment) {
      PatientConsentOtp.belongsTo(SecondaryDoctorAssignment, {
        foreignKey: 'secondary_assignment_id',
        as: 'secondaryAssignment'
      });
      SecondaryDoctorAssignment.hasMany(PatientConsentOtp, {
        foreignKey: 'secondary_assignment_id',
        as: 'consentOtps'
      });
    }
    
    // Patient relationship
    if (Patient) {
      PatientConsentOtp.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
      Patient.hasMany(PatientConsentOtp, {
        foreignKey: 'patient_id',
        as: 'consentOtps'
      });
    }
    
    // Doctor relationships
    if (Doctor) {
      PatientConsentOtp.belongsTo(Doctor, {
        foreignKey: 'primary_doctor_id',
        as: 'primaryDoctor'
      });
      PatientConsentOtp.belongsTo(Doctor, {
        foreignKey: 'secondary_doctor_id',
        as: 'secondaryDoctor'
      });
      
      Doctor.hasMany(PatientConsentOtp, {
        foreignKey: 'primary_doctor_id',
        as: 'primaryDoctorOtps'
      });
      Doctor.hasMany(PatientConsentOtp, {
        foreignKey: 'secondary_doctor_id',
        as: 'secondaryDoctorOtps'
      });
    }
    
    // HSP relationship
    if (HSP) {
      PatientConsentOtp.belongsTo(HSP, {
        foreignKey: 'secondary_hsp_id',
        as: 'secondaryHsp'
      });
      HSP.hasMany(PatientConsentOtp, {
        foreignKey: 'secondary_hsp_id',
        as: 'secondaryHspOtps'
      });
    }
    
    // User relationship for request tracking
    if (User) {
      PatientConsentOtp.belongsTo(User, {
        foreignKey: 'requested_by_user_id',
        as: 'requestedByUser'
      });
      User.hasMany(PatientConsentOtp, {
        foreignKey: 'requested_by_user_id',
        as: 'requestedOtps'
      });
    }
  }

  console.log('✅ All associations (including consent workflow) defined successfully');
}