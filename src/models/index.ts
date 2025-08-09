// src/models/index.js - Updated with new models
import { Sequelize } from 'sequelize';
import sequelize from '../config/database.ts';

// Import models
import UserModel from './User.ts';
import UserRoleModel from './UserRole.ts';
import OrganizationModel from './Organization.ts';
import HealthcareProviderModel from './HealthcareProvider.ts';
import DoctorModel from './Doctor.ts';
import HSPModel from './HSP.ts';
import PatientModel from './Patient.ts';
import ProviderModel from './Provider.ts';
import PatientProviderAssignmentModel from './PatientProviderAssignment.ts';
import MedicineModel from './Medicine.ts';
import MedicationModel from './Medications.ts';
import AppointmentModel from './Appointment.ts';
import CarePlanModel from './CarePlan.ts';
import TreatmentPlanModel from './TreatmentPlan.ts';
import VitalModel from './Vital.ts';
import VitalTemplateModel from './VitalTemplate.ts';
import VitalTypeModel from './VitalType.ts';
import VitalReadingModel from './VitalReading.ts';
import VitalRequirementModel from './VitalRequirement.ts';
import ScheduleEventModel from './ScheduleEvent.ts';
import ScheduledEventModel from './ScheduledEvent.ts';
import AdherenceRecordModel from './AdherenceRecord.ts';
import SymptomModel from './Symptom.ts';
import NotificationModel from './Notification.ts';
import UserDeviceModel from './UserDevice.ts';
import AuditLogModel from './AuditLog.ts';
import SpecialityModel from './Speciality.ts';
import SymptomsDatabaseModel from './SymptomsDatabase.ts';
import TreatmentDatabaseModel from './TreatmentDatabase.ts';
import PatientDoctorAssignmentModel from './PatientDoctorAssignment.ts';
import ClinicModel from './Clinic.ts';
import DoctorAvailabilityModel from './DoctorAvailability.ts';
import AppointmentSlotModel from './AppointmentSlot.ts';
import ServicePlanModel from './ServicePlan.ts';
import PatientSubscriptionModel from './PatientSubscription.ts';
import PaymentModel from './Payment.ts';
import PaymentMethodModel from './PaymentMethod.ts';

// Import new chart analytics models
import MedicationLogModel from './MedicationLog.ts';
import PatientAlertModel from './PatientAlert.ts';
import DashboardMetricModel from './DashboardMetric.ts';

// Import new consent workflow models
import SecondaryDoctorAssignmentModel from './SecondaryDoctorAssignment.ts';
import PatientConsentOtpModel from './PatientConsentOtp.ts';

// Initialize models with new ES modules format
const User = UserModel(sequelize);
const UserRole = UserRoleModel(sequelize, (Sequelize as any).DataTypes);
const Organization = OrganizationModel(sequelize);
const HealthcareProvider = HealthcareProviderModel(sequelize);
const Doctor = DoctorModel(sequelize);
const HSP = HSPModel(sequelize);
const Patient = PatientModel(sequelize);
const Provider = ProviderModel(sequelize, (Sequelize as any).DataTypes);
const PatientProviderAssignment = PatientProviderAssignmentModel(sequelize);
const Medicine = MedicineModel(sequelize, (Sequelize as any).DataTypes);
const Medication = MedicationModel(sequelize, (Sequelize as any).DataTypes);
const Appointment = AppointmentModel(sequelize, (Sequelize as any).DataTypes);
const CarePlan = CarePlanModel(sequelize);
const TreatmentPlan = TreatmentPlanModel(sequelize);
const Vital = VitalModel(sequelize, (Sequelize as any).DataTypes);
const VitalTemplate = VitalTemplateModel(sequelize, (Sequelize as any).DataTypes);
const VitalType = VitalTypeModel(sequelize);
const VitalReading = VitalReadingModel(sequelize);
const VitalRequirement = VitalRequirementModel(sequelize);
const ScheduleEvent = ScheduleEventModel(sequelize, (Sequelize as any).DataTypes);
const ScheduledEvent = ScheduledEventModel(sequelize);
const AdherenceRecord = AdherenceRecordModel(sequelize);
const Symptom = SymptomModel(sequelize);
const Notification = NotificationModel(sequelize);
const UserDevice = UserDeviceModel(sequelize);
const AuditLog = AuditLogModel(sequelize);
const Speciality = SpecialityModel(sequelize, (Sequelize as any).DataTypes);
const SymptomsDatabase = SymptomsDatabaseModel(sequelize);
const TreatmentDatabase = TreatmentDatabaseModel(sequelize);
const PatientDoctorAssignment = PatientDoctorAssignmentModel(sequelize);
const Clinic = ClinicModel(sequelize);
const DoctorAvailability = DoctorAvailabilityModel(sequelize, (Sequelize as any).DataTypes);
const AppointmentSlot = AppointmentSlotModel(sequelize, (Sequelize as any).DataTypes);
const ServicePlan = ServicePlanModel(sequelize, (Sequelize as any).DataTypes);
const PatientSubscription = PatientSubscriptionModel(sequelize, (Sequelize as any).DataTypes);
const Payment = PaymentModel(sequelize, (Sequelize as any).DataTypes);
const PaymentMethod = PaymentMethodModel(sequelize, (Sequelize as any).DataTypes);

// Initialize new chart analytics models
const MedicationLog = MedicationLogModel(sequelize);
const PatientAlert = PatientAlertModel(sequelize);
const DashboardMetric = DashboardMetricModel(sequelize);

// Initialize new consent workflow models
const SecondaryDoctorAssignment = SecondaryDoctorAssignmentModel(sequelize);
const PatientConsentOtp = PatientConsentOtpModel(sequelize);

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
  Clinic,
  DoctorAvailability,
  AppointmentSlot,
  ServicePlan,
  PatientSubscription,
  Payment,
  PaymentMethod,
  // New chart analytics models
  MedicationLog,
  PatientAlert,
  DashboardMetric,
  // New consent workflow models
  SecondaryDoctorAssignment,
  PatientConsentOtp
};

// Set up associations
import setupAssociations from './associations.ts';
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
  PatientDoctorAssignment,
  Clinic,
  DoctorAvailability,
  AppointmentSlot,
  ServicePlan,
  PatientSubscription,
  Payment,
  PaymentMethod,
  MedicationLog,
  PatientAlert,
  DashboardMetric,
  SecondaryDoctorAssignment,
  PatientConsentOtp
};
export default db;
