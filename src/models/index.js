// src/models/index.js
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const UserRole = require('./UserRole')(sequelize, Sequelize.DataTypes);
const Doctor = require('./Doctor')(sequelize, Sequelize.DataTypes);
const Patient = require('./Patient')(sequelize, Sequelize.DataTypes);
const Provider = require('./Provider')(sequelize, Sequelize.DataTypes);
const Medicine = require('./Medicine')(sequelize, Sequelize.DataTypes);
const Medication = require('./Medication')(sequelize, Sequelize.DataTypes);
const Appointment = require('./Appointment')(sequelize, Sequelize.DataTypes);
const CarePlan = require('./CarePlan')(sequelize, Sequelize.DataTypes);
const Vital = require('./Vital')(sequelize, Sequelize.DataTypes);
const VitalTemplate = require('./VitalTemplate')(sequelize, Sequelize.DataTypes);
const ScheduleEvent = require('./ScheduleEvent')(sequelize, Sequelize.DataTypes);
const Speciality = require('./Speciality')(sequelize, Sequelize.DataTypes);

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
require('./associations')(db);

module.exports = db;
