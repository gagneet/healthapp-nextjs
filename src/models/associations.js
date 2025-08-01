// src/models/associations.js - Updated for Doctor/HSP separation and new models
export default (db) => {
  const {
    User,
    UserRole,
    Organization,
    Doctor,
    HSP,
    Patient,
    Provider,
    Medicine,
    Medication,
    Appointment,
    CarePlan,
    TreatmentPlan,
    Vital,
    VitalTemplate,
    ScheduleEvent,
    Speciality,
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

    // Patient care plans
    Patient.hasMany(CarePlan, {
      foreignKey: 'patient_id',
      as: 'carePlans'
    });
    CarePlan.belongsTo(Patient, {
      foreignKey: 'patient_id',
      as: 'patient'
    });

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

  return db;
};
