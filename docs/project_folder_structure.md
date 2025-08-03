# Project Structure

healthapp-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── jwt.js
│   │   ├── aws.js
│   │   └── constants.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   ├── medicationController.js
│   │   ├── appointmentController.js
│   │   ├── carePlanController.js
│   │   ├── vitalsController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── logger.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Patient.js
│   │   ├── Provider.js
│   │   ├── CarePlan.js
│   │   ├── Medication.js
│   │   ├── Appointment.js
│   │   ├── Vital.js
│   │   └── associations.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── doctors.js
│   │   ├── medications.js
│   │   ├── appointments.js
│   │   ├── carePlans.js
│   │   ├── vitals.js
│   │   └── admin.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── patientService.js
│   │   ├── doctorService.js
│   │   ├── medicationService.js
│   │   ├── schedulingService.js
│   │   └── notificationService.js
│   ├── utils/
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── responseFormatter.js
│   ├── migrations/
│   ├── seeders/
│   └── server.js
├── tests/
├── .env.example
├── .gitignore
├── README.md
└── package.json
