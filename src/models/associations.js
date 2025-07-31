// src/models/associations.js
module.exports = (db) => {
  const {
    User,
    UserRole,
    Doctor,
    Patient,
    Provider,
    Medicine,
    Medication,
    Appointment,
    CarePlan,
    Vital,
    VitalTemplate,
    ScheduleEvent,
    Speciality,
  } = db;

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

  User.hasOne(Patient, { 
    foreignKey: 'user_id', 
    as: 'patient' 
  });
  Patient.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });

  User.hasOne(Provider, { 
    foreignKey: 'user_id', 
    as: 'provider' 
  });
  Provider.belongsTo(User, { 
    foreignKey: 'user_id', 
    as: 'user' 
  });

  // Doctor associations
  Doctor.belongsTo(Speciality, { 
    foreignKey: 'speciality_id', 
    as: 'speciality' 
  });
  Speciality.hasMany(Doctor, { 
    foreignKey: 'speciality_id', 
    as: 'doctors' 
  });

  Doctor.hasMany(CarePlan, { 
    foreignKey: 'doctor_id', 
    as: 'carePlans' 
  });
  CarePlan.belongsTo(Doctor, { 
    foreignKey: 'doctor_id', 
    as: 'doctor' 
  });

  // Patient associations
  Patient.belongsTo(User, { 
    foreignKey: 'assigned_doctor_id', 
    as: 'assignedDoctor' 
  });

  Patient.hasMany(CarePlan, { 
    foreignKey: 'patient_id', 
    as: 'carePlans' 
  });
  CarePlan.belongsTo(Patient, { 
    foreignKey: 'patient_id', 
    as: 'patient' 
  });

  // Medicine and Medication associations
  Medicine.hasMany(Medication, { 
    foreignKey: 'medicine_id', 
    as: 'medications' 
  });
  Medication.belongsTo(Medicine, { 
    foreignKey: 'medicine_id', 
    as: 'medicine' 
  });

  // CarePlan associations
  CarePlan.hasMany(Vital, { 
    foreignKey: 'care_plan_id', 
    as: 'vitals' 
  });
  Vital.belongsTo(CarePlan, { 
    foreignKey: 'care_plan_id', 
    as: 'carePlan' 
  });

  // Vital associations
  VitalTemplate.hasMany(Vital, { 
    foreignKey: 'vital_template_id', 
    as: 'vitals' 
  });
  Vital.belongsTo(VitalTemplate, { 
    foreignKey: 'vital_template_id', 
    as: 'template' 
  });

  // Appointment associations
  Appointment.belongsTo(User, { 
    foreignKey: 'provider_id', 
    as: 'provider' 
  });

  return db;
};
