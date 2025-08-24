// lib/seed.ts - Comprehensive Healthcare Test Data Seeding with Updated Schema
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "seedComprehensiveHealthcareData", {
    enumerable: true,
    get: function() {
        return seedComprehensiveHealthcareData;
    }
});
var _client = require("@prisma/client");
var _bcryptjs = /*#__PURE__*/ _interop_require_wildcard(require("bcryptjs"));
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _ts_generator(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var prisma = new _client.PrismaClient();
// Database cleanup function to remove all existing data
function cleanDatabase() {
    return _async_to_generator(function() {
        var cleanupOperations, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, operation, error, err, error1;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    console.log('🧹 Cleaning database - removing all existing data...');
                    _state.label = 1;
                case 1:
                    _state.trys.push([
                        1,
                        12,
                        ,
                        13
                    ]);
                    // Delete in reverse dependency order to avoid foreign key constraints
                    // Use error handling for each operation to continue even if tables don't exist
                    cleanupOperations = [
                        function() {
                            return prisma.adherenceRecord.deleteMany({});
                        },
                        function() {
                            return prisma.medication.deleteMany({});
                        },
                        function() {
                            return prisma.vital.deleteMany({});
                        },
                        function() {
                            return prisma.symptom.deleteMany({});
                        },
                        function() {
                            return prisma.carePlan.deleteMany({});
                        },
                        function() {
                            return prisma.appointment.deleteMany({});
                        },
                        function() {
                            return prisma.clinic.deleteMany({});
                        },
                        function() {
                            return prisma.patient.deleteMany({});
                        },
                        function() {
                            return prisma.doctor.deleteMany({});
                        },
                        function() {
                            return prisma.hSP.deleteMany({});
                        },
                        function() {
                            return prisma.providers.deleteMany({});
                        },
                        function() {
                            return prisma.medicine.deleteMany({});
                        },
                        function() {
                            return prisma.vitalTemplates.deleteMany({});
                        },
                        function() {
                            return prisma.symptomsDatabase.deleteMany({});
                        },
                        function() {
                            return prisma.treatmentDatabase.deleteMany({});
                        },
                        function() {
                            return prisma.speciality.deleteMany({});
                        },
                        function() {
                            return prisma.organization.deleteMany({});
                        },
                        function() {
                            return prisma.user.deleteMany({});
                        }
                    ];
                    _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    _state.label = 2;
                case 2:
                    _state.trys.push([
                        2,
                        9,
                        10,
                        11
                    ]);
                    _iterator = cleanupOperations[Symbol.iterator]();
                    _state.label = 3;
                case 3:
                    if (!!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) return [
                        3,
                        8
                    ];
                    operation = _step.value;
                    _state.label = 4;
                case 4:
                    _state.trys.push([
                        4,
                        6,
                        ,
                        7
                    ]);
                    return [
                        4,
                        operation()
                    ];
                case 5:
                    _state.sent();
                    return [
                        3,
                        7
                    ];
                case 6:
                    error = _state.sent();
                    // Continue with next operation even if current fails
                    console.log("⚠️ Cleanup operation failed (continuing): ".concat(error.message));
                    return [
                        3,
                        7
                    ];
                case 7:
                    _iteratorNormalCompletion = true;
                    return [
                        3,
                        3
                    ];
                case 8:
                    return [
                        3,
                        11
                    ];
                case 9:
                    err = _state.sent();
                    _didIteratorError = true;
                    _iteratorError = err;
                    return [
                        3,
                        11
                    ];
                case 10:
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                    return [
                        7
                    ];
                case 11:
                    console.log('✅ Database cleaned successfully');
                    return [
                        3,
                        13
                    ];
                case 12:
                    error1 = _state.sent();
                    console.error('❌ Error cleaning database:', error1.message);
                    throw error1;
                case 13:
                    return [
                        2
                    ];
            }
        });
    })();
}
// Helper functions for realistic dates
var getRandomPastDate = function() {
    var minDaysAgo = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 7, maxDaysAgo = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 90;
    var now = new Date();
    var minDate = new Date(now.getTime() - maxDaysAgo * 24 * 60 * 60 * 1000);
    var maxDate = new Date(now.getTime() - minDaysAgo * 24 * 60 * 60 * 1000);
    return new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
};
var getRecentDate = function() {
    return getRandomPastDate(1, 7);
};
var getTodayDate = function() {
    return new Date();
};
var getFutureDate = function() {
    var daysAhead = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
    return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
};
// Add retry logic and table verification
function waitForTables() {
    var maxRetries = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 10, delay = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1000;
    return _async_to_generator(function() {
        var i, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    i = 0;
                    _state.label = 1;
                case 1:
                    if (!(i < maxRetries)) return [
                        3,
                        9
                    ];
                    _state.label = 2;
                case 2:
                    _state.trys.push([
                        2,
                        4,
                        ,
                        8
                    ]);
                    return [
                        4,
                        prisma.user.count()
                    ];
                case 3:
                    _state.sent();
                    console.log('✅ Database tables are ready');
                    return [
                        2,
                        true
                    ];
                case 4:
                    error = _state.sent();
                    if (!(error.code === 'P2021')) return [
                        3,
                        6
                    ];
                    console.log("⏳ Waiting for database tables... (attempt ".concat(i + 1, "/").concat(maxRetries, ")"));
                    return [
                        4,
                        new Promise(function(resolve) {
                            return setTimeout(resolve, delay);
                        })
                    ];
                case 5:
                    _state.sent();
                    return [
                        3,
                        7
                    ];
                case 6:
                    throw error;
                case 7:
                    return [
                        3,
                        8
                    ];
                case 8:
                    i++;
                    return [
                        3,
                        1
                    ];
                case 9:
                    throw new Error('Database tables not ready after maximum retries');
            }
        });
    })();
}
// Generate secure password hash
function generateSecurePasswordHash(password) {
    return _async_to_generator(function() {
        var saltRounds;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    saltRounds = 12;
                    return [
                        4,
                        _bcryptjs.hash(password, saltRounds)
                    ];
                case 1:
                    return [
                        2,
                        _state.sent()
                    ];
            }
        });
    })();
}
function seedComprehensiveHealthcareData() {
    return _async_to_generator(function() {
        var _createdPatients_, _createdPatients_1, _createdPatients_2, _createdPatients_3, _createdPatients_4, _createdPatients_5, _createdPatients_6, _createdPatients_7, _createdPatients_8, _createdPatients_9, _createdPatients_10, _createdPatients_11, _createdPatients_12, _createdPatients_13, _createdPatients_14, _createdPatients_15, _createdPatients_16, _createdPatients_17, _createdPatients_18, _createdPatients_19, _createdPatients_20, _createdPatients_21, _createdPatients_22, _createdPatients_23, _createdPatients_24, _createdPatients_25, _createdPatients_26, _createdPatients_27, _createdPatients_28, _createdPatients_29, _createdPatients_30, defaultPassword, hashedPassword, basicDoctorPassword, createUserData, testUsers, organization, specialties, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, spec, err, cardiologySpec, endocrinologySpec, generalMedSpec, psychiatrySpec, provider, error, medicines, _iteratorNormalCompletion1, _didIteratorError1, _iteratorError1, _iterator1, _step1, med, err, createdPatients, carePlanData, i, planData, symptomData, i1, symptom, vitalTemplates, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, template, err, medicationReminderData, i2, medData, symptomsData, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, symptom1, err, error1, error2, treatmentsData, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, treatment, err, error3, patientsForAppointments, appointmentsData, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, apt, err, adherenceData, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, record, err, error4;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    console.log('📊 Seeding comprehensive healthcare test data with updated schema...');
                    _state.label = 1;
                case 1:
                    _state.trys.push([
                        1,
                        104,
                        105,
                        107
                    ]);
                    return [
                        4,
                        waitForTables()
                    ];
                case 2:
                    _state.sent();
                    // Always start with a clean database
                    return [
                        4,
                        cleanDatabase()
                    ];
                case 3:
                    _state.sent();
                    // Password setup
                    defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'TempPassword123!';
                    return [
                        4,
                        _bcryptjs.hash(defaultPassword, 12)
                    ];
                case 4:
                    hashedPassword = _state.sent();
                    return [
                        4,
                        _bcryptjs.hash('TempPassword123!', 12)
                    ];
                case 5:
                    basicDoctorPassword = _state.sent();
                    // Helper function to create user with Auth.js v5 fields and updated schema
                    createUserData = function(userData) {
                        return _object_spread_props(_object_spread({}, userData), {
                            // Auth.js v5 required fields
                            name: "".concat(userData.firstName, " ").concat(userData.lastName).trim(),
                            emailVerified: userData.emailVerifiedLegacy ? userData.createdAt : null,
                            image: null
                        });
                    };
                    // Create specific users per your requirements
                    console.log('👥 Creating users with exact structure per requirements...');
                    return [
                        4,
                        prisma.user.createMany({
                            skipDuplicates: true,
                            data: [
                                // 3 Doctors
                                createUserData({
                                    id: '00000000-0000-0000-0000-000000000001',
                                    email: 'doctor@healthapp.com',
                                    passwordHash: basicDoctorPassword,
                                    role: 'DOCTOR',
                                    firstName: 'Dr. John',
                                    lastName: 'Smith',
                                    phone: '+1-555-0001',
                                    dateOfBirth: new Date('1975-01-15'),
                                    gender: 'MALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(30, 90),
                                    updatedAt: getRecentDate(),
                                    // Auth.js v5 required fields
                                    name: 'Dr. John Smith',
                                    emailVerified: getRandomPastDate(30, 90),
                                    image: null
                                }),
                                createUserData({
                                    id: '00000000-0000-0000-0000-000000000002',
                                    email: 'doctor1@healthapp.com',
                                    passwordHash: basicDoctorPassword,
                                    role: 'DOCTOR',
                                    firstName: 'Dr. Jane',
                                    lastName: 'Doe',
                                    phone: '+1-555-0002',
                                    dateOfBirth: new Date('1978-05-20'),
                                    gender: 'FEMALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(28, 88),
                                    updatedAt: getRecentDate(),
                                    name: 'Dr. Jane Doe',
                                    emailVerified: getRandomPastDate(28, 88),
                                    image: null
                                }),
                                createUserData({
                                    id: '00000000-0000-0000-0000-000000000003',
                                    email: 'doctor2@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'DOCTOR',
                                    firstName: 'Dr. Emily',
                                    lastName: 'Rodriguez',
                                    phone: '+1-555-0003',
                                    dateOfBirth: new Date('1980-11-08'),
                                    gender: 'FEMALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(25, 85),
                                    updatedAt: getRecentDate(),
                                    name: 'Dr. Emily Rodriguez',
                                    emailVerified: getRandomPastDate(25, 85),
                                    image: null
                                }),
                                // 5 Patients (3 for doctor1, 2 for doctor2, 0 for doctor3)
                                createUserData({
                                    id: '77777777-7777-7777-7777-777777777777',
                                    email: 'patient1@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'PATIENT',
                                    firstName: 'Sarah',
                                    lastName: 'Johnson',
                                    phone: '+1-555-0101',
                                    dateOfBirth: new Date('1985-06-15'),
                                    gender: 'FEMALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(20, 80),
                                    updatedAt: getRecentDate(),
                                    name: 'Sarah Johnson',
                                    emailVerified: getRandomPastDate(20, 80),
                                    image: null
                                }),
                                createUserData({
                                    id: '88888888-8888-8888-8888-888888888888',
                                    email: 'patient2@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'PATIENT',
                                    firstName: 'Michael',
                                    lastName: 'Chen',
                                    phone: '+1-555-0102',
                                    dateOfBirth: new Date('1978-03-22'),
                                    gender: 'MALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(18, 78),
                                    updatedAt: getRecentDate(),
                                    name: 'Michael Chen',
                                    emailVerified: getRandomPastDate(18, 78),
                                    image: null
                                }),
                                createUserData({
                                    id: '11111111-1111-1111-1111-111111111111',
                                    email: 'patient3@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'PATIENT',
                                    firstName: 'Emma',
                                    lastName: 'Williams',
                                    phone: '+1-555-0103',
                                    dateOfBirth: new Date('1990-09-10'),
                                    gender: 'FEMALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(16, 76),
                                    updatedAt: getRecentDate(),
                                    name: 'Emma Williams',
                                    emailVerified: getRandomPastDate(16, 76),
                                    image: null
                                }),
                                createUserData({
                                    id: '22222222-2222-2222-2222-222222222222',
                                    email: 'patient4@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'PATIENT',
                                    firstName: 'James',
                                    lastName: 'Brown',
                                    phone: '+1-555-0104',
                                    dateOfBirth: new Date('1965-12-05'),
                                    gender: 'MALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(14, 74),
                                    updatedAt: getRecentDate(),
                                    name: 'James Brown',
                                    emailVerified: getRandomPastDate(14, 74),
                                    image: null
                                }),
                                createUserData({
                                    id: '33333333-3333-3333-3333-333333333333',
                                    email: 'patient5@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'PATIENT',
                                    firstName: 'Olivia',
                                    lastName: 'Davis',
                                    phone: '+1-555-0105',
                                    dateOfBirth: new Date('1995-04-20'),
                                    gender: 'FEMALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(12, 72),
                                    updatedAt: getRecentDate(),
                                    name: 'Olivia Davis',
                                    emailVerified: getRandomPastDate(12, 72),
                                    image: null
                                }),
                                // 1 HSP
                                createUserData({
                                    id: '55555555-5555-5555-5555-555555555555',
                                    email: 'hsp@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'HSP',
                                    firstName: 'Maria',
                                    lastName: 'Garcia',
                                    phone: '+1-555-0301',
                                    dateOfBirth: new Date('1980-03-25'),
                                    gender: 'FEMALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(35, 85),
                                    updatedAt: getRecentDate(),
                                    name: 'Maria Garcia',
                                    emailVerified: getRandomPastDate(35, 85),
                                    image: null
                                }),
                                // 1 System Admin
                                createUserData({
                                    id: '66666666-6666-6666-6666-666666666666',
                                    email: 'admin@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'SYSTEM_ADMIN',
                                    firstName: 'Admin',
                                    lastName: 'User',
                                    phone: '+1-555-0401',
                                    dateOfBirth: new Date('1985-01-01'),
                                    gender: 'OTHER',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(40, 90),
                                    updatedAt: getRecentDate(),
                                    name: 'Admin User',
                                    emailVerified: getRandomPastDate(40, 90),
                                    image: null
                                }),
                                // 1 Provider Admin
                                createUserData({
                                    id: '10101010-1010-1010-1010-101010101010',
                                    email: 'provider@healthapp.com',
                                    passwordHash: hashedPassword,
                                    role: 'HOSPITAL_ADMIN',
                                    firstName: 'Provider',
                                    lastName: 'Administrator',
                                    phone: '+1-555-0501',
                                    dateOfBirth: new Date('1982-05-15'),
                                    gender: 'MALE',
                                    accountStatus: 'ACTIVE',
                                    emailVerifiedLegacy: true,
                                    createdAt: getRandomPastDate(45, 90),
                                    updatedAt: getRecentDate(),
                                    name: 'Provider Administrator',
                                    emailVerified: getRandomPastDate(45, 90),
                                    image: null
                                })
                            ]
                        })
                    ];
                case 6:
                    testUsers = _state.sent();
                    console.log("✅ Created ".concat(testUsers.count, " users"));
                    // Create One Organization - Organization model uses snake_case
                    console.log('🏥 Creating organization...');
                    return [
                        4,
                        prisma.organization.upsert({
                            where: {
                                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
                            },
                            update: {},
                            create: {
                                id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                                name: 'HealthApp Medical Center',
                                type: 'hospital',
                                license_number: 'HC-2025-001',
                                contact_info: {
                                    phone: '+1-555-0100',
                                    email: 'info@healthapp.com',
                                    website: 'https://healthapp.com'
                                },
                                address: {
                                    street: '123 Medical Drive',
                                    city: 'Healthcare City',
                                    state: 'CA',
                                    zipCode: '90210',
                                    country: 'USA'
                                },
                                is_active: true,
                                created_at: getRandomPastDate(60, 90),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 7:
                    organization = _state.sent();
                    console.log("✅ Created organization: ".concat(organization.name));
                    // Create Eleven Medical Specialties - Speciality model uses snake_case
                    console.log('🩺 Creating 11 medical specialties...');
                    specialties = [
                        {
                            name: 'Cardiology',
                            description: 'Heart and cardiovascular system specialist'
                        },
                        {
                            name: 'Endocrinology',
                            description: 'Hormonal disorders and diabetes specialist'
                        },
                        {
                            name: 'General Medicine',
                            description: 'General medical practice'
                        },
                        {
                            name: 'Pediatrics',
                            description: 'Children\'s health specialist'
                        },
                        {
                            name: 'Orthopedics',
                            description: 'Bone, joint, and muscle specialist'
                        },
                        {
                            name: 'Dermatology',
                            description: 'Skin conditions specialist'
                        },
                        {
                            name: 'Neurology',
                            description: 'Brain and nervous system specialist'
                        },
                        {
                            name: 'Psychiatry',
                            description: 'Mental health specialist'
                        },
                        {
                            name: 'Gynecology',
                            description: 'Women\'s reproductive health specialist'
                        },
                        {
                            name: 'Ophthalmology',
                            description: 'Eye and vision specialist'
                        },
                        {
                            name: 'Emergency Medicine',
                            description: 'Emergency and acute care specialist'
                        }
                    ];
                    _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    _state.label = 8;
                case 8:
                    _state.trys.push([
                        8,
                        13,
                        14,
                        15
                    ]);
                    _iterator = specialties[Symbol.iterator]();
                    _state.label = 9;
                case 9:
                    if (!!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) return [
                        3,
                        12
                    ];
                    spec = _step.value;
                    return [
                        4,
                        prisma.speciality.upsert({
                            where: {
                                name: spec.name
                            },
                            update: {},
                            create: {
                                name: spec.name,
                                description: spec.description,
                                created_at: getRandomPastDate(50, 90),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 10:
                    _state.sent();
                    _state.label = 11;
                case 11:
                    _iteratorNormalCompletion = true;
                    return [
                        3,
                        9
                    ];
                case 12:
                    return [
                        3,
                        15
                    ];
                case 13:
                    err = _state.sent();
                    _didIteratorError = true;
                    _iteratorError = err;
                    return [
                        3,
                        15
                    ];
                case 14:
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                    return [
                        7
                    ];
                case 15:
                    console.log("✅ Created ".concat(specialties.length, " medical specialties"));
                    return [
                        4,
                        prisma.speciality.findFirst({
                            where: {
                                name: 'Cardiology'
                            }
                        })
                    ];
                case 16:
                    cardiologySpec = _state.sent();
                    return [
                        4,
                        prisma.speciality.findFirst({
                            where: {
                                name: 'Endocrinology'
                            }
                        })
                    ];
                case 17:
                    endocrinologySpec = _state.sent();
                    return [
                        4,
                        prisma.speciality.findFirst({
                            where: {
                                name: 'General Medicine'
                            }
                        })
                    ];
                case 18:
                    generalMedSpec = _state.sent();
                    return [
                        4,
                        prisma.speciality.findFirst({
                            where: {
                                name: 'Psychiatry'
                            }
                        })
                    ];
                case 19:
                    psychiatrySpec = _state.sent();
                    // Create Three Doctor profiles with comprehensive details - Doctor model uses snake_case
                    console.log('👨‍⚕️ Creating 3 doctor profiles...');
                    return [
                        4,
                        prisma.doctor.createMany({
                            skipDuplicates: true,
                            data: [
                                {
                                    id: '00000000-0000-0000-0000-000000000011',
                                    user_id: '00000000-0000-0000-0000-000000000001',
                                    doctor_id: 'DR001',
                                    speciality_id: cardiologySpec === null || cardiologySpec === void 0 ? void 0 : cardiologySpec.id,
                                    medical_license_number: 'MD123456',
                                    years_of_experience: 15,
                                    board_certifications: [
                                        'Board Certified Internal Medicine',
                                        'Cardiology'
                                    ],
                                    consultation_fee: 200.00,
                                    is_verified: true,
                                    verification_date: getRandomPastDate(20, 60),
                                    practice_name: 'Smith Cardiology Clinic',
                                    created_at: getRandomPastDate(30, 80)
                                },
                                {
                                    id: '00000000-0000-0000-0000-000000000022',
                                    user_id: '00000000-0000-0000-0000-000000000002',
                                    doctor_id: 'DR002',
                                    speciality_id: endocrinologySpec === null || endocrinologySpec === void 0 ? void 0 : endocrinologySpec.id,
                                    medical_license_number: 'MD789012',
                                    years_of_experience: 12,
                                    board_certifications: [
                                        'Board Certified Family Medicine',
                                        'Endocrinology'
                                    ],
                                    consultation_fee: 180.00,
                                    is_verified: true,
                                    verification_date: getRandomPastDate(15, 55),
                                    practice_name: 'Doe Endocrinology Center',
                                    created_at: getRandomPastDate(28, 78)
                                },
                                {
                                    id: '00000000-0000-0000-0000-000000000033',
                                    user_id: '00000000-0000-0000-0000-000000000003',
                                    doctor_id: 'DR003',
                                    speciality_id: generalMedSpec === null || generalMedSpec === void 0 ? void 0 : generalMedSpec.id,
                                    medical_license_number: 'MD345678',
                                    years_of_experience: 8,
                                    board_certifications: [
                                        'Board Certified Family Medicine'
                                    ],
                                    consultation_fee: 160.00,
                                    is_verified: true,
                                    verification_date: getRandomPastDate(12, 50),
                                    practice_name: 'Rodriguez Family Medicine',
                                    created_at: getRandomPastDate(25, 75)
                                }
                            ]
                        })
                    ];
                case 20:
                    _state.sent();
                    console.log("✅ Created doctor profiles");
                    // Create HSP profile using correct model name - HSP model uses snake_case
                    console.log('🩺 Creating HSP profile...');
                    return [
                        4,
                        prisma.hSP.upsert({
                            where: {
                                id: '55555555-5555-5555-5555-555555555551'
                            },
                            update: {},
                            create: {
                                id: '55555555-5555-5555-5555-555555555551',
                                user_id: '55555555-5555-5555-5555-555555555555',
                                hsp_id: 'HSP001',
                                hsp_type: 'wellness_coach',
                                license_number: 'HSP12345',
                                certifications: [
                                    'Certified Wellness Coach',
                                    'Nutrition Specialist'
                                ],
                                specializations: [
                                    'wellness_coaching',
                                    'nutrition'
                                ],
                                years_of_experience: 8,
                                created_at: getRandomPastDate(35, 75)
                            }
                        })
                    ];
                case 21:
                    _state.sent();
                    console.log("✅ Created HSP profile");
                    // Create Provider - Providers model uses snake_case
                    console.log('🏢 Creating provider...');
                    _state.label = 22;
                case 22:
                    _state.trys.push([
                        22,
                        24,
                        ,
                        25
                    ]);
                    return [
                        4,
                        prisma.providers.upsert({
                            where: {
                                id: '10101010-1010-1010-1010-101010101011'
                            },
                            update: {},
                            create: {
                                id: '10101010-1010-1010-1010-101010101011',
                                user_id: '10101010-1010-1010-1010-101010101010',
                                name: 'HealthApp Provider System',
                                address: '456 Provider Ave',
                                city: 'Healthcare City',
                                state: 'CA',
                                details: {
                                    phone: '+1-555-0500',
                                    email: 'provider@healthapp.com',
                                    provider_type: 'health_system',
                                    license_number: 'PROV-2025-001'
                                },
                                created_at: getRandomPastDate(45, 85),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 23:
                    provider = _state.sent();
                    console.log("✅ Created provider");
                    return [
                        3,
                        25
                    ];
                case 24:
                    error = _state.sent();
                    console.log("⚠️ Skipping provider creation - schema mismatch: ".concat(error.message));
                    provider = null;
                    return [
                        3,
                        25
                    ];
                case 25:
                    // Create five patient profiles with specific doctor linkages - Patient model uses snake_case
                    console.log('👥 Creating patient profiles with specific doctor assignments...');
                    return [
                        4,
                        prisma.patient.createMany({
                            skipDuplicates: true,
                            data: [
                                // 3 patients for Doctor 1 (Dr. John Smith)
                                {
                                    user_id: '77777777-7777-7777-7777-777777777777',
                                    patient_id: 'PAT-2025-001',
                                    organization_id: organization.id,
                                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
                                    height_cm: 165.0,
                                    weight_kg: 68.5,
                                    blood_type: 'A+',
                                    primary_language: 'en',
                                    allergies: [
                                        {
                                            name: 'Penicillin',
                                            severity: 'severe',
                                            reaction: 'rash'
                                        },
                                        {
                                            name: 'Shellfish',
                                            severity: 'moderate',
                                            reaction: 'hives'
                                        }
                                    ],
                                    medical_history: [
                                        {
                                            condition: 'Type 2 Diabetes',
                                            diagnosed: '2022-03-15',
                                            status: 'active'
                                        },
                                        {
                                            condition: 'Hypertension',
                                            diagnosed: '2021-08-20',
                                            status: 'controlled'
                                        }
                                    ],
                                    emergency_contacts: [
                                        {
                                            name: 'John Johnson',
                                            relationship: 'spouse',
                                            phone: '+1-555-0103',
                                            primary: true
                                        }
                                    ],
                                    overall_adherence_score: 85.5,
                                    created_at: getRandomPastDate(20, 70),
                                    updated_at: getRecentDate()
                                },
                                {
                                    user_id: '88888888-8888-8888-8888-888888888888',
                                    patient_id: 'PAT-2025-002',
                                    organization_id: organization.id,
                                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
                                    height_cm: 178.0,
                                    weight_kg: 82.3,
                                    blood_type: 'O-',
                                    primary_language: 'en',
                                    allergies: [],
                                    medical_history: [
                                        {
                                            condition: 'Hypertension',
                                            diagnosed: '2020-05-10',
                                            status: 'active'
                                        },
                                        {
                                            condition: 'High Cholesterol',
                                            diagnosed: '2019-11-15',
                                            status: 'controlled'
                                        }
                                    ],
                                    emergency_contacts: [
                                        {
                                            name: 'Lisa Chen',
                                            relationship: 'wife',
                                            phone: '+1-555-0104',
                                            primary: true
                                        }
                                    ],
                                    overall_adherence_score: 92.0,
                                    created_at: getRandomPastDate(18, 68),
                                    updated_at: getRecentDate()
                                },
                                {
                                    user_id: '11111111-1111-1111-1111-111111111111',
                                    patient_id: 'PAT-2025-003',
                                    organization_id: organization.id,
                                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000011',
                                    height_cm: 162.0,
                                    weight_kg: 55.2,
                                    blood_type: 'B+',
                                    primary_language: 'en',
                                    allergies: [
                                        {
                                            name: 'Latex',
                                            severity: 'mild',
                                            reaction: 'skin irritation'
                                        }
                                    ],
                                    medical_history: [
                                        {
                                            condition: 'Coronary Artery Disease',
                                            diagnosed: '2023-01-10',
                                            status: 'managed'
                                        }
                                    ],
                                    emergency_contacts: [
                                        {
                                            name: 'David Williams',
                                            relationship: 'father',
                                            phone: '+1-555-0106',
                                            primary: true
                                        }
                                    ],
                                    overall_adherence_score: 78.5,
                                    created_at: getRandomPastDate(16, 66),
                                    updated_at: getRecentDate()
                                },
                                // 2 patients for Doctor 2 (Dr. Jane Doe)
                                {
                                    user_id: '22222222-2222-2222-2222-222222222222',
                                    patient_id: 'PAT-2025-004',
                                    organization_id: organization.id,
                                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000022',
                                    height_cm: 175.0,
                                    weight_kg: 88.7,
                                    blood_type: 'AB+',
                                    primary_language: 'en',
                                    allergies: [],
                                    medical_history: [
                                        {
                                            condition: 'Type 2 Diabetes',
                                            diagnosed: '2020-08-15',
                                            status: 'controlled'
                                        },
                                        {
                                            condition: 'Diabetic Neuropathy',
                                            diagnosed: '2022-11-20',
                                            status: 'active'
                                        }
                                    ],
                                    emergency_contacts: [
                                        {
                                            name: 'Mary Brown',
                                            relationship: 'wife',
                                            phone: '+1-555-0107',
                                            primary: true
                                        }
                                    ],
                                    overall_adherence_score: 88.2,
                                    created_at: getRandomPastDate(14, 64),
                                    updated_at: getRecentDate()
                                },
                                {
                                    user_id: '33333333-3333-3333-3333-333333333333',
                                    patient_id: 'PAT-2025-005',
                                    organization_id: organization.id,
                                    primary_care_doctor_id: '00000000-0000-0000-0000-000000000022',
                                    height_cm: 158.0,
                                    weight_kg: 52.1,
                                    blood_type: 'O+',
                                    primary_language: 'en',
                                    allergies: [
                                        {
                                            name: 'Aspirin',
                                            severity: 'severe',
                                            reaction: 'stomach upset'
                                        }
                                    ],
                                    medical_history: [
                                        {
                                            condition: 'Hypothyroidism',
                                            diagnosed: '2021-06-30',
                                            status: 'active'
                                        },
                                        {
                                            condition: 'Prediabetes',
                                            diagnosed: '2023-02-15',
                                            status: 'monitoring'
                                        }
                                    ],
                                    emergency_contacts: [
                                        {
                                            name: 'Thomas Davis',
                                            relationship: 'brother',
                                            phone: '+1-555-0108',
                                            primary: true
                                        }
                                    ],
                                    overall_adherence_score: 95.1,
                                    created_at: getRandomPastDate(12, 62),
                                    updated_at: getRecentDate()
                                }
                            ]
                        })
                    ];
                case 26:
                    _state.sent();
                    console.log("✅ Created patient profiles");
                    // Create clinic for Doctor 1 (who has 3 patients)
                    console.log('🏥 Creating clinic for Dr. Smith...');
                    return [
                        4,
                        prisma.clinic.upsert({
                            where: {
                                id: '00000000-0000-0000-0000-000000000501'
                            },
                            update: {},
                            create: {
                                id: '00000000-0000-0000-0000-000000000501',
                                doctor_id: '00000000-0000-0000-0000-000000000011',
                                name: 'Smith Cardiology Clinic',
                                address: '123 Heart Avenue, Medical District',
                                city: 'Healthcare City',
                                state: 'CA',
                                zip_code: '90210',
                                phone: '+1-555-HEART1',
                                email: 'info@smithcardiology.com',
                                website: 'https://smithcardiology.com',
                                operating_hours: {
                                    monday: '8:00 AM - 5:00 PM',
                                    tuesday: '8:00 AM - 5:00 PM',
                                    wednesday: '8:00 AM - 5:00 PM',
                                    thursday: '8:00 AM - 5:00 PM',
                                    friday: '8:00 AM - 4:00 PM',
                                    saturday: 'Closed',
                                    sunday: 'Emergency only'
                                },
                                services_offered: [
                                    'Cardiac Consultation',
                                    'Echocardiograms',
                                    'Stress Testing',
                                    'Heart Disease Management'
                                ],
                                facility_details: {
                                    parking: true,
                                    wheelchair_accessible: true,
                                    insurance_accepted: [
                                        'Medicare',
                                        'Blue Cross',
                                        'Aetna',
                                        'Cigna'
                                    ],
                                    languages: [
                                        'English',
                                        'Spanish'
                                    ]
                                },
                                is_active: true,
                                created_at: getRandomPastDate(25, 75),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 27:
                    _state.sent();
                    console.log("✅ Created clinic for Dr. Smith");
                    // Create 10 comprehensive medicines
                    console.log('💊 Creating 10 comprehensive medicines...');
                    medicines = [
                        {
                            id: '550e8400-e29b-41d4-a716-446655440001',
                            name: 'Metformin',
                            type: 'tablet',
                            description: 'First-line medication for type 2 diabetes management',
                            details: {
                                generic_name: 'Metformin Hydrochloride',
                                brand_names: [
                                    'Glucophage',
                                    'Fortamet',
                                    'Glumetza'
                                ],
                                drug_class: 'Biguanide',
                                common_dosages: [
                                    '500mg',
                                    '850mg',
                                    '1000mg'
                                ],
                                side_effects: [
                                    'Nausea',
                                    'Diarrhea',
                                    'Stomach upset'
                                ],
                                contraindications: [
                                    'Severe kidney disease',
                                    'Liver disease'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440002',
                            name: 'Lisinopril',
                            type: 'tablet',
                            description: 'ACE inhibitor for high blood pressure and heart failure',
                            details: {
                                generic_name: 'Lisinopril',
                                brand_names: [
                                    'Prinivil',
                                    'Zestril'
                                ],
                                drug_class: 'ACE Inhibitor',
                                common_dosages: [
                                    '2.5mg',
                                    '5mg',
                                    '10mg',
                                    '20mg'
                                ],
                                side_effects: [
                                    'Dry cough',
                                    'Dizziness',
                                    'Headache'
                                ],
                                contraindications: [
                                    'Pregnancy',
                                    'History of angioedema'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440003',
                            name: 'Aspirin',
                            type: 'tablet',
                            description: 'Pain relief and cardiovascular protection',
                            details: {
                                generic_name: 'Acetylsalicylic Acid',
                                brand_names: [
                                    'Bayer',
                                    'Bufferin',
                                    'Ecotrin'
                                ],
                                drug_class: 'NSAID/Antiplatelet',
                                common_dosages: [
                                    '81mg',
                                    '325mg',
                                    '500mg'
                                ],
                                side_effects: [
                                    'Stomach irritation',
                                    'Bleeding'
                                ],
                                contraindications: [
                                    'Active bleeding',
                                    'Severe asthma'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440004',
                            name: 'Amlodipine',
                            type: 'tablet',
                            description: 'Calcium channel blocker for high blood pressure',
                            details: {
                                generic_name: 'Amlodipine Besylate',
                                brand_names: [
                                    'Norvasc',
                                    'Katerzia'
                                ],
                                drug_class: 'Calcium Channel Blocker',
                                common_dosages: [
                                    '2.5mg',
                                    '5mg',
                                    '10mg'
                                ],
                                side_effects: [
                                    'Ankle swelling',
                                    'Dizziness'
                                ],
                                contraindications: [
                                    'Severe aortic stenosis'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440005',
                            name: 'Simvastatin',
                            type: 'tablet',
                            description: 'Statin medication for high cholesterol',
                            details: {
                                generic_name: 'Simvastatin',
                                brand_names: [
                                    'Zocor',
                                    'FloLipid'
                                ],
                                drug_class: 'HMG-CoA Reductase Inhibitor',
                                common_dosages: [
                                    '5mg',
                                    '10mg',
                                    '20mg',
                                    '40mg'
                                ],
                                side_effects: [
                                    'Muscle pain',
                                    'Liver enzyme elevation'
                                ],
                                contraindications: [
                                    'Active liver disease',
                                    'Pregnancy'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440006',
                            name: 'Omeprazole',
                            type: 'capsule',
                            description: 'Proton pump inhibitor for acid reflux',
                            details: {
                                generic_name: 'Omeprazole',
                                brand_names: [
                                    'Prilosec',
                                    'Zegerid'
                                ],
                                drug_class: 'Proton Pump Inhibitor',
                                common_dosages: [
                                    '10mg',
                                    '20mg',
                                    '40mg'
                                ],
                                side_effects: [
                                    'Headache',
                                    'Nausea',
                                    'Diarrhea'
                                ],
                                contraindications: [
                                    'Hypersensitivity to benzimidazoles'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440007',
                            name: 'Albuterol',
                            type: 'inhaler',
                            description: 'Bronchodilator for asthma and COPD',
                            details: {
                                generic_name: 'Albuterol Sulfate',
                                brand_names: [
                                    'ProAir',
                                    'Ventolin',
                                    'Proventil'
                                ],
                                drug_class: 'Short-Acting Beta2 Agonist',
                                common_dosages: [
                                    '90mcg/puff',
                                    '108mcg/puff'
                                ],
                                side_effects: [
                                    'Tremor',
                                    'Nervousness'
                                ],
                                contraindications: [
                                    'Hypersensitivity to albuterol'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440008',
                            name: 'Levothyroxine',
                            type: 'tablet',
                            description: 'Thyroid hormone replacement therapy',
                            details: {
                                generic_name: 'Levothyroxine Sodium',
                                brand_names: [
                                    'Synthroid',
                                    'Levoxyl',
                                    'Tirosint'
                                ],
                                drug_class: 'Thyroid Hormone',
                                common_dosages: [
                                    '25mcg',
                                    '50mcg',
                                    '75mcg',
                                    '100mcg'
                                ],
                                side_effects: [
                                    'Heart palpitations',
                                    'Weight loss'
                                ],
                                contraindications: [
                                    'Untreated adrenal insufficiency'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440009',
                            name: 'Sertraline',
                            type: 'tablet',
                            description: 'SSRI antidepressant for depression and anxiety',
                            details: {
                                generic_name: 'Sertraline Hydrochloride',
                                brand_names: [
                                    'Zoloft',
                                    'Lustral'
                                ],
                                drug_class: 'SSRI',
                                common_dosages: [
                                    '25mg',
                                    '50mg',
                                    '100mg'
                                ],
                                side_effects: [
                                    'Nausea',
                                    'Sexual dysfunction'
                                ],
                                contraindications: [
                                    'MAO inhibitor use'
                                ]
                            }
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440010',
                            name: 'Ibuprofen',
                            type: 'tablet',
                            description: 'Anti-inflammatory pain and fever reducer',
                            details: {
                                generic_name: 'Ibuprofen',
                                brand_names: [
                                    'Advil',
                                    'Motrin',
                                    'Nuprin'
                                ],
                                drug_class: 'NSAID',
                                common_dosages: [
                                    '200mg',
                                    '400mg',
                                    '600mg'
                                ],
                                side_effects: [
                                    'Stomach upset',
                                    'Kidney problems'
                                ],
                                contraindications: [
                                    'Heart disease',
                                    'Active ulcers'
                                ]
                            }
                        }
                    ];
                    _iteratorNormalCompletion1 = true, _didIteratorError1 = false, _iteratorError1 = undefined;
                    _state.label = 28;
                case 28:
                    _state.trys.push([
                        28,
                        33,
                        34,
                        35
                    ]);
                    _iterator1 = medicines[Symbol.iterator]();
                    _state.label = 29;
                case 29:
                    if (!!(_iteratorNormalCompletion1 = (_step1 = _iterator1.next()).done)) return [
                        3,
                        32
                    ];
                    med = _step1.value;
                    return [
                        4,
                        prisma.medicine.upsert({
                            where: {
                                id: med.id
                            },
                            update: {},
                            create: {
                                id: med.id,
                                name: med.name,
                                type: med.type,
                                description: med.description,
                                details: med.details,
                                public_medicine: true,
                                created_at: getRandomPastDate(30, 60),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 30:
                    _state.sent();
                    _state.label = 31;
                case 31:
                    _iteratorNormalCompletion1 = true;
                    return [
                        3,
                        29
                    ];
                case 32:
                    return [
                        3,
                        35
                    ];
                case 33:
                    err = _state.sent();
                    _didIteratorError1 = true;
                    _iteratorError1 = err;
                    return [
                        3,
                        35
                    ];
                case 34:
                    try {
                        if (!_iteratorNormalCompletion1 && _iterator1.return != null) {
                            _iterator1.return();
                        }
                    } finally{
                        if (_didIteratorError1) {
                            throw _iteratorError1;
                        }
                    }
                    return [
                        7
                    ];
                case 35:
                    console.log("✅ Created ".concat(medicines.length, " medicines"));
                    // Create comprehensive care plans for all patients with diets, workouts, and symptoms
                    console.log('🩺 Creating comprehensive care plans for all patients...');
                    return [
                        4,
                        prisma.patient.findMany({
                            select: {
                                id: true,
                                user_id: true
                            },
                            orderBy: {
                                created_at: 'asc'
                            }
                        })
                    ];
                case 36:
                    createdPatients = _state.sent();
                    carePlanData = [
                        {
                            patient_id: (_createdPatients_ = createdPatients[0]) === null || _createdPatients_ === void 0 ? void 0 : _createdPatients_.id,
                            title: 'Diabetes & Hypertension Management Plan',
                            description: 'Comprehensive care plan for managing Type 2 diabetes and hypertension with lifestyle modifications and medication adherence.',
                            objectives: [
                                'Maintain HbA1c below 7.0%',
                                'Keep blood pressure under 130/80 mmHg',
                                'Achieve weight loss of 10-15 pounds',
                                'Improve cardiovascular fitness'
                            ],
                            start_date: getRandomPastDate(30, 60),
                            end_date: getFutureDate(180),
                            diet_plan: {
                                calories_per_day: 1800,
                                carbohydrate_grams: 180,
                                protein_grams: 120,
                                fat_grams: 60,
                                meal_plan: {
                                    breakfast: 'Oatmeal with berries, Greek yogurt',
                                    lunch: 'Grilled chicken salad with olive oil dressing',
                                    dinner: 'Baked salmon, steamed vegetables, quinoa',
                                    snacks: 'Apple with almonds, carrot sticks'
                                },
                                restrictions: [
                                    'Low sodium',
                                    'Limited refined sugars',
                                    'Complex carbohydrates only'
                                ]
                            },
                            workout_plan: {
                                frequency: '5 days per week',
                                duration: '45 minutes',
                                activities: {
                                    cardio: 'Brisk walking 30 min, 4x/week',
                                    strength: 'Light weights 2x/week',
                                    flexibility: 'Yoga 15 min daily'
                                },
                                target_heart_rate: '120-140 bpm',
                                progression: 'Increase walking duration by 5 min every 2 weeks'
                            }
                        },
                        {
                            patient_id: (_createdPatients_1 = createdPatients[1]) === null || _createdPatients_1 === void 0 ? void 0 : _createdPatients_1.id,
                            title: 'Hypertension & Cholesterol Control Plan',
                            description: 'Cardiovascular health management focusing on blood pressure control and cholesterol reduction.',
                            objectives: [
                                'Reduce blood pressure to <130/80 mmHg',
                                'Lower LDL cholesterol below 100 mg/dL',
                                'Maintain healthy weight',
                                'Increase physical activity'
                            ],
                            start_date: getRandomPastDate(25, 55),
                            end_date: getFutureDate(120),
                            diet_plan: {
                                calories_per_day: 2000,
                                sodium_mg: 1500,
                                fiber_grams: 35,
                                meal_plan: {
                                    breakfast: 'Whole grain cereal with low-fat milk',
                                    lunch: 'Turkey and avocado wrap with vegetables',
                                    dinner: 'Lean beef, sweet potato, green beans',
                                    snacks: 'Mixed nuts, fresh fruit'
                                },
                                restrictions: [
                                    'Low sodium',
                                    'Low saturated fat',
                                    'Heart-healthy fats'
                                ]
                            },
                            workout_plan: {
                                frequency: '4 days per week',
                                duration: '40 minutes',
                                activities: {
                                    cardio: 'Cycling or swimming 30 min, 3x/week',
                                    strength: 'Resistance bands 2x/week',
                                    flexibility: 'Stretching routine daily'
                                },
                                target_heart_rate: '125-145 bpm'
                            }
                        },
                        {
                            patient_id: (_createdPatients_2 = createdPatients[2]) === null || _createdPatients_2 === void 0 ? void 0 : _createdPatients_2.id,
                            title: 'Coronary Heart Disease Management',
                            description: 'Cardiac rehabilitation and lifestyle modification program for coronary artery disease.',
                            objectives: [
                                'Improve cardiac function and endurance',
                                'Prevent further coronary events',
                                'Manage stress and anxiety',
                                'Optimize medication adherence'
                            ],
                            start_date: getRandomPastDate(20, 50),
                            end_date: getFutureDate(365),
                            diet_plan: {
                                calories_per_day: 1600,
                                sodium_mg: 1200,
                                cholesterol_mg: 200,
                                meal_plan: {
                                    breakfast: 'Oatmeal with walnuts and berries',
                                    lunch: 'Grilled fish with quinoa salad',
                                    dinner: 'Vegetable stir-fry with tofu',
                                    snacks: 'Greek yogurt, handful of almonds'
                                },
                                restrictions: [
                                    'Very low sodium',
                                    'Low cholesterol',
                                    'Omega-3 rich foods'
                                ]
                            },
                            workout_plan: {
                                frequency: '6 days per week',
                                duration: '30 minutes',
                                activities: {
                                    cardio: 'Supervised walking program 3x/week',
                                    strength: 'Light resistance training 2x/week',
                                    flexibility: 'Gentle yoga daily',
                                    stress_management: 'Meditation 10 min daily'
                                },
                                target_heart_rate: '100-120 bpm'
                            }
                        },
                        {
                            patient_id: (_createdPatients_3 = createdPatients[3]) === null || _createdPatients_3 === void 0 ? void 0 : _createdPatients_3.id,
                            title: 'Diabetes & Neuropathy Care Plan',
                            description: 'Comprehensive diabetes management with focus on neuropathy prevention and pain management.',
                            objectives: [
                                'Maintain stable blood glucose levels',
                                'Prevent neuropathy progression',
                                'Manage neuropathic pain',
                                'Improve quality of life'
                            ],
                            start_date: getRandomPastDate(18, 48),
                            end_date: getFutureDate(180),
                            diet_plan: {
                                calories_per_day: 2200,
                                carbohydrate_grams: 200,
                                protein_grams: 140,
                                meal_plan: {
                                    breakfast: 'Scrambled eggs with whole wheat toast',
                                    lunch: 'Chicken and vegetable soup with crackers',
                                    dinner: 'Grilled pork tenderloin with roasted vegetables',
                                    snacks: 'Cheese and whole grain crackers'
                                },
                                restrictions: [
                                    'Consistent carbohydrate timing',
                                    'Limited simple sugars'
                                ]
                            },
                            workout_plan: {
                                frequency: '3 days per week',
                                duration: '30 minutes',
                                activities: {
                                    cardio: 'Low-impact water aerobics 2x/week',
                                    strength: 'Chair exercises 2x/week',
                                    flexibility: 'Foot and ankle exercises daily'
                                },
                                special_considerations: [
                                    'Foot care routine',
                                    'Check feet daily for injuries'
                                ]
                            }
                        },
                        {
                            patient_id: (_createdPatients_4 = createdPatients[4]) === null || _createdPatients_4 === void 0 ? void 0 : _createdPatients_4.id,
                            title: 'Thyroid & Pre-diabetes Management',
                            description: 'Hormone optimization and diabetes prevention through lifestyle intervention.',
                            objectives: [
                                'Normalize thyroid hormone levels',
                                'Prevent progression to Type 2 diabetes',
                                'Maintain healthy weight',
                                'Optimize energy levels'
                            ],
                            start_date: getRandomPastDate(15, 45),
                            end_date: getFutureDate(270),
                            diet_plan: {
                                calories_per_day: 1500,
                                iodine_mcg: 150,
                                fiber_grams: 30,
                                meal_plan: {
                                    breakfast: 'Greek yogurt with granola and fruit',
                                    lunch: 'Lentil soup with whole grain roll',
                                    dinner: 'Baked chicken breast with brown rice',
                                    snacks: 'Apple with peanut butter'
                                },
                                restrictions: [
                                    'Thyroid-supporting foods',
                                    'Low glycemic index'
                                ]
                            },
                            workout_plan: {
                                frequency: '5 days per week',
                                duration: '35 minutes',
                                activities: {
                                    cardio: 'Dance fitness 3x/week',
                                    strength: 'Bodyweight exercises 2x/week',
                                    flexibility: 'Pilates 2x/week'
                                },
                                target_heart_rate: '130-150 bpm'
                            }
                        }
                    ];
                    i = 0;
                    _state.label = 37;
                case 37:
                    if (!(i < carePlanData.length && i < createdPatients.length)) return [
                        3,
                        40
                    ];
                    planData = carePlanData[i];
                    if (!planData.patient_id) return [
                        3,
                        39
                    ];
                    return [
                        4,
                        prisma.carePlan.upsert({
                            where: {
                                id: "careplan-".concat(i + 1, "-").concat(planData.patient_id)
                            },
                            update: {},
                            create: {
                                id: "careplan-".concat(i + 1, "-").concat(planData.patient_id),
                                patient_id: planData.patient_id,
                                title: planData.title,
                                description: planData.description,
                                objectives: planData.objectives,
                                start_date: planData.start_date,
                                end_date: planData.end_date,
                                diet_plan: planData.diet_plan,
                                workout_plan: planData.workout_plan,
                                is_active: true,
                                created_at: getRandomPastDate(20, 50),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 38:
                    _state.sent();
                    _state.label = 39;
                case 39:
                    i++;
                    return [
                        3,
                        37
                    ];
                case 40:
                    // Create symptoms for each patient
                    console.log('🩺 Creating patient symptoms...');
                    symptomData = [
                        {
                            patient_id: (_createdPatients_5 = createdPatients[0]) === null || _createdPatients_5 === void 0 ? void 0 : _createdPatients_5.id,
                            name: 'Excessive thirst',
                            severity: 'moderate',
                            frequency: 'daily',
                            duration: '2-3 hours'
                        },
                        {
                            patient_id: (_createdPatients_6 = createdPatients[0]) === null || _createdPatients_6 === void 0 ? void 0 : _createdPatients_6.id,
                            name: 'Frequent urination',
                            severity: 'mild',
                            frequency: 'multiple times daily',
                            duration: 'ongoing'
                        },
                        {
                            patient_id: (_createdPatients_7 = createdPatients[0]) === null || _createdPatients_7 === void 0 ? void 0 : _createdPatients_7.id,
                            name: 'Fatigue after meals',
                            severity: 'moderate',
                            frequency: 'after meals',
                            duration: '1-2 hours'
                        },
                        {
                            patient_id: (_createdPatients_8 = createdPatients[1]) === null || _createdPatients_8 === void 0 ? void 0 : _createdPatients_8.id,
                            name: 'Morning headaches',
                            severity: 'mild',
                            frequency: '3-4 times per week',
                            duration: '30-60 minutes'
                        },
                        {
                            patient_id: (_createdPatients_9 = createdPatients[1]) === null || _createdPatients_9 === void 0 ? void 0 : _createdPatients_9.id,
                            name: 'Dizziness when standing',
                            severity: 'mild',
                            frequency: 'occasionally',
                            duration: 'few seconds'
                        },
                        {
                            patient_id: (_createdPatients_10 = createdPatients[2]) === null || _createdPatients_10 === void 0 ? void 0 : _createdPatients_10.id,
                            name: 'Chest tightness with activity',
                            severity: 'moderate',
                            frequency: 'during exercise',
                            duration: '5-10 minutes'
                        },
                        {
                            patient_id: (_createdPatients_11 = createdPatients[2]) === null || _createdPatients_11 === void 0 ? void 0 : _createdPatients_11.id,
                            name: 'Shortness of breath',
                            severity: 'mild',
                            frequency: 'with exertion',
                            duration: 'until rest'
                        },
                        {
                            patient_id: (_createdPatients_12 = createdPatients[3]) === null || _createdPatients_12 === void 0 ? void 0 : _createdPatients_12.id,
                            name: 'Tingling in feet',
                            severity: 'moderate',
                            frequency: 'daily',
                            duration: 'intermittent throughout day'
                        },
                        {
                            patient_id: (_createdPatients_13 = createdPatients[3]) === null || _createdPatients_13 === void 0 ? void 0 : _createdPatients_13.id,
                            name: 'Burning sensation in hands',
                            severity: 'mild',
                            frequency: 'evenings',
                            duration: '2-3 hours'
                        },
                        {
                            patient_id: (_createdPatients_14 = createdPatients[4]) === null || _createdPatients_14 === void 0 ? void 0 : _createdPatients_14.id,
                            name: 'Feeling cold',
                            severity: 'mild',
                            frequency: 'daily',
                            duration: 'most of the day'
                        },
                        {
                            patient_id: (_createdPatients_15 = createdPatients[4]) === null || _createdPatients_15 === void 0 ? void 0 : _createdPatients_15.id,
                            name: 'Dry skin and hair',
                            severity: 'mild',
                            frequency: 'constant',
                            duration: 'ongoing'
                        }
                    ];
                    i1 = 0;
                    _state.label = 41;
                case 41:
                    if (!(i1 < symptomData.length)) return [
                        3,
                        44
                    ];
                    symptom = symptomData[i1];
                    if (!symptom.patient_id) return [
                        3,
                        43
                    ];
                    return [
                        4,
                        prisma.symptom.upsert({
                            where: {
                                id: "symptom-".concat(i1 + 1, "-").concat(symptom.patient_id)
                            },
                            update: {},
                            create: {
                                id: "symptom-".concat(i1 + 1, "-").concat(symptom.patient_id),
                                patient_id: symptom.patient_id,
                                name: symptom.name,
                                severity: symptom.severity,
                                frequency: symptom.frequency,
                                duration: symptom.duration,
                                first_noticed: getRandomPastDate(10, 30),
                                created_at: getRandomPastDate(5, 25),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 42:
                    _state.sent();
                    _state.label = 43;
                case 43:
                    i1++;
                    return [
                        3,
                        41
                    ];
                case 44:
                    console.log("✅ Created comprehensive care plans and symptoms for all patients");
                    // Create 4 vital templates
                    console.log('📊 Creating 4 vital templates...');
                    vitalTemplates = [
                        {
                            id: '550e8400-e29b-41d4-a716-446655440020',
                            name: 'Blood Pressure',
                            unit: 'mmHg'
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440021',
                            name: 'Heart Rate',
                            unit: 'bpm'
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440022',
                            name: 'Weight',
                            unit: 'kg'
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440023',
                            name: 'Blood Glucose',
                            unit: 'mg/dL'
                        }
                    ];
                    _iteratorNormalCompletion2 = true, _didIteratorError2 = false, _iteratorError2 = undefined;
                    _state.label = 45;
                case 45:
                    _state.trys.push([
                        45,
                        50,
                        51,
                        52
                    ]);
                    _iterator2 = vitalTemplates[Symbol.iterator]();
                    _state.label = 46;
                case 46:
                    if (!!(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done)) return [
                        3,
                        49
                    ];
                    template = _step2.value;
                    return [
                        4,
                        prisma.vitalTemplates.upsert({
                            where: {
                                id: template.id
                            },
                            update: {},
                            create: {
                                id: template.id,
                                name: template.name,
                                unit: template.unit,
                                created_at: getRandomPastDate(40, 70),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 47:
                    _state.sent();
                    _state.label = 48;
                case 48:
                    _iteratorNormalCompletion2 = true;
                    return [
                        3,
                        46
                    ];
                case 49:
                    return [
                        3,
                        52
                    ];
                case 50:
                    err = _state.sent();
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                    return [
                        3,
                        52
                    ];
                case 51:
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                            _iterator2.return();
                        }
                    } finally{
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                    return [
                        7
                    ];
                case 52:
                    console.log("✅ Created ".concat(vitalTemplates.length, " vital templates"));
                    // Create 3 medication reminders for each patient (15 total)
                    console.log('💊 Creating 3 medication reminders per patient...');
                    medicationReminderData = [
                        // Patient 1 - Sarah Johnson (Type 2 Diabetes & Hypertension)
                        {
                            patient_id: (_createdPatients_16 = createdPatients[0]) === null || _createdPatients_16 === void 0 ? void 0 : _createdPatients_16.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440001',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '500mg',
                            frequency: 'Twice daily with meals',
                            duration_days: 90,
                            instructions: 'Take with breakfast and dinner to reduce stomach upset. Monitor blood sugar levels.',
                            start_date: getRandomPastDate(20, 40),
                            end_date: getFutureDate(70)
                        },
                        {
                            patient_id: (_createdPatients_17 = createdPatients[0]) === null || _createdPatients_17 === void 0 ? void 0 : _createdPatients_17.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440002',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '10mg',
                            frequency: 'Once daily in the morning',
                            duration_days: 90,
                            instructions: 'Take at same time each morning. Monitor blood pressure regularly.',
                            start_date: getRandomPastDate(18, 38),
                            end_date: getFutureDate(72)
                        },
                        {
                            patient_id: (_createdPatients_18 = createdPatients[0]) === null || _createdPatients_18 === void 0 ? void 0 : _createdPatients_18.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440003',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '81mg',
                            frequency: 'Once daily with food',
                            duration_days: 90,
                            instructions: 'Low-dose aspirin for cardiovascular protection. Take with food to prevent stomach irritation.',
                            start_date: getRandomPastDate(16, 36),
                            end_date: getFutureDate(74)
                        },
                        // Patient 2 - Michael Chen (Hypertension & High Cholesterol)
                        {
                            patient_id: (_createdPatients_19 = createdPatients[1]) === null || _createdPatients_19 === void 0 ? void 0 : _createdPatients_19.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440004',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '5mg',
                            frequency: 'Once daily',
                            duration_days: 90,
                            instructions: 'Take at the same time each day. May cause ankle swelling - report if persistent.',
                            start_date: getRandomPastDate(22, 42),
                            end_date: getFutureDate(68)
                        },
                        {
                            patient_id: (_createdPatients_20 = createdPatients[1]) === null || _createdPatients_20 === void 0 ? void 0 : _createdPatients_20.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440005',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '20mg',
                            frequency: 'Once daily in the evening',
                            duration_days: 90,
                            instructions: 'Take in the evening with or without food. Report any unexplained muscle pain.',
                            start_date: getRandomPastDate(24, 44),
                            end_date: getFutureDate(66)
                        },
                        {
                            patient_id: (_createdPatients_21 = createdPatients[1]) === null || _createdPatients_21 === void 0 ? void 0 : _createdPatients_21.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440003',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '81mg',
                            frequency: 'Once daily with breakfast',
                            duration_days: 90,
                            instructions: 'Cardioprotective dose. Take with food to minimize stomach irritation.',
                            start_date: getRandomPastDate(20, 40),
                            end_date: getFutureDate(70)
                        },
                        // Patient 3 - Emma Williams (Coronary Artery Disease)
                        {
                            patient_id: (_createdPatients_22 = createdPatients[2]) === null || _createdPatients_22 === void 0 ? void 0 : _createdPatients_22.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440002',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '5mg',
                            frequency: 'Once daily',
                            duration_days: 90,
                            instructions: 'For heart protection and blood pressure control. Take consistently at same time.',
                            start_date: getRandomPastDate(26, 46),
                            end_date: getFutureDate(64)
                        },
                        {
                            patient_id: (_createdPatients_23 = createdPatients[2]) === null || _createdPatients_23 === void 0 ? void 0 : _createdPatients_23.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440005',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '40mg',
                            frequency: 'Once daily in the evening',
                            duration_days: 90,
                            instructions: 'High-intensity statin for coronary disease. Monitor for muscle symptoms.',
                            start_date: getRandomPastDate(24, 44),
                            end_date: getFutureDate(66)
                        },
                        {
                            patient_id: (_createdPatients_24 = createdPatients[2]) === null || _createdPatients_24 === void 0 ? void 0 : _createdPatients_24.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440003',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000011',
                            dosage: '81mg',
                            frequency: 'Once daily with dinner',
                            duration_days: 90,
                            instructions: 'Essential for coronary disease management. Take with food consistently.',
                            start_date: getRandomPastDate(22, 42),
                            end_date: getFutureDate(68)
                        },
                        // Patient 4 - James Brown (Diabetes & Neuropathy)
                        {
                            patient_id: (_createdPatients_25 = createdPatients[3]) === null || _createdPatients_25 === void 0 ? void 0 : _createdPatients_25.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440001',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000022',
                            dosage: '1000mg',
                            frequency: 'Twice daily with meals',
                            duration_days: 90,
                            instructions: 'Extended-release formula. Take with breakfast and dinner.',
                            start_date: getRandomPastDate(28, 48),
                            end_date: getFutureDate(62)
                        },
                        {
                            patient_id: (_createdPatients_26 = createdPatients[3]) === null || _createdPatients_26 === void 0 ? void 0 : _createdPatients_26.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440008',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000022',
                            dosage: '300mg',
                            frequency: 'Three times daily',
                            duration_days: 90,
                            instructions: 'For diabetic neuropathy pain. Start with bedtime dose, gradually increase as tolerated.',
                            start_date: getRandomPastDate(26, 46),
                            end_date: getFutureDate(64)
                        },
                        {
                            patient_id: (_createdPatients_27 = createdPatients[3]) === null || _createdPatients_27 === void 0 ? void 0 : _createdPatients_27.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440010',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000022',
                            dosage: '400mg',
                            frequency: 'As needed, up to 3 times daily',
                            duration_days: 30,
                            instructions: 'For pain relief. Take with food. Do not exceed 1200mg per day.',
                            start_date: getRandomPastDate(15, 30),
                            end_date: getFutureDate(15)
                        },
                        // Patient 5 - Olivia Davis (Hypothyroidism & Prediabetes)
                        {
                            patient_id: (_createdPatients_28 = createdPatients[4]) === null || _createdPatients_28 === void 0 ? void 0 : _createdPatients_28.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440008',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000022',
                            dosage: '75mcg',
                            frequency: 'Once daily in the morning',
                            duration_days: 90,
                            instructions: 'Take on empty stomach, 30-60 minutes before breakfast. Avoid calcium/iron supplements.',
                            start_date: getRandomPastDate(30, 50),
                            end_date: getFutureDate(60)
                        },
                        {
                            patient_id: (_createdPatients_29 = createdPatients[4]) === null || _createdPatients_29 === void 0 ? void 0 : _createdPatients_29.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440001',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000022',
                            dosage: '500mg',
                            frequency: 'Once daily with dinner',
                            duration_days: 90,
                            instructions: 'For prediabetes management. Start low dose to minimize GI side effects.',
                            start_date: getRandomPastDate(20, 35),
                            end_date: getFutureDate(75)
                        },
                        {
                            patient_id: (_createdPatients_30 = createdPatients[4]) === null || _createdPatients_30 === void 0 ? void 0 : _createdPatients_30.id,
                            medicine_id: '550e8400-e29b-41d4-a716-446655440006',
                            organizer_type: 'DOCTOR',
                            organizer_id: '00000000-0000-0000-0000-000000000022',
                            dosage: '20mg',
                            frequency: 'Once daily before breakfast',
                            duration_days: 60,
                            instructions: 'For acid reflux related to thyroid medication. Take 30 minutes before eating.',
                            start_date: getRandomPastDate(25, 40),
                            end_date: getFutureDate(35)
                        }
                    ];
                    i2 = 0;
                    _state.label = 53;
                case 53:
                    if (!(i2 < medicationReminderData.length)) return [
                        3,
                        56
                    ];
                    medData = medicationReminderData[i2];
                    if (!medData.patient_id) return [
                        3,
                        55
                    ];
                    return [
                        4,
                        prisma.medication.upsert({
                            where: {
                                id: "medication-".concat(i2 + 1, "-").concat(medData.patient_id)
                            },
                            update: {},
                            create: {
                                id: "medication-".concat(i2 + 1, "-").concat(medData.patient_id),
                                patient_id: medData.patient_id,
                                medicine_id: medData.medicine_id,
                                organizer_type: medData.organizer_type,
                                organizer_id: medData.organizer_id,
                                dosage: medData.dosage,
                                frequency: medData.frequency,
                                duration_days: medData.duration_days,
                                instructions: medData.instructions,
                                start_date: medData.start_date,
                                end_date: medData.end_date,
                                is_active: true,
                                created_at: getRandomPastDate(15, 35),
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 54:
                    _state.sent();
                    _state.label = 55;
                case 55:
                    i2++;
                    return [
                        3,
                        53
                    ];
                case 56:
                    console.log("✅ Created 3 medication reminders for each patient (15 total)");
                    // Create 5 symptoms/conditions
                    console.log('🩺 Creating 5 symptoms/conditions...');
                    _state.label = 57;
                case 57:
                    _state.trys.push([
                        57,
                        66,
                        ,
                        67
                    ]);
                    symptomsData = [
                        {
                            id: '550e8400-e29b-41d4-a716-446655440030',
                            diagnosis_name: 'Type 2 Diabetes',
                            symptoms: [
                                'Excessive thirst',
                                'Frequent urination',
                                'Unexplained weight loss',
                                'Increased hunger',
                                'Fatigue'
                            ],
                            category: 'Endocrine',
                            severity_indicators: {
                                mild: [
                                    'Mild thirst',
                                    'Occasional fatigue'
                                ],
                                moderate: [
                                    'Increased hunger',
                                    'Blurred vision'
                                ],
                                severe: [
                                    'Unexplained weight loss',
                                    'Frequent urination'
                                ]
                            },
                            common_age_groups: [
                                'adults',
                                'elderly'
                            ],
                            gender_specific: 'both',
                            is_active: true
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440031',
                            diagnosis_name: 'Hypertension',
                            symptoms: [
                                'Headaches',
                                'Dizziness',
                                'Chest pain',
                                'Nosebleeds',
                                'Shortness of breath'
                            ],
                            category: 'Cardiovascular',
                            severity_indicators: {
                                mild: [
                                    'Occasional headaches'
                                ],
                                moderate: [
                                    'Regular headaches',
                                    'Chest discomfort'
                                ],
                                severe: [
                                    'Severe headaches',
                                    'Chest pain',
                                    'Shortness of breath'
                                ]
                            },
                            common_age_groups: [
                                'adults',
                                'elderly'
                            ],
                            gender_specific: 'both',
                            is_active: true
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440032',
                            diagnosis_name: 'Asthma',
                            symptoms: [
                                'Wheezing',
                                'Coughing',
                                'Chest tightness',
                                'Shortness of breath'
                            ],
                            category: 'Respiratory',
                            severity_indicators: {
                                mild: [
                                    'Occasional wheezing'
                                ],
                                moderate: [
                                    'Regular shortness of breath'
                                ],
                                severe: [
                                    'Difficulty speaking',
                                    'Severe breathing problems'
                                ]
                            },
                            common_age_groups: [
                                'children',
                                'adults'
                            ],
                            gender_specific: 'both',
                            is_active: true
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440033',
                            diagnosis_name: 'Depression',
                            symptoms: [
                                'Persistent sadness',
                                'Loss of interest',
                                'Fatigue',
                                'Sleep disturbances',
                                'Appetite changes'
                            ],
                            category: 'Mental Health',
                            severity_indicators: {
                                mild: [
                                    'Occasional sadness'
                                ],
                                moderate: [
                                    'Regular mood changes'
                                ],
                                severe: [
                                    'Persistent hopelessness',
                                    'Thoughts of self-harm'
                                ]
                            },
                            common_age_groups: [
                                'adolescents',
                                'adults',
                                'elderly'
                            ],
                            gender_specific: 'both',
                            is_active: true
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440034',
                            diagnosis_name: 'Anxiety Disorder',
                            symptoms: [
                                'Excessive worry',
                                'Restlessness',
                                'Fatigue',
                                'Difficulty concentrating',
                                'Irritability',
                                'Muscle tension'
                            ],
                            category: 'Mental Health',
                            severity_indicators: {
                                mild: [
                                    'Occasional worry'
                                ],
                                moderate: [
                                    'Regular anxiety'
                                ],
                                severe: [
                                    'Panic attacks',
                                    'Unable to perform daily activities'
                                ]
                            },
                            common_age_groups: [
                                'adolescents',
                                'adults'
                            ],
                            gender_specific: 'both',
                            is_active: true
                        }
                    ];
                    _iteratorNormalCompletion3 = true, _didIteratorError3 = false, _iteratorError3 = undefined;
                    _state.label = 58;
                case 58:
                    _state.trys.push([
                        58,
                        63,
                        64,
                        65
                    ]);
                    _iterator3 = symptomsData[Symbol.iterator]();
                    _state.label = 59;
                case 59:
                    if (!!(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done)) return [
                        3,
                        62
                    ];
                    symptom1 = _step3.value;
                    return [
                        4,
                        prisma.symptomsDatabase.upsert({
                            where: {
                                id: symptom1.id
                            },
                            update: {},
                            create: _object_spread_props(_object_spread({}, symptom1), {
                                created_at: getRandomPastDate(35, 65),
                                updated_at: getRecentDate()
                            })
                        })
                    ];
                case 60:
                    _state.sent();
                    _state.label = 61;
                case 61:
                    _iteratorNormalCompletion3 = true;
                    return [
                        3,
                        59
                    ];
                case 62:
                    return [
                        3,
                        65
                    ];
                case 63:
                    err = _state.sent();
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                    return [
                        3,
                        65
                    ];
                case 64:
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
                            _iterator3.return();
                        }
                    } finally{
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                    return [
                        7
                    ];
                case 65:
                    console.log("✅ Created ".concat(symptomsData.length, " symptoms/conditions"));
                    return [
                        3,
                        67
                    ];
                case 66:
                    error1 = _state.sent();
                    console.log("⚠️ Skipping symptoms database creation - table issue: ".concat(error1.message));
                    return [
                        3,
                        67
                    ];
                case 67:
                    // Link Provider Admin to 2 doctors (1 with patients, 1 without patients)
                    console.log('🔗 Creating provider relationships...');
                    _state.label = 68;
                case 68:
                    _state.trys.push([
                        68,
                        72,
                        ,
                        73
                    ]);
                    if (!provider) return [
                        3,
                        71
                    ];
                    // Link Doctor 1 (has 3 patients) to Provider
                    return [
                        4,
                        prisma.doctor.update({
                            where: {
                                id: '00000000-0000-0000-0000-000000000011'
                            },
                            data: {
                                provider_id: provider.id,
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 69:
                    _state.sent();
                    // Link Doctor 3 (has 0 patients) to Provider
                    return [
                        4,
                        prisma.doctor.update({
                            where: {
                                id: '00000000-0000-0000-0000-000000000033'
                            },
                            data: {
                                provider_id: provider.id,
                                updated_at: getRecentDate()
                            }
                        })
                    ];
                case 70:
                    _state.sent();
                    console.log("✅ Linked Provider Admin to 2 doctors (1 with patients, 1 without)");
                    _state.label = 71;
                case 71:
                    return [
                        3,
                        73
                    ];
                case 72:
                    error2 = _state.sent();
                    console.log("⚠️ Could not create provider relationships: ".concat(error2.message));
                    return [
                        3,
                        73
                    ];
                case 73:
                    // Create 5 treatments
                    console.log('💉 Creating 5 treatments...');
                    _state.label = 74;
                case 74:
                    _state.trys.push([
                        74,
                        83,
                        ,
                        84
                    ]);
                    treatmentsData = [
                        {
                            id: '550e8400-e29b-41d4-a716-446655440040',
                            treatment_name: 'Metformin Therapy',
                            treatment_type: 'medication',
                            description: 'First-line medication for Type 2 diabetes management',
                            applicable_conditions: [
                                'Type 2 Diabetes',
                                'Pre-diabetes'
                            ],
                            duration: 'Long-term',
                            frequency: 'Twice daily with meals',
                            dosage_info: {
                                initial_dose: '500mg twice daily',
                                maximum_dose: '2000mg daily',
                                titration: 'Increase by 500mg weekly as tolerated'
                            },
                            category: 'Antidiabetic',
                            severity_level: 'moderate',
                            is_active: true
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440041',
                            treatment_name: 'ACE Inhibitor Therapy',
                            treatment_type: 'medication',
                            description: 'First-line treatment for hypertension',
                            applicable_conditions: [
                                'Hypertension',
                                'Heart Failure'
                            ],
                            duration: 'Long-term',
                            frequency: 'Once daily',
                            dosage_info: {
                                initial_dose: '5mg daily',
                                maximum_dose: '40mg daily',
                                titration: 'Increase every 1-2 weeks'
                            },
                            category: 'Cardiovascular',
                            severity_level: 'moderate',
                            is_active: true
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440042',
                            treatment_name: 'Inhaled Bronchodilator Therapy',
                            treatment_type: 'medication',
                            description: 'Short-acting beta2 agonist for asthma',
                            applicable_conditions: [
                                'Asthma',
                                'COPD'
                            ],
                            duration: 'As needed',
                            frequency: '2 puffs every 4-6 hours as needed',
                            dosage_info: {
                                initial_dose: '90mcg (2 puffs) as needed',
                                maximum_dose: '12 puffs per day'
                            },
                            category: 'Respiratory',
                            severity_level: 'mild_to_moderate',
                            is_active: true
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440043',
                            treatment_name: 'Cognitive Behavioral Therapy',
                            treatment_type: 'therapy',
                            description: 'Evidence-based psychotherapy for depression and anxiety',
                            applicable_conditions: [
                                'Depression',
                                'Anxiety Disorder',
                                'PTSD'
                            ],
                            duration: '12-20 sessions over 3-6 months',
                            frequency: 'Weekly sessions initially',
                            dosage_info: {
                                initial_dose: '45-50 minute sessions weekly',
                                titration: 'Adjust frequency based on progress'
                            },
                            category: 'Mental Health',
                            severity_level: 'mild_to_severe',
                            is_active: true
                        },
                        {
                            id: '550e8400-e29b-41d4-a716-446655440044',
                            treatment_name: 'Lifestyle Modification Program',
                            treatment_type: 'lifestyle',
                            description: 'Comprehensive diet and exercise program',
                            applicable_conditions: [
                                'Type 2 Diabetes',
                                'Hypertension',
                                'Obesity'
                            ],
                            duration: 'Ongoing lifestyle changes',
                            frequency: 'Daily adherence',
                            dosage_info: {
                                initial_dose: '30 minutes moderate exercise, 5 days/week',
                                maximum_dose: '60+ minutes daily as tolerated'
                            },
                            category: 'Lifestyle',
                            severity_level: 'all_levels',
                            is_active: true
                        }
                    ];
                    _iteratorNormalCompletion4 = true, _didIteratorError4 = false, _iteratorError4 = undefined;
                    _state.label = 75;
                case 75:
                    _state.trys.push([
                        75,
                        80,
                        81,
                        82
                    ]);
                    _iterator4 = treatmentsData[Symbol.iterator]();
                    _state.label = 76;
                case 76:
                    if (!!(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done)) return [
                        3,
                        79
                    ];
                    treatment = _step4.value;
                    return [
                        4,
                        prisma.treatmentDatabase.upsert({
                            where: {
                                id: treatment.id
                            },
                            update: {},
                            create: _object_spread_props(_object_spread({}, treatment), {
                                created_at: getRandomPastDate(30, 60),
                                updated_at: getRecentDate()
                            })
                        })
                    ];
                case 77:
                    _state.sent();
                    _state.label = 78;
                case 78:
                    _iteratorNormalCompletion4 = true;
                    return [
                        3,
                        76
                    ];
                case 79:
                    return [
                        3,
                        82
                    ];
                case 80:
                    err = _state.sent();
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                    return [
                        3,
                        82
                    ];
                case 81:
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
                            _iterator4.return();
                        }
                    } finally{
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                    return [
                        7
                    ];
                case 82:
                    console.log("✅ Created ".concat(treatmentsData.length, " treatments"));
                    return [
                        3,
                        84
                    ];
                case 83:
                    error3 = _state.sent();
                    console.log("⚠️ Skipping treatments database creation - table issue: ".concat(error3.message));
                    return [
                        3,
                        84
                    ];
                case 84:
                    // Create 3 appointments (today + future)
                    console.log('📅 Creating 3 appointments...');
                    return [
                        4,
                        prisma.patient.findMany({
                            select: {
                                id: true
                            },
                            take: 3,
                            orderBy: {
                                created_at: 'asc'
                            }
                        })
                    ];
                case 85:
                    patientsForAppointments = _state.sent();
                    if (!(patientsForAppointments.length >= 3)) return [
                        3,
                        94
                    ];
                    appointmentsData = [
                        {
                            id: '00000000-0000-0000-0000-000000000301',
                            doctor_id: '00000000-0000-0000-0000-000000000011',
                            patient_id: patientsForAppointments[0].id,
                            start_date: getTodayDate(),
                            start_time: new Date(new Date().setHours(9, 0, 0, 0)),
                            end_time: new Date(new Date().setHours(9, 30, 0, 0)),
                            description: 'Routine checkup and medication review',
                            createdAt: getRecentDate()
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000302',
                            doctor_id: '00000000-0000-0000-0000-000000000011',
                            patient_id: patientsForAppointments[1].id,
                            start_date: getTodayDate(),
                            start_time: new Date(new Date().setHours(14, 0, 0, 0)),
                            end_time: new Date(new Date().setHours(14, 30, 0, 0)),
                            description: 'Follow-up for hypertension management',
                            createdAt: getRecentDate()
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000303',
                            doctor_id: '00000000-0000-0000-0000-000000000022',
                            patient_id: patientsForAppointments[2].id,
                            start_date: getFutureDate(1),
                            start_time: new Date(getFutureDate(1).setHours(10, 0, 0, 0)),
                            end_time: new Date(getFutureDate(1).setHours(10, 30, 0, 0)),
                            description: 'Diabetes management consultation',
                            createdAt: getRecentDate()
                        }
                    ];
                    _iteratorNormalCompletion5 = true, _didIteratorError5 = false, _iteratorError5 = undefined;
                    _state.label = 86;
                case 86:
                    _state.trys.push([
                        86,
                        91,
                        92,
                        93
                    ]);
                    _iterator5 = appointmentsData[Symbol.iterator]();
                    _state.label = 87;
                case 87:
                    if (!!(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done)) return [
                        3,
                        90
                    ];
                    apt = _step5.value;
                    return [
                        4,
                        prisma.appointment.upsert({
                            where: {
                                id: apt.id
                            },
                            update: {},
                            create: apt
                        })
                    ];
                case 88:
                    _state.sent();
                    _state.label = 89;
                case 89:
                    _iteratorNormalCompletion5 = true;
                    return [
                        3,
                        87
                    ];
                case 90:
                    return [
                        3,
                        93
                    ];
                case 91:
                    err = _state.sent();
                    _didIteratorError5 = true;
                    _iteratorError5 = err;
                    return [
                        3,
                        93
                    ];
                case 92:
                    try {
                        if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
                            _iterator5.return();
                        }
                    } finally{
                        if (_didIteratorError5) {
                            throw _iteratorError5;
                        }
                    }
                    return [
                        7
                    ];
                case 93:
                    console.log('✅ Created 3 appointments');
                    _state.label = 94;
                case 94:
                    // Create 3 adherence records
                    console.log('📋 Creating 3 adherence records...');
                    if (!(createdPatients.length >= 2)) return [
                        3,
                        103
                    ];
                    adherenceData = [
                        {
                            id: '00000000-0000-0000-0000-000000000401',
                            patient_id: createdPatients[0].id,
                            adherence_type: 'MEDICATION',
                            due_at: getRandomPastDate(1, 7),
                            recorded_at: getRandomPastDate(1, 7),
                            is_completed: true,
                            is_missed: false,
                            created_at: getRandomPastDate(1, 7),
                            updated_at: getRecentDate()
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000402',
                            patient_id: createdPatients[1].id,
                            adherence_type: 'VITAL_CHECK',
                            due_at: getRandomPastDate(2, 8),
                            recorded_at: getRandomPastDate(2, 8),
                            is_completed: true,
                            is_missed: false,
                            created_at: getRandomPastDate(2, 8),
                            updated_at: getRecentDate()
                        },
                        {
                            id: '00000000-0000-0000-0000-000000000403',
                            patient_id: createdPatients.length >= 3 ? createdPatients[2].id : createdPatients[0].id,
                            adherence_type: 'APPOINTMENT',
                            due_at: getRandomPastDate(3, 9),
                            recorded_at: null,
                            is_completed: false,
                            is_missed: true,
                            created_at: getRandomPastDate(3, 9),
                            updated_at: getRecentDate()
                        }
                    ];
                    _iteratorNormalCompletion6 = true, _didIteratorError6 = false, _iteratorError6 = undefined;
                    _state.label = 95;
                case 95:
                    _state.trys.push([
                        95,
                        100,
                        101,
                        102
                    ]);
                    _iterator6 = adherenceData[Symbol.iterator]();
                    _state.label = 96;
                case 96:
                    if (!!(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done)) return [
                        3,
                        99
                    ];
                    record = _step6.value;
                    return [
                        4,
                        prisma.adherenceRecord.upsert({
                            where: {
                                id: record.id
                            },
                            update: {},
                            create: record
                        })
                    ];
                case 97:
                    _state.sent();
                    _state.label = 98;
                case 98:
                    _iteratorNormalCompletion6 = true;
                    return [
                        3,
                        96
                    ];
                case 99:
                    return [
                        3,
                        102
                    ];
                case 100:
                    err = _state.sent();
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                    return [
                        3,
                        102
                    ];
                case 101:
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
                            _iterator6.return();
                        }
                    } finally{
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                    return [
                        7
                    ];
                case 102:
                    console.log('✅ Created 3 adherence records');
                    _state.label = 103;
                case 103:
                    console.log("\n\uD83C\uDF89 Successfully seeded comprehensive healthcare test data!");
                    console.log("\uD83D\uDCCA Summary:");
                    console.log("   - Users: 8 (5 patients, 3 doctors, 1 HSP, 1 system admin, 1 provider admin) ✅");
                    console.log("   - Doctor-Patient Relationships:");
                    console.log("     * Dr. John Smith (Cardiology): 3 patients + clinic ✅");
                    console.log("     * Dr. Jane Doe (Endocrinology): 2 patients ✅");
                    console.log("     * Dr. Emily Rodriguez (General Medicine): 0 patients ✅");
                    console.log("   - Provider Admin linked to Dr. Smith & Dr. Rodriguez ✅");
                    console.log("   - Organization: 1 ✅");
                    console.log("   - Medical Specialties: 11 ✅");
                    console.log("   - Medicines: 10 ✅");
                    console.log("   - Patient Care Plans: 5 (with diets, workouts, symptoms) ✅");
                    console.log("   - Patient Symptoms: 11 individual symptoms ✅");
                    console.log("   - Medication Reminders: 15 (3 per patient) ✅");
                    console.log("   - Clinic: 1 (Smith Cardiology Clinic) ✅");
                    console.log("   - Vital Templates: 4 ✅");
                    console.log("   - Symptoms Database: 5 ✅");
                    console.log("   - Treatments Database: 5 ✅");
                    console.log("   - Appointments: 3 ✅");
                    console.log("   - Adherence Records: 3 ✅");
                    console.log("   - Provider: ".concat(provider ? '✅' : '⚠️'));
                    console.log("\n\uD83D\uDD11 Login Credentials:");
                    console.log("   - Dr. Smith (3 patients + clinic): doctor@healthapp.com / TempPassword123!");
                    console.log("   - Dr. Doe (2 patients): doctor1@healthapp.com / TempPassword123!");
                    console.log("   - All other users: email / ".concat(defaultPassword));
                    console.log("\n\uD83D\uDCC8 Dashboard Data Ready:");
                    console.log("   - Doctor Dashboards: Patient lists, appointments, medication tracking ✅");
                    console.log("   - Patient Dashboards: Care plans, medications, symptoms, vitals ✅");
                    return [
                        2,
                        {
                            success: true,
                            message: 'Comprehensive healthcare test data seeded successfully with exact structure requested',
                            data: {
                                // users: 8,
                                users: testUsers.count,
                                patients: 5,
                                doctors: 3,
                                doctorPatientDistribution: 'Dr.Smith(3), Dr.Doe(2), Dr.Rodriguez(0)',
                                hsp: 1,
                                systemAdmin: 1,
                                providerAdmin: 1,
                                organizations: 1,
                                clinics: 1,
                                specialties: 11,
                                medicines: 10,
                                carePlans: 5,
                                patientSymptoms: 11,
                                medicationReminders: 15,
                                vitalTemplates: 4,
                                symptomsDatabase: 5,
                                treatmentsDatabase: 5,
                                appointments: 3,
                                adherenceRecords: 3,
                                provider: provider ? 1 : 0,
                                providerDoctorLinks: 2
                            }
                        }
                    ];
                case 104:
                    error4 = _state.sent();
                    console.error('❌ Error seeding healthcare data:', error4);
                    // Enhanced error handling for common schema issues
                    if (error4.code === 'P2002') {
                        console.error('🔍 Unique constraint violation - data may already exist or IDs conflict');
                    } else if (error4.code === 'P2003') {
                        console.error('🔍 Foreign key constraint failed - relationship data missing or invalid');
                    } else if (error4.code === 'P2021') {
                        console.error('🔍 Database table does not exist - run migrations first');
                    } else if (error4.code === 'P2025') {
                        console.error('🔍 Record not found - dependency data missing');
                    } else if (error4.message.includes('Unknown field')) {
                        console.error('🔍 Schema field mismatch - check Prisma schema against database');
                    } else {
                        console.error('🔍 Unexpected error during seeding process');
                    }
                    console.error('\n💡 Troubleshooting suggestions:');
                    console.error('   1. Run: npx prisma migrate dev');
                    console.error('   2. Run: npx prisma generate');
                    console.error('   3. Check database connection');
                    console.error('   4. Verify Prisma schema matches database structure');
                    throw error4;
                case 105:
                    return [
                        4,
                        prisma.$disconnect()
                    ];
                case 106:
                    _state.sent();
                    return [
                        7
                    ];
                case 107:
                    return [
                        2
                    ];
            }
        });
    })();
}
// Main execution when run directly
if (require("url").pathToFileURL(__filename).toString() === new URL(process.argv[1], 'file://').href) {
    console.log('🚀 Starting healthcare data seeding...');
    seedComprehensiveHealthcareData().then(function(result) {
        console.log('🎉 Seeding completed successfully:', result);
        process.exit(0);
    }).catch(function(error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
}

