// src/models/index.js - Updated with new models
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

// Import models
import UserModel from './User.js';
import UserRoleModel from './UserRole.js';
import OrganizationModel from './Organization.js';
import HealthcareProviderModel from './HealthcareProvider.js';
import DoctorModel from './Doctor.js';
import HSPModel from './HSP.js';
import PatientModel from './Patient.js';
import ProviderModel from './Provider.js';
import PatientProviderAssignmentModel from './PatientProviderAssignment.js';
import MedicineModel from './Medicine.js';
import MedicationModel from './Medications.js';
import AppointmentModel from './Appointment.js';
import CarePlanModel from './CarePlan.js';
import TreatmentPlanModel from './TreatmentPlan.js';
import VitalModel from './Vital.js';
import VitalTemplateModel from './VitalTemplate.js';
import VitalTypeModel from './VitalType.js';
import VitalReadingModel from './VitalReading.js';
import VitalRequirementModel from './VitalRequirement.js';
import ScheduleEventModel from './ScheduleEvent.js';
import ScheduledEventModel from './ScheduledEvent.js';
import AdherenceRecordModel from './AdherenceRecord.js';
import SymptomModel from './Symptom.js';
import NotificationModel from './Notification.js';
import UserDeviceModel from './UserDevice.js';
import AuditLogModel from './AuditLog.js';
import SpecialityModel from './Speciality.js';
import SymptomsDatabaseModel from './SymptomsDatabase.js';
import TreatmentDatabaseModel from './TreatmentDatabase.js';
import PatientDoctorAssignmentModel from './PatientDoctorAssignment.js';

// Initialize models with new ES modules format
const User = UserModel(sequelize);
const UserRole = UserRoleModel(sequelize, Sequelize.DataTypes);
const Organization = OrganizationModel(sequelize);
const HealthcareProvider = HealthcareProviderModel(sequelize);
const Doctor = DoctorModel(sequelize);
const HSP = HSPModel(sequelize);
const Patient = PatientModel(sequelize);
const Provider = ProviderModel(sequelize, Sequelize.DataTypes);
const PatientProviderAssignment = PatientProviderAssignmentModel(sequelize);
const Medicine = MedicineModel(sequelize, Sequelize.DataTypes);
const Medication = MedicationModel(sequelize, Sequelize.DataTypes);
const Appointment = AppointmentModel(sequelize, Sequelize.DataTypes);
const CarePlan = CarePlanModel(sequelize);
const TreatmentPlan = TreatmentPlanModel(sequelize);
const Vital = VitalModel(sequelize, Sequelize.DataTypes);
const VitalTemplate = VitalTemplateModel(sequelize, Sequelize.DataTypes);
const VitalType = VitalTypeModel(sequelize);
const VitalReading = VitalReadingModel(sequelize);
const VitalRequirement = VitalRequirementModel(sequelize);
const ScheduleEvent = ScheduleEventModel(sequelize, Sequelize.DataTypes);
const ScheduledEvent = ScheduledEventModel(sequelize);
const AdherenceRecord = AdherenceRecordModel(sequelize);
const Symptom = SymptomModel(sequelize);
const Notification = NotificationModel(sequelize);
const UserDevice = UserDeviceModel(sequelize);
const AuditLog = AuditLogModel(sequelize);
const Speciality = SpecialityModel(sequelize, Sequelize.DataTypes);
const SymptomsDatabase = SymptomsDatabaseModel(sequelize);
const TreatmentDatabase = TreatmentDatabaseModel(sequelize);
const PatientDoctorAssignment = PatientDoctorAssignmentModel(sequelize);

const db = {
  sequelize,
  Sequelize,
  User,
  UserRole,
  Organization,
  HealthcareProvider,
  Doctor,
  HSP,
  Patient,
  Provider,
  PatientProviderAssignment,
  Medicine,
  Medication,
  Appointment,
  CarePlan,
  TreatmentPlan,
  Vital,
  VitalTemplate,
  VitalType,
  VitalReading,
  VitalRequirement,
  ScheduleEvent,
  ScheduledEvent,
  AdherenceRecord,
  Symptom,
  Notification,
  UserDevice,
  AuditLog,
  Speciality,
  SymptomsDatabase,
  TreatmentDatabase,
  PatientDoctorAssignment,
};

// Set up associations
import setupAssociations from './associations.js';
setupAssociations(db);

export { 
  sequelize, 
  Sequelize, 
  User, 
  UserRole, 
  Organization,
  HealthcareProvider,
  Doctor, 
  HSP,
  Patient, 
  Provider,
  PatientProviderAssignment,
  Medicine, 
  Medication, 
  Appointment, 
  CarePlan, 
  TreatmentPlan,
  Vital, 
  VitalTemplate,
  VitalType,
  VitalReading,
  VitalRequirement,
  ScheduleEvent,
  ScheduledEvent,
  AdherenceRecord,
  Symptom,
  Notification,
  UserDevice,
  AuditLog,
  Speciality,
  SymptomsDatabase,
  TreatmentDatabase,
  PatientDoctorAssignment
};
export default db;
