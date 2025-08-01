// src/models/index.js
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

// Import models
import UserModel from './User.js';
import UserRoleModel from './UserRole.js';
import DoctorModel from './Doctor.js';
import PatientModel from './Patient.js';
import ProviderModel from './Provider.js';
import MedicineModel from './Medicine.js';
import MedicationModel from './Medications.js';
import AppointmentModel from './Appointment.js';
import CarePlanModel from './CarePlan.js';
import VitalModel from './Vital.js';
import VitalTemplateModel from './VitalTemplate.js';
import ScheduleEventModel from './ScheduleEvent.js';
import SpecialityModel from './Speciality.js';

// Initialize models
const User = UserModel(sequelize, Sequelize.DataTypes);
const UserRole = UserRoleModel(sequelize, Sequelize.DataTypes);
const Doctor = DoctorModel(sequelize, Sequelize.DataTypes);
const Patient = PatientModel(sequelize, Sequelize.DataTypes);
const Provider = ProviderModel(sequelize, Sequelize.DataTypes);
const Medicine = MedicineModel(sequelize, Sequelize.DataTypes);
const Medication = MedicationModel(sequelize, Sequelize.DataTypes);
const Appointment = AppointmentModel(sequelize, Sequelize.DataTypes);
const CarePlan = CarePlanModel(sequelize, Sequelize.DataTypes);
const Vital = VitalModel(sequelize, Sequelize.DataTypes);
const VitalTemplate = VitalTemplateModel(sequelize, Sequelize.DataTypes);
const ScheduleEvent = ScheduleEventModel(sequelize, Sequelize.DataTypes);
const Speciality = SpecialityModel(sequelize, Sequelize.DataTypes);

const db = {
  sequelize,
  Sequelize,
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
};

// Set up associations
import setupAssociations from './associations.js';
setupAssociations(db);

export { sequelize, Sequelize, User, UserRole, Doctor, Patient, Provider, Medicine, Medication, Appointment, CarePlan, Vital, VitalTemplate, ScheduleEvent, Speciality };
export default db;
