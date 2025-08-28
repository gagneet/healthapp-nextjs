// Database and Sequelize types
import { Model, Optional, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';

// Base model attributes that all models should have
export interface BaseModelAttributes {
  id: CreationOptional<string>;
  createdAt?: CreationOptional<Date>;
  updatedAt?: CreationOptional<Date>;
  deleted_at?: Date | null;
}

// User model attributes
export interface UserAttributes extends BaseModelAttributes {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  gender?: string;
  date_of_birth?: Date;
  account_status: string;
  email_verified: boolean;
  phone_verified?: boolean;
  last_login?: Date;
  role?: string;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Patient model attributes
export interface PatientAttributes extends BaseModelAttributes {
  userId: string;
  patientId: string;
  emergency_contact?: string;
  emergency_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  medical_history?: any;
  allergies?: string[];
  current_medications?: string[];
}

// Doctor model attributes
export interface DoctorAttributes extends BaseModelAttributes {
  userId: string;
  doctorId: string;
  license_number: string;
  speciality_id?: string;
  years_experience?: number;
  education?: string;
  certifications?: string[];
  hospital_affiliations?: string[];
  consultation_fee?: number;
  bio?: string;
  profile_image?: string;
  availability?: any;
}

// Generic service response type
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

// Sequelize query options with common fields
export interface QueryOptions {
  where?: any;
  include?: any;
  order?: any;
  limit?: number;
  offset?: number;
  attributes?: string[];
}