// src/models/associations.js - Updated for PostgreSQL Healthcare Schema
export default (db) => {
  const {
    User,
    UserRole,
    Organization,
    HealthcareProvider,
    Doctor,
    HSP,
    Patient,
    Provider,
    PatientProviderAssignment,
    CarePlanTemplate,
    Medicine,
    Medication,
    Appointment,
    CarePlan,
    TreatmentPlan,
    Vital,
    VitalTemplate,
    VitalType,
    VitalRequirement,
    VitalReading,
    ScheduleEvent,
    ScheduledEvent,
    AdherenceRecord,
    Symptom,
    Notification,
    UserDevice,
    ServicePlan,
    PatientSubscription,
    AuditLog,
    Speciality,
    PatientDoctorAssignment,
    DoctorAvailability,
    AppointmentSlot,
    Payment,
    PaymentMethod,
  } = db;

  // Organization associations
  if (Organization) {
    Organization.hasMany(User, {
      foreignKey: 'organization_id',
      as: 'users'
    });
    
    Organization.hasMany(Doctor, {
      foreignKey: 'organization_id',
      as: 'doctors'
    });
    
    Organization.hasMany(HSP, {
      foreignKey: 'organization_id',
      as: 'hsps'
    });
    
    Organization.hasMany(Patient, {
      foreignKey: 'organization_id',
      as: 'patients'
    });
  }

  // User associations
  User.hasMany(UserRole, { 
    foreignKey: 'user_identity', 
    as: 'roles' 
  });
  UserRole.belongsTo(User, { 
    foreignKey: 'user_identity', 
    as: 'user' 
  });

  User.hasOne(Doctor, { 
    foreignKey: 'user_id', 
    as: 'doctor' 
  });
  Doctor.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });

  User.hasOne(HSP, {
    foreignKey: 'user_id',
    as: 'hsp'
  });
  HSP.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  User.hasOne(Patient, { 
    foreignKey: 'user_id', 
    as: 'patient' 
  });
  Patient.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });

  // Legacy Provider associations (keep for backward compatibility)
  if (Provider) {
    User.hasOne(Provider, { 
      foreignKey: 'user_id', 
      as: 'provider' 
    });
    Provider.belongsTo(User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
  }

  // Doctor associations
  if (Organization) {
    Doctor.belongsTo(Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });
  }

  if (Speciality) {
    Doctor.belongsTo(Speciality, { 
      foreignKey: 'speciality_id', 
      as: 'speciality' 
    });
    Speciality.hasMany(Doctor, { 
      foreignKey: 'speciality_id', 
      as: 'doctors' 
    });
  }

  // Doctor-Patient relationships
  Doctor.hasMany(Patient, {
    foreignKey: 'primary_care_doctor_id',
    as: 'primaryCarePatients'
  });
  Patient.belongsTo(Doctor, {
    foreignKey: 'primary_care_doctor_id',
    as: 'primaryCareDoctor'
  });

  // HSP associations
  if (Organization) {
    HSP.belongsTo(Organization, {
      foreignKey: 'organization_id',
      as: 'organization'
    });
  }

  // HSP supervision
  HSP.belongsTo(Doctor, {
    foreignKey: 'supervising_doctor_id',
    as: 'supervisingDoctor'
  });
  Doctor.hasMany(HSP, {
    foreignKey: 'supervising_doctor_id',
    as: 'supervisedHSPs'
  });

  // HSP-Patient relationships
  HSP.hasMany(Patient, {
    foreignKey: 'primary_care_hsp_id',
    as: 'primaryCarePatients'
  });
  Patient.belongsTo(HSP, {
    foreignKey: 'primary_care_hsp_id',
    as: 'primaryCareHSP'
  });

  // Treatment Plan associations
  if (TreatmentPlan) {
    Doctor.hasMany(TreatmentPlan, {
      foreignKey: 'doctor_id',
      as: 'treatmentPlans'
    });
    TreatmentPlan.belongsTo(Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });

    Patient.hasMany(TreatmentPlan, {
      foreignKey: 'patient_id',
      as: 'treatmentPlans'
    });
    TreatmentPlan.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    if (Organization) {
      TreatmentPlan.belongsTo(Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });
    }
  }

  // Care Plan associations (updated for Doctor/HSP creators)
  if (CarePlan) {
    // Doctor-created care plans
    Doctor.hasMany(CarePlan, {
      foreignKey: 'created_by_doctor_id',
      as: 'createdCarePlans'
    });
    CarePlan.belongsTo(Doctor, {
      foreignKey: 'created_by_doctor_id',
      as: 'createdByDoctor'
    });

    // HSP-created care plans
    HSP.hasMany(CarePlan, {
      foreignKey: 'created_by_hsp_id',
      as: 'createdCarePlans'
    });
    CarePlan.belongsTo(HSP, {
      foreignKey: 'created_by_hsp_id',
      as: 'createdByHSP'
    });

    // Patient care plans - moved to PostgreSQL schema section below

    if (Organization) {
      CarePlan.belongsTo(Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });
    }

    // Legacy doctor association (keep for backward compatibility)
    CarePlan.belongsTo(Doctor, { 
      foreignKey: 'doctor_id', 
      as: 'doctor' 
    });
  }

  // Medicine and Medication associations
  if (Medicine && Medication) {
    Medicine.hasMany(Medication, { 
      foreignKey: 'medicine_id', 
      as: 'medications' 
    });
    Medication.belongsTo(Medicine, { 
      foreignKey: 'medicine_id', 
      as: 'medicine' 
    });
  }

  // Vital associations
  if (CarePlan && Vital) {
    CarePlan.hasMany(Vital, { 
      foreignKey: 'care_plan_id', 
      as: 'vitals' 
    });
    Vital.belongsTo(CarePlan, { 
      foreignKey: 'care_plan_id', 
      as: 'carePlan' 
    });
  }

  if (VitalTemplate && Vital) {
    VitalTemplate.hasMany(Vital, { 
      foreignKey: 'vital_template_id', 
      as: 'vitals' 
    });
    Vital.belongsTo(VitalTemplate, { 
      foreignKey: 'vital_template_id', 
      as: 'template' 
    });
  }

  // Appointment associations (updated for Doctor/HSP providers)
  if (Appointment) {
    // Doctor appointments
    Doctor.hasMany(Appointment, {
      foreignKey: 'doctor_id',
      as: 'appointments'
    });
    Appointment.belongsTo(Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });

    // HSP appointments
    HSP.hasMany(Appointment, {
      foreignKey: 'hsp_id',
      as: 'appointments'
    });
    Appointment.belongsTo(HSP, {
      foreignKey: 'hsp_id',
      as: 'hsp'
    });

    // Patient appointments
    Patient.hasMany(Appointment, {
      foreignKey: 'patient_id',
      as: 'appointments'
    });
    Appointment.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    // Legacy provider association (keep for backward compatibility)
    Appointment.belongsTo(User, { 
      foreignKey: 'provider_id', 
      as: 'provider' 
    });
  }

  // Verification associations
  Doctor.belongsTo(User, {
    foreignKey: 'verified_by',
    as: 'verifiedByUser'
  });

  HSP.belongsTo(User, {
    foreignKey: 'verified_by',
    as: 'verifiedByUser'
  });

  // HealthcareProvider associations (new PostgreSQL schema)
  if (HealthcareProvider) {
    User.hasOne(HealthcareProvider, {
      foreignKey: 'user_id',
      as: 'healthcareProvider'
    });
    HealthcareProvider.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    if (Organization) {
      HealthcareProvider.belongsTo(Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });
      Organization.hasMany(HealthcareProvider, {
        foreignKey: 'organization_id',
        as: 'healthcareProviders'
      });
    }

    // Verification associations
    HealthcareProvider.belongsTo(User, {
      foreignKey: 'verified_by',
      as: 'verifiedByUser'
    });
  }

  // PatientProviderAssignment associations
  if (PatientProviderAssignment) {
    Patient.belongsToMany(HealthcareProvider, {
      through: PatientProviderAssignment,
      foreignKey: 'patient_id',
      otherKey: 'provider_id',
      as: 'assignedProviders'
    });
    
    HealthcareProvider.belongsToMany(Patient, {
      through: PatientProviderAssignment,
      foreignKey: 'provider_id',
      otherKey: 'patient_id',
      as: 'assignedPatients'
    });

    PatientProviderAssignment.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    
    PatientProviderAssignment.belongsTo(HealthcareProvider, {
      foreignKey: 'provider_id',
      as: 'provider'
    });

    PatientProviderAssignment.belongsTo(User, {
      foreignKey: 'assigned_by',
      as: 'assignedBy'
    });
  }

  // CarePlanTemplate associations
  if (CarePlanTemplate) {
    HealthcareProvider.hasMany(CarePlanTemplate, {
      foreignKey: 'created_by',
      as: 'carePlanTemplates'
    });
    CarePlanTemplate.belongsTo(HealthcareProvider, {
      foreignKey: 'created_by',
      as: 'createdBy'
    });

    if (Organization) {
      CarePlanTemplate.belongsTo(Organization, {
        foreignKey: 'organization_id',
        as: 'organization'
      });
    }

    CarePlanTemplate.belongsTo(User, {
      foreignKey: 'approved_by',
      as: 'approvedBy'
    });

    // Self-referencing template versioning
    CarePlanTemplate.belongsTo(CarePlanTemplate, {
      foreignKey: 'parent_template_id',
      as: 'parentTemplate'
    });
    CarePlanTemplate.hasMany(CarePlanTemplate, {
      foreignKey: 'parent_template_id',
      as: 'childTemplates'
    });
  }

  // Updated CarePlan associations for PostgreSQL schema
  if (CarePlan) {
    CarePlan.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
    Patient.hasMany(CarePlan, {
      foreignKey: 'patient_id',
      as: 'carePlans'
    });

    CarePlan.belongsTo(HealthcareProvider, {
      foreignKey: 'provider_id',
      as: 'provider'
    });
    HealthcareProvider.hasMany(CarePlan, {
      foreignKey: 'provider_id',
      as: 'carePlans'
    });

    if (CarePlanTemplate) {
      CarePlan.belongsTo(CarePlanTemplate, {
        foreignKey: 'template_id',
        as: 'template'
      });
      CarePlanTemplate.hasMany(CarePlan, {
        foreignKey: 'template_id',
        as: 'activePlans'
      });
    }
  }

  // VitalType associations
  if (VitalType) {
    VitalType.hasMany(VitalRequirement, {
      foreignKey: 'vital_type_id',
      as: 'requirements'
    });
    
    VitalType.hasMany(VitalReading, {
      foreignKey: 'vital_type_id',
      as: 'readings'
    });
  }

  // VitalRequirement associations
  if (VitalRequirement) {
    CarePlan.hasMany(VitalRequirement, {
      foreignKey: 'care_plan_id',
      as: 'vitalRequirements'
    });
    VitalRequirement.belongsTo(CarePlan, {
      foreignKey: 'care_plan_id',
      as: 'carePlan'
    });

    VitalRequirement.belongsTo(VitalType, {
      foreignKey: 'vital_type_id',
      as: 'vitalType'
    });
  }

  // VitalReading associations - only if model exists
  if (VitalReading && VitalType) {
    Patient.hasMany(VitalReading, {
      foreignKey: 'patient_id',
      as: 'vitalReadings'
    });
    VitalReading.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    VitalReading.belongsTo(VitalType, {
      foreignKey: 'vital_type_id',
      as: 'vitalType'
    });

    if (AdherenceRecord) {
      VitalReading.belongsTo(AdherenceRecord, {
        foreignKey: 'adherence_record_id',
        as: 'adherenceRecord'
      });
    }

    VitalReading.belongsTo(HealthcareProvider, {
      foreignKey: 'validated_by',
      as: 'validatedBy'
    });
  }

  // ScheduledEvent associations - only if model exists
  if (ScheduledEvent && User) {
    Patient.hasMany(ScheduledEvent, {
      foreignKey: 'patient_id',
      as: 'scheduledEvents'
    });
    ScheduledEvent.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    if (CarePlan) {
      CarePlan.hasMany(ScheduledEvent, {
        foreignKey: 'care_plan_id',
        as: 'scheduledEvents'
      });
      ScheduledEvent.belongsTo(CarePlan, {
        foreignKey: 'care_plan_id',
        as: 'carePlan'
      });
    }

    ScheduledEvent.belongsTo(User, {
      foreignKey: 'completed_by',
      as: 'completedBy'
    });
  }

  // AdherenceRecord associations - only if model exists
  if (AdherenceRecord && ScheduledEvent) {
    Patient.hasMany(AdherenceRecord, {
      foreignKey: 'patient_id',
      as: 'adherenceRecords'
    });
    AdherenceRecord.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    if (ScheduledEvent) {
      AdherenceRecord.belongsTo(ScheduledEvent, {
        foreignKey: 'scheduled_event_id',
        as: 'scheduledEvent'
      });
      ScheduledEvent.hasMany(AdherenceRecord, {
        foreignKey: 'scheduled_event_id',
        as: 'adherenceRecords'
      });
    }

    AdherenceRecord.hasMany(VitalReading, {
      foreignKey: 'adherence_record_id',
      as: 'vitalReadings'
    });
  }

  // Symptom associations - only if model exists
  if (Symptom && CarePlan) {
    Patient.hasMany(Symptom, {
      foreignKey: 'patient_id',
      as: 'symptoms'
    });
    Symptom.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    if (CarePlan) {
      CarePlan.hasMany(Symptom, {
        foreignKey: 'care_plan_id',
        as: 'symptoms'
      });
      Symptom.belongsTo(CarePlan, {
        foreignKey: 'care_plan_id',
        as: 'carePlan'
      });
    }
  }

  // Notification associations
  if (Notification) {
    User.hasMany(Notification, {
      foreignKey: 'recipient_id',
      as: 'notifications'
    });
    Notification.belongsTo(User, {
      foreignKey: 'recipient_id',
      as: 'recipient'
    });
  }

  // UserDevice associations
  if (UserDevice) {
    User.hasMany(UserDevice, {
      foreignKey: 'user_id',
      as: 'devices'
    });
    UserDevice.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }

  // ServicePlan associations
  if (ServicePlan) {
    HealthcareProvider.hasMany(ServicePlan, {
      foreignKey: 'provider_id',
      as: 'servicePlans'
    });
    ServicePlan.belongsTo(HealthcareProvider, {
      foreignKey: 'provider_id',
      as: 'provider'
    });
  }

  // PatientSubscription associations
  if (PatientSubscription) {
    Patient.hasMany(PatientSubscription, {
      foreignKey: 'patient_id',
      as: 'subscriptions'
    });
    PatientSubscription.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    HealthcareProvider.hasMany(PatientSubscription, {
      foreignKey: 'provider_id',
      as: 'patientSubscriptions'
    });
    PatientSubscription.belongsTo(HealthcareProvider, {
      foreignKey: 'provider_id',
      as: 'provider'
    });

    if (ServicePlan) {
      ServicePlan.hasMany(PatientSubscription, {
        foreignKey: 'service_plan_id',
        as: 'subscriptions'
      });
      PatientSubscription.belongsTo(ServicePlan, {
        foreignKey: 'service_plan_id',
        as: 'servicePlan'
      });
    }
  }

  // AuditLog associations
  if (AuditLog) {
    User.hasMany(AuditLog, {
      foreignKey: 'user_id',
      as: 'auditLogs'
    });
    AuditLog.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }

  // PatientDoctorAssignment associations
  if (PatientDoctorAssignment) {
    // Patient to Doctor assignments
    Patient.hasMany(PatientDoctorAssignment, {
      foreignKey: 'patient_id',
      as: 'doctorAssignments'
    });
    PatientDoctorAssignment.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

    // Doctor to Patient assignments
    Doctor.hasMany(PatientDoctorAssignment, {
      foreignKey: 'doctor_id',
      as: 'patientAssignments'
    });
    PatientDoctorAssignment.belongsTo(Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });

    // Doctor who assigned (primary doctor)
    PatientDoctorAssignment.belongsTo(Doctor, {
      foreignKey: 'assigned_by_doctor_id',
      as: 'assignedByDoctor'
    });
    Doctor.hasMany(PatientDoctorAssignment, {
      foreignKey: 'assigned_by_doctor_id',
      as: 'assignmentsMade'
    });

    // Admin who assigned
    PatientDoctorAssignment.belongsTo(User, {
      foreignKey: 'assigned_by_admin_id',
      as: 'assignedByAdmin'
    });
    User.hasMany(PatientDoctorAssignment, {
      foreignKey: 'assigned_by_admin_id',
      as: 'doctorAssignmentsMade'
    });

    // Many-to-many relationship through assignments
    Patient.belongsToMany(Doctor, {
      through: PatientDoctorAssignment,
      foreignKey: 'patient_id',
      otherKey: 'doctor_id',
      as: 'assignedDoctors'
    });
    
    Doctor.belongsToMany(Patient, {
      through: PatientDoctorAssignment,
      foreignKey: 'doctor_id',
      otherKey: 'patient_id',
      as: 'assignedPatients'
    });
  }

  // Doctor Availability associations
  if (DoctorAvailability && Doctor) {
    Doctor.hasMany(DoctorAvailability, {
      foreignKey: 'doctor_id',
      as: 'availability'
    });
    DoctorAvailability.belongsTo(Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });
  }

  // Appointment Slot associations
  if (AppointmentSlot && Doctor) {
    Doctor.hasMany(AppointmentSlot, {
      foreignKey: 'doctor_id',
      as: 'slots'
    });
    AppointmentSlot.belongsTo(Doctor, {
      foreignKey: 'doctor_id',
      as: 'doctor'
    });
  }

  // Appointment to Slot association
  if (Appointment && AppointmentSlot) {
    Appointment.belongsTo(AppointmentSlot, {
      foreignKey: 'slot_id',
      as: 'slot'
    });
    AppointmentSlot.hasMany(Appointment, {
      foreignKey: 'slot_id',
      as: 'appointments'
    });
  }

  // Service Plan associations
  if (ServicePlan && HealthcareProvider) {
    HealthcareProvider.hasMany(ServicePlan, {
      foreignKey: 'provider_id',
      as: 'servicePlans'
    });
    ServicePlan.belongsTo(HealthcareProvider, {
      foreignKey: 'provider_id',
      as: 'provider'
    });
  }

  // Patient Subscription associations
  if (PatientSubscription) {
    if (Patient) {
      Patient.hasMany(PatientSubscription, {
        foreignKey: 'patient_id',
        as: 'subscriptions'
      });
      PatientSubscription.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
    }

    if (HealthcareProvider) {
      HealthcareProvider.hasMany(PatientSubscription, {
        foreignKey: 'provider_id',
        as: 'subscriptions'
      });
      PatientSubscription.belongsTo(HealthcareProvider, {
        foreignKey: 'provider_id',
        as: 'provider'
      });
    }

    if (ServicePlan) {
      ServicePlan.hasMany(PatientSubscription, {
        foreignKey: 'service_plan_id',
        as: 'subscriptions'
      });
      PatientSubscription.belongsTo(ServicePlan, {
        foreignKey: 'service_plan_id',
        as: 'servicePlan'
      });
    }
  }

  // Payment associations
  if (Payment) {
    if (PatientSubscription) {
      PatientSubscription.hasMany(Payment, {
        foreignKey: 'subscription_id',
        as: 'payments'
      });
      Payment.belongsTo(PatientSubscription, {
        foreignKey: 'subscription_id',
        as: 'subscription'
      });
    }

    if (Patient) {
      Patient.hasMany(Payment, {
        foreignKey: 'patient_id',
        as: 'payments'
      });
      Payment.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
      });
    }

    if (HealthcareProvider) {
      HealthcareProvider.hasMany(Payment, {
        foreignKey: 'provider_id',
        as: 'payments'
      });
      Payment.belongsTo(HealthcareProvider, {
        foreignKey: 'provider_id',
        as: 'provider'
      });
    }
  }

  // Payment Method associations
  if (PaymentMethod && Patient) {
    Patient.hasMany(PaymentMethod, {
      foreignKey: 'patient_id',
      as: 'paymentMethods'
    });
    PaymentMethod.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });
  }

  return db;
};
