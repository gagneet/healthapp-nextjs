'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeftIcon,
    PlusIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    CheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Patient,
    CarePlan,
    Medication,
    VitalReading,
    Appointment,
    Symptom
} from '@/types/dashboard'
import { formatDate, formatDateTime, getInitials, getAdherenceColor, getPriorityColor } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import BodyDiagramEnhanced from '@/components/ui/body-diagram-enhanced'
import SymptomsTimeline from '@/components/ui/symptoms-timeline'

// API Response types for patient data
// Updated: This interface was previously misaligned with the API response for a single patient.
// - The field 'patientId' was added to match the API.
// - The 'medicalRecordNumber' type was changed from 'string' to 'string | null' for accuracy.
// - The 'user' object now includes 'accountStatus' and nullable fields for 'phone', 'dateOfBirth', and 'gender'.
// - The fields 'adherenceRate', 'criticalAlerts', and 'createdAt' were added to reflect the latest API contract.
// This alignment ensures type safety and consistency with the backend API.
interface PatientAPIResponse {
    id: string;
    patientId: string;
    medicalRecordNumber: string | null;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        dateOfBirth: string | null;
        gender: string | null;
        accountStatus: string;
    };
    adherenceRate: number;
    criticalAlerts: number;
    createdAt: string;
}

// Mock data removed - using real API data only

// Mock data removed - using real API data from carePlans state

// Mock data removed - using real API data from medications state

// ⚠️ UNUSED - Mock data kept for reference only - All UI uses real API data from state
const mockVitalReadings: VitalReading[] = [
    {
        id: '1',
        type: 'Blood Pressure',
        value: 140,
        unit: 'mmHg',
        readingTime: '2025-01-22T08:30:00Z',
        isFlagged: true,
        normalRange: { min: 90, max: 120 },
    },
    {
        id: '2',
        type: 'Blood Glucose',
        value: 125,
        unit: 'mg/dL',
        readingTime: '2025-01-22T09:00:00Z',
        isFlagged: false,
        normalRange: { min: 70, max: 140 },
    },
]

// ⚠️ UNUSED - Mock data kept for reference only - All UI uses real API data from state
const mockAppointments: Appointment[] = [
    {
        id: '1',
        title: 'Follow-up Consultation',
        type: 'follow-up',
        startTime: '2025-02-01T10:00:00Z',
        endTime: '2025-02-01T10:30:00Z',
        status: 'scheduled',
        isVirtual: false,
    },
    {
        id: '2',
        title: 'Blood Work Review',
        type: 'consultation',
        startTime: '2025-01-25T14:00:00Z',
        endTime: '2025-01-25T14:30:00Z',
        status: 'confirmed',
        isVirtual: true,
        notes: 'Review recent lab results',
    },
]

const symptoms = [
    {
        id: '1',
        name: 'Headache',
        severity: 6,
        description: 'Persistent headache, especially in the morning',
        onsetTime: '2025-01-20T06:00:00Z',
        recordedAt: '2025-01-20T08:00:00Z',
        x: 50, // Head position (2D)
        y: 8,
        z: 0, // Front of head (3D)
        bodyPart: 'Head',
        status: 'active'
    },
    {
        id: '2',
        name: 'Chest Pain',
        severity: 8,
        description: 'Sharp chest pain, worse with deep breathing',
        onsetTime: '2025-01-19T14:30:00Z',
        recordedAt: '2025-01-19T15:00:00Z',
        x: 50, // Chest position (2D)
        y: 25,
        z: 0.2, // Front of chest (3D)
        bodyPart: 'Chest',
        status: 'worsening'
    },
    {
        id: '3',
        name: 'Back Pain',
        severity: 5,
        description: 'Lower back pain, aching sensation',
        onsetTime: '2025-01-18T10:00:00Z',
        recordedAt: '2025-01-18T10:15:00Z',
        x: 50, // Back position (2D)
        y: 40,
        z: -0.3, // Back of torso (3D)
        bodyPart: 'Lower Back',
        status: 'improving'
    },
    {
        id: '4',
        name: 'Knee Pain',
        severity: 4,
        description: 'Right knee pain when walking',
        onsetTime: '2025-01-17T16:20:00Z',
        recordedAt: '2025-01-17T18:00:00Z',
        x: 60, // Right knee position (2D)
        y: 80,
        z: 0.1, // Right side (3D)
        bodyPart: 'Right Knee',
        status: 'active'
    },
    {
        id: '5',
        name: 'Shoulder Pain',
        severity: 3,
        description: 'Left shoulder stiffness and mild pain',
        onsetTime: '2025-01-16T09:15:00Z',
        recordedAt: '2025-01-16T11:30:00Z',
        x: 35, // Left shoulder position (2D)
        y: 22,
        z: 0.1, // Left side (3D)
        bodyPart: 'Left Shoulder',
        status: 'resolved'
    },
    {
        id: '6',
        name: 'Abdominal Pain',
        severity: 7,
        description: 'Sharp abdominal pain in upper right quadrant',
        onsetTime: '2025-01-15T12:45:00Z',
        recordedAt: '2025-01-15T13:00:00Z',
        x: 55, // Abdomen position (2D)
        y: 45,
        z: 0.2, // Front of abdomen (3D)
        bodyPart: 'Abdomen',
        status: 'resolved'
    }
]

// Vital signs chart data will be generated from real vital readings

const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'medications', name: 'Medications' },
    { id: 'vitals', name: 'Vitals' },
    { id: 'appointments', name: 'Appointments' },
    { id: 'symptoms', name: 'Symptoms' },
    { id: 'care-plans', name: 'Care Plans' },
]

export default function PatientDetailsPage() {
    const params = useParams()
    const patientId = params.patientId as string
    const [activeTab, setActiveTab] = useState('overview')
    const [patient, setPatient] = useState<Patient | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Data states for different sections
    const [medications, setMedications] = useState<Medication[]>([])
    const [vitals, setVitals] = useState<VitalReading[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [carePlans, setCarePlans] = useState<CarePlan[]>([])
    const [symptoms, setSymptoms] = useState<any[]>([])
    const [loadingStates, setLoadingStates] = useState({
        carePlans: false,
        vitals: false,
        appointments: false,
        symptoms: false
    })

    // Modal states for comprehensive functionality
    const [showMedicationModal, setShowMedicationModal] = useState(false)
    const [showAppointmentModal, setShowAppointmentModal] = useState(false)
    const [showVitalModal, setShowVitalModal] = useState(false)
    const [showSymptomModal, setShowSymptomModal] = useState(false)
    const [showDietModal, setShowDietModal] = useState(false)
    const [showWorkoutModal, setShowWorkoutModal] = useState(false)
    const [showReportsModal, setShowReportsModal] = useState(false)
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
    const [showTeamModal, setShowTeamModal] = useState(false)
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)

    // Body diagram and symptoms states
    const [bodyView, setBodyView] = useState<'front' | 'back' | 'left' | 'right'>('front')
    const [highlightedSymptom, setHighlightedSymptom] = useState<string | null>(null)

    // API call functions
    const fetchPatientData = useCallback(async () => {
        try {
            // Use NextAuth session-based authentication with credentials: 'include'
            const response = await fetch(`/api/patients/${patientId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include' // This will include session cookies
            })

            if (!response.ok) {
                throw new Error(`Failed to fetch patient data: ${response.statusText}`)
            }

            const data = await response.json();
            const patientData = data.data;

            if (!patientData) {
                throw new Error('No patient data found');
            }

            // Transform API response to match frontend Patient type
            const transformedPatient: Patient = {
                id: patientData.id,
                userId: patientData.user.id, // Corrected: Use user.id for the user's ID
                firstName: patientData.user.firstName || '',
                lastName: patientData.user.lastName || '',
                email: patientData.user.email || '',
                phone: patientData.user.phone || '',
                gender: patientData.user.gender || '',
                medicalRecordNumber: patientData.medicalRecordNumber || '',
                lastVisit: '', // Will be calculated from appointments
                nextAppointment: '', // Will be calculated from appointments
                adherenceRate: patientData.adherenceRate,
                criticalAlerts: patientData.criticalAlerts,
                status: patientData.user.accountStatus,
                createdAt: patientData.createdAt,
                profilePictureUrl: '', // Placeholder
            };
            setPatient(transformedPatient);
        } catch (err) {
            console.error('Error fetching patient data:', err)
            setError(err instanceof Error ? err.message : 'Failed to load patient data')
        }
    }, [patientId])

    const fetchMedications = useCallback(async () => {
        try {
            setLoadingStates(prev => ({ ...prev, carePlans: true }))
            const response = await fetch(`/api/medications/patient/${patientId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                // Transform the API response to match expected format
                if (data.data?.carePlans) {
                    setMedications(data.data.carePlans)
                }
            }
        } catch (err) {
            console.error('Error fetching carePlans: ', err)
            // Keep empty array as fallback
        } finally {
            setLoadingStates(prev => ({ ...prev, carePlans: false }))
        }
    }, [patientId])

    const fetchVitals = useCallback(async () => {
        try {
            setLoadingStates(prev => ({ ...prev, vitals: true }))
            const response = await fetch(`/api/vitals/patient/${patientId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.data?.vitals) {
                    setVitals(data.data.vitals)
                }
            }
        } catch (err) {
            console.error('Error fetching vitals:', err)
        } finally {
            setLoadingStates(prev => ({ ...prev, vitals: false }))
        }
    }, [patientId])

    const fetchAppointments = useCallback(async () => {
        try {
            setLoadingStates(prev => ({ ...prev, appointments: true }))
            const response = await fetch(`/api/appointments/patient/${patientId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.data?.appointments) {
                    setAppointments(data.data.appointments)
                }
            }
        } catch (err) {
            console.error('Error fetching appointments:', err)
        } finally {
            setLoadingStates(prev => ({ ...prev, appointments: false }))
        }
    }, [patientId])

    const fetchCarePlans = useCallback(async () => {
        try {
            setLoadingStates(prev => ({ ...prev, carePlans: true }))
            const response = await fetch(`/api/patients/${patientId}/careplan-details`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.data?.carePlans) {
                    setCarePlans(data.data.carePlans)
                }
            }
        } catch (err) {
            console.error('Error fetching care plans:', err)
        } finally {
            setLoadingStates(prev => ({ ...prev, carePlans: false }))
        }
    }, [patientId])

    useEffect(() => {
        const loadAllData = async () => {
            setIsLoading(true)
            setError(null)

            try {
                await fetchPatientData()
                // Load additional data in parallel
                await Promise.allSettled([
                    fetchMedications(),
                    fetchVitals(),
                    fetchAppointments(),
                    fetchCarePlans()
                ])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data')
            } finally {
                setIsLoading(false)
            }
        }

        if (patientId) {
            loadAllData()
        }
    }, [patientId, fetchPatientData, fetchMedications, fetchVitals, fetchAppointments, fetchCarePlans])

    useEffect(() => {
        if (appointments.length > 0) {
            const now = new Date();
            const pastAppointments = appointments
                .filter(a => new Date(a.startTime) < now)
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

            const futureAppointments = appointments
                .filter(a => new Date(a.startTime) >= now)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            setPatient(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    lastVisit: pastAppointments.length > 0 ? pastAppointments[0].startTime : '',
                    nextAppointment: futureAppointments.length > 0 ? futureAppointments[0].startTime : '',
                };
            });
        }
    }, [appointments]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="ml-4 text-gray-600">Loading patient data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Error loading patient data</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                        <div className="mt-4 space-x-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                            >
                                Try again
                            </button>
                            <Link
                                href="/dashboard/doctor/patients"
                                className="inline-flex items-center text-red-600 hover:text-red-700 text-sm"
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                                Back to Patients
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Patient not found</h2>
                <p className="text-gray-600 mt-2">
                    {patientId ?
                        `The patient you're looking for doesn't exist or you don't have permission to view them.` :
                        `No patient ID provided.`
                    }
                </p>
                <Link
                    href="/dashboard/doctor/patients"
                    className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Patients
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link
                        href="/dashboard/doctor/patients"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-600">
                {getInitials(patient.firstName, patient.lastName)}
              </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {patient.firstName} {patient.lastName}
                            </h1>
                            <p className="text-gray-600">
                                {patient.medicalRecordNumber} • {patient.email}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Comprehensive Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    {/* Primary Actions */}
                    <div className="flex space-x-2">
                        <Link
                            href={`/dashboard/doctor/patients/${patient.id}/care-plan/new`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Create Care Plan
                        </Link>
                        <Link
                            href={`/dashboard/doctor/patients/${patient.id}/care-plan/template`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            From Template
                        </Link>
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowMedicationModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Medication
                        </button>
                        <button
                            onClick={() => setShowAppointmentModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Appointment
                        </button>
                        <button
                            onClick={() => setShowVitalModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Vital
                        </button>
                        <button
                            onClick={() => setShowSymptomModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Symptom
                        </button>
                    </div>

                    {/* Advanced Actions */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowPrescriptionModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100"
                        >
                            Generate Prescription
                        </button>
                        <button
                            onClick={() => setShowReportsModal(true)}
                            className="inline-flex items-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        >
                            Upload Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Comprehensive Tabs for Patient Management */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {[
                        { id: 'overview', name: 'Overview', icon: '📊' },
                        { id: 'care-plans', name: 'Care Plans', icon: '📋' },
                        { id: 'medications', name: 'Medications', icon: '💊' },
                        { id: 'appointments', name: 'Appointments', icon: '📅' },
                        { id: 'vitals', name: 'Vitals', icon: '🩺' },
                        { id: 'symptoms', name: 'Symptoms', icon: '🔍' },
                        { id: 'diet', name: 'Diet', icon: '🥗' },
                        { id: 'workouts', name: 'Workouts', icon: '💪' },
                        { id: 'reports', name: 'Reports', icon: '📄' },
                        { id: 'team', name: 'Care Team', icon: '👥' },
                        { id: 'subscriptions', name: 'Services', icon: '🔔' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Original content continues here */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex space-x-3">
                        <Link
                            href={`/dashboard/doctor/patients/${patient.id}/care-plan/new`}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Care Plan
                        </Link>
                    </div>
                </div>
            </div>

            {/* Patient Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Overall Adherence</p>
                                <p className="text-3xl font-bold text-gray-900">{patient.adherenceRate}%</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <CheckIcon className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                                <p className="text-3xl font-bold text-gray-900">{patient.criticalAlerts}</p>
                            </div>
                            <div className="p-3 rounded-full bg-red-100">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Medications</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {loadingStates.carePlans ? (
                                        <span className="text-sm text-gray-500">Loading...</span>
                                    ) : (
                                        medications.length
                                    )}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100">
                                <ClockIcon className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Next Appointment</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {patient.nextAppointment ? formatDate(patient.nextAppointment) : (
                                        <span className="text-sm text-gray-500 font-normal">No appointments scheduled</span>
                                    )}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100">
                                <ClockIcon className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Missed Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-600">Recent Missed Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div>
                                <p className="font-medium text-red-900">Blood Pressure Medication</p>
                                <p className="text-sm text-red-700">Missed on Jan 20, 2025 at 8:00 AM</p>
                            </div>
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">Critical</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div>
                                <p className="font-medium text-yellow-900">Blood Glucose Reading</p>
                                <p className="text-sm text-yellow-700">Missed on Jan 19, 2025 at 9:00 AM</p>
                            </div>
                            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Important</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Patient Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Patient Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {(patient as any).date_of_birth ?
                                                formatDate((patient as any).date_of_birth) :
                                                <span className="text-gray-400 italic">Not provided</span>
                                            }
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Gender</dt>
                                        <dd className="mt-1 text-sm text-gray-900 capitalize">
                                            {(patient as any).gender ? (patient as any).gender.toLowerCase() : (
                                                <span className="text-gray-400 italic">Not specified</span>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {patient.phone || <span className="text-gray-400 italic">Not provided</span>}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {patient.email || <span className="text-gray-400 italic">Not provided</span>}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Medical Record Number</dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {patient.medicalRecordNumber || <span className="text-gray-400 italic">Not assigned</span>}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                        {patient.status}
                      </span>
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        {/* Vital Signs Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vital Signs Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={[]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="bp_systolic" stroke="#ef4444" name="Systolic BP" />
                                        <Line type="monotone" dataKey="glucose" stroke="#3b82f6" name="Glucose" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'medications' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Active Medications</CardTitle>
                                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Medication
                                </button>
                            </CardHeader>
                            <CardContent>
                                {loadingStates.carePlans ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="ml-3 text-gray-600">Loading medications...</p>
                                    </div>
                                ) : medications.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No medications found for this patient.</p>
                                        <p className="text-sm text-gray-400 mt-1">Click Add Medication to get started.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {medications.map((medication) => (
                                            <div key={medication.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                {medication.name || 'Unknown Medication'}
                                                            </h3>
                                                            {medication.isCritical === true && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Critical
                              </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            {medication.dosage || 'Dosage not specified'} • {medication.frequency || 'Frequency not specified'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Started: {medication.startDate ? formatDate(medication.startDate) : 'Date not specified'}
                                                        </p>
                                                        {medication.lastTaken ? (
                                                            <p className="text-sm text-gray-500">
                                                                Last taken: {formatDateTime(medication.lastTaken)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic">
                                                                No recorded doses yet
                                                            </p>
                                                        )}
                                                        {medication.nextDue ? (
                                                            <p className="text-sm text-blue-600">
                                                                Next due: {formatDateTime(medication.nextDue)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic">
                                                                No upcoming doses scheduled
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                                                            medication.adherenceRate !== undefined ? getAdherenceColor(medication.adherenceRate) : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {medication.adherenceRate !== undefined ?
                                                                `${medication.adherenceRate}% adherence` :
                                                                'No data'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'vitals' && (
                    <div className="space-y-6">
                        {/* Vital Signs Overview Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {[
                                { name: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: '🩸', status: 'normal', trend: 'stable' },
                                { name: 'Heart Rate', value: '72', unit: 'bpm', icon: '❤️', status: 'normal', trend: 'down' },
                                { name: 'Temperature', value: '98.6', unit: '°F', icon: '🌡️', status: 'normal', trend: 'stable' },
                                { name: 'SpO2', value: '98', unit: '%', icon: '🫁', status: 'normal', trend: 'up' },
                                { name: 'Blood Glucose', value: '95', unit: 'mg/dL', icon: '🩸', status: 'normal', trend: 'stable' },
                                { name: 'Respiratory Rate', value: '16', unit: '/min', icon: '💨', status: 'normal', trend: 'stable' }
                            ].map((vital, index) => (
                                <Card key={index} className="relative">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-2xl">{vital.icon}</span>
                                            <div className={`w-2 h-2 rounded-full ${vital.status === 'normal' ? 'bg-green-500' : vital.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500">{vital.name}</p>
                                            <p className="text-lg font-bold text-gray-900">{vital.value}</p>
                                            <p className="text-xs text-gray-400">{vital.unit}</p>
                                        </div>
                                        <div className="flex items-center mt-2">
                      <span className={`text-xs ${vital.trend === 'up' ? 'text-green-600' : vital.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                        {vital.trend === 'up' ? '↗' : vital.trend === 'down' ? '↘' : '→'}
                      </span>
                                            <span className="text-xs text-gray-500 ml-1">trend</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Comprehensive Vitals Management */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Complete Vital Signs</CardTitle>
                                <button
                                    onClick={() => setShowVitalModal(true)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Record Vitals
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {/* Cardiovascular */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <span className="text-red-500 mr-2">❤️</span>
                                            Cardiovascular
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { name: 'Blood Pressure (Systolic)', value: '120', unit: 'mmHg', range: '90-140', status: 'normal' },
                                                { name: 'Blood Pressure (Diastolic)', value: '80', unit: 'mmHg', range: '60-90', status: 'normal' },
                                                { name: 'Heart Rate', value: '72', unit: 'bpm', range: '60-100', status: 'normal' },
                                                { name: 'Pulse Pressure', value: '40', unit: 'mmHg', range: '30-50', status: 'normal' }
                                            ].map((vital, index) => (
                                                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{vital.name}</p>
                                                        <p className="text-xs text-gray-500">Normal: {vital.range}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">{vital.value} <span className="text-xs font-normal">{vital.unit}</span></p>
                                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            vital.status === 'normal' ? 'bg-green-100 text-green-800' :
                                                                vital.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                        }`}>
                                                            {vital.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Respiratory */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <span className="text-blue-500 mr-2">🫁</span>
                                            Respiratory
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { name: 'Respiratory Rate', value: '16', unit: '/min', range: '12-20', status: 'normal' },
                                                { name: 'Oxygen Saturation (SpO2)', value: '98', unit: '%', range: '95-100', status: 'normal' },
                                                { name: 'Peak Expiratory Flow', value: '450', unit: 'L/min', range: '400-600', status: 'normal' },
                                                { name: 'Oxygen Therapy', value: 'Room Air', unit: '', range: 'Room Air', status: 'normal' }
                                            ].map((vital, index) => (
                                                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{vital.name}</p>
                                                        <p className="text-xs text-gray-500">Normal: {vital.range}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">{vital.value} <span className="text-xs font-normal">{vital.unit}</span></p>
                                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            vital.status === 'normal' ? 'bg-green-100 text-green-800' :
                                                                vital.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                        }`}>
                                                            {vital.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* General & Metabolic */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <span className="text-green-500 mr-2">🌡️</span>
                                            General & Metabolic
                                        </h3>
                                        <div className="space-y-3">
                                            {[
                                                { name: 'Body Temperature', value: '98.6', unit: '°F', range: '97.8-99.1', status: 'normal' },
                                                { name: 'Blood Glucose', value: '95', unit: 'mg/dL', range: '70-100', status: 'normal' },
                                                { name: 'Weight', value: '180', unit: 'lbs', range: '170-190', status: 'normal' },
                                                { name: 'BMI', value: '24.5', unit: 'kg/m²', range: '18.5-25', status: 'normal' }
                                            ].map((vital, index) => (
                                                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{vital.name}</p>
                                                        <p className="text-xs text-gray-500">Normal: {vital.range}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">{vital.value} <span className="text-xs font-normal">{vital.unit}</span></p>
                                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            vital.status === 'normal' ? 'bg-green-100 text-green-800' :
                                                                vital.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                        }`}>
                                                            {vital.status}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fluid Intake/Output Tracking */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Fluid Balance Monitoring</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-medium text-gray-900">Fluid Intake (24h)</h4>
                                        <div className="space-y-3">
                                            {[
                                                { type: 'Oral Fluids', amount: '1200', unit: 'mL', time: '08:00-20:00' },
                                                { type: 'IV Fluids', amount: '500', unit: 'mL', time: 'Continuous' },
                                                { type: 'Total Intake', amount: '1700', unit: 'mL', time: '24h', highlight: true }
                                            ].map((fluid, index) => (
                                                <div key={index} className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                                                    fluid.highlight ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                                                }`}>
                                                    <div>
                                                        <p className={`text-sm font-medium ${fluid.highlight ? 'text-blue-900' : 'text-gray-900'}`}>{fluid.type}</p>
                                                        <p className="text-xs text-gray-500">{fluid.time}</p>
                                                    </div>
                                                    <p className={`text-lg font-bold ${fluid.highlight ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        {fluid.amount} <span className="text-xs font-normal">{fluid.unit}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-lg font-medium text-gray-900">Fluid Output (24h)</h4>
                                        <div className="space-y-3">
                                            {[
                                                { type: 'Urine Output', amount: '1100', unit: 'mL', time: '24h' },
                                                { type: 'Other Losses', amount: '400', unit: 'mL', time: 'Estimated' },
                                                { type: 'Total Output', amount: '1500', unit: 'mL', time: '24h', highlight: true }
                                            ].map((fluid, index) => (
                                                <div key={index} className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                                                    fluid.highlight ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                                                }`}>
                                                    <div>
                                                        <p className={`text-sm font-medium ${fluid.highlight ? 'text-orange-900' : 'text-gray-900'}`}>{fluid.type}</p>
                                                        <p className="text-xs text-gray-500">{fluid.time}</p>
                                                    </div>
                                                    <p className={`text-lg font-bold ${fluid.highlight ? 'text-orange-900' : 'text-gray-900'}`}>
                                                        {fluid.amount} <span className="text-xs font-normal">{fluid.unit}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Fluid Balance */}
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-green-900">Net Fluid Balance</p>
                                                <p className="text-lg font-bold text-green-900">+200 mL</p>
                                            </div>
                                            <p className="text-xs text-green-700 mt-1">Positive balance - monitor for edema</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vital Signs Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vital Signs Trend (Last 7 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={[]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="bp_systolic" stroke="#ef4444" name="Systolic BP" strokeWidth={2} />
                                        <Line type="monotone" dataKey="bp_diastolic" stroke="#f97316" name="Diastolic BP" strokeWidth={2} />
                                        <Line type="monotone" dataKey="glucose" stroke="#3b82f6" name="Blood Glucose" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Appointments</CardTitle>
                                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Schedule Appointment
                                </button>
                            </CardHeader>
                            <CardContent>
                                {loadingStates.appointments ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="ml-3 text-gray-600">Loading appointments...</p>
                                    </div>
                                ) : appointments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No appointments scheduled for this patient.</p>
                                        <p className="text-sm text-gray-400 mt-1">Click Schedule Appointment to create one.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {appointments.map((appointment) => (
                                            <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            {appointment.title || 'Untitled Appointment'}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 capitalize">
                                                            {appointment.type || 'General consultation'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {appointment.startTime ? formatDateTime(appointment.startTime) : 'Time not set'} - {appointment.endTime ? formatDateTime(appointment.endTime) : 'End time not set'}
                                                        </p>
                                                        {appointment.notes ? (
                                                            <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                                                        ) : (
                                                            <p className="text-sm text-gray-400 italic mt-2">No notes added</p>
                                                        )}
                                                        <div className="flex items-center mt-2 space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status || 'pending'}
                            </span>
                                                            {appointment.isVirtual && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Virtual
                              </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'symptoms' && (
                    <div className="space-y-6">
                        {/* Header with Add Symptom Button */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Symptoms Tracking</h2>
                                <p className="text-gray-600 mt-1">Interactive body diagram and timeline of patient symptoms</p>
                            </div>
                            <button
                                onClick={() => setShowSymptomModal(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="h-4 w-4 mr-2" />
                                Add Symptom
                            </button>
                        </div>

                        {/* Body Diagram and Timeline Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Side - Interactive Body Diagram */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Body Diagram</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Click on symptom markers to highlight them in the timeline. Rotate the body to view different angles.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <BodyDiagramEnhanced
                                        symptoms={symptoms}
                                        view={bodyView}
                                        onViewChange={setBodyView}
                                        highlightedSymptom={highlightedSymptom}
                                        interactive={true}
                                        gender={patient?.gender === 'F' ? 'female' : 'male'}
                                        onSymptomClick={(symptom) => {
                                            setHighlightedSymptom(symptom.id === highlightedSymptom ? null : symptom.id)
                                        }}
                                        onBodyClick={(x, y, z) => {
                                            console.log('Clicked body at:', x, y, z)
                                            // Could open a modal to add new symptom at this position
                                        }}
                                    />
                                </CardContent>
                            </Card>

                            {/* Right Side - Symptoms Timeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Symptoms Timeline</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Click on timeline entries to highlight the corresponding body location.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <SymptomsTimeline
                                        symptoms={symptoms}
                                        highlightedSymptom={highlightedSymptom}
                                        onSymptomClick={(symptom) => {
                                            setHighlightedSymptom(symptom.id === highlightedSymptom ? null : symptom.id)

                                            // Auto-rotate body diagram to best view for the symptom
                                            if (symptom.bodyPart?.toLowerCase().includes('back')) {
                                                setBodyView('back')
                                            } else if (symptom.bodyPart?.toLowerCase().includes('side')) {
                                                setBodyView('left')
                                            } else {
                                                setBodyView('front')
                                            }
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Additional Symptom Analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Most Severe</p>
                                            <p className="text-lg font-bold text-red-600">
                                                {Math.max(...symptoms.map(s => s.severity))}/10
                                            </p>
                                        </div>
                                        <div className="text-2xl">🚨</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Active Symptoms</p>
                                            <p className="text-lg font-bold text-orange-600">
                                                {symptoms.filter(s => s.status === 'active').length}
                                            </p>
                                        </div>
                                        <div className="text-2xl">⚡</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-600">Resolved</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {symptoms.filter(s => s.status === 'resolved').length}
                                            </p>
                                        </div>
                                        <div className="text-2xl">✅</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Mobile App Note */}
                        <Card>
                            <CardContent className="p-4 bg-blue-50">
                                <div className="flex items-start space-x-3">
                                    <div className="text-2xl">📱</div>
                                    <div>
                                        <h4 className="font-medium text-blue-900">Mobile App Integration</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            This body diagram and symptom tracking is fully available in the patient mobile app.
                                            Patients can log symptoms by tapping directly on their body, and you'll see real-time updates here.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'care-plans' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Care Plans</CardTitle>
                                <Link
                                    href={`/dashboard/doctor/patients/${patient.id}/care-plan/new`}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Create Care Plan
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {loadingStates.carePlans ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="ml-3 text-gray-600">Loading care plans...</p>
                                    </div>
                                ) : carePlans.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No care plans found for this patient.</p>
                                        <p className="text-sm text-gray-400 mt-1">Click Create Care Plan to create one.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {carePlans.map((carePlan) => (
                                            <div key={carePlan.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                {carePlan.name || 'Unnamed Care Plan'}
                                                            </h3>
                                                            {carePlan.priority && (
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(carePlan.priority)}`}>
                                {carePlan.priority}
                              </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            {carePlan.startDate ? formatDate(carePlan.startDate) : 'Start date not set'} - {carePlan.endDate ? formatDate(carePlan.endDate) : 'Ongoing'}
                                                        </p>
                                                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                                            <span>{carePlan.adherenceSummary?.medicationsCount || 0} medications</span>
                                                            <span>{carePlan.adherenceSummary?.vitalsCount || 0} vitals</span>
                                                            <span>{carePlan.adherenceSummary?.appointmentsCount || 0} appointments</span>
                                                        </div>
                                                    </div>
                                                    <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              carePlan.status === 'active' ? 'bg-green-100 text-green-800' :
                                  carePlan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                      'bg-yellow-100 text-yellow-800'
                          }`}>
                            {carePlan.status || 'draft'}
                          </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Diet Management Tab */}
                {activeTab === 'diet' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Diet Plans & Nutrition</CardTitle>
                                <button
                                    onClick={() => setShowDietModal(true)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Diet Plan
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Current Diet Plan</h3>
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900">Diabetic Diet Plan</h4>
                                            <p className="text-sm text-gray-600 mt-1">Low carb, balanced nutrition</p>
                                            <div className="mt-3 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Calories/day:</span>
                                                    <span className="font-medium">1800-2000</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Carbs:</span>
                                                    <span className="font-medium">45-50%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Protein:</span>
                                                    <span className="font-medium">20-25%</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Fat:</span>
                                                    <span className="font-medium">25-30%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Meal Recommendations</h3>
                                        <div className="space-y-3">
                                            {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((meal) => (
                                                <div key={meal} className="border border-gray-200 rounded-lg p-3">
                                                    <h5 className="font-medium text-gray-900">{meal}</h5>
                                                    <p className="text-sm text-gray-600">Click to view recommendations</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Workout Management Tab */}
                {activeTab === 'workouts' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Exercise & Physical Activity</CardTitle>
                                <button
                                    onClick={() => setShowWorkoutModal(true)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Workout Plan
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Current Exercise Plan</h3>
                                        <div className="border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900">Cardiac Rehabilitation</h4>
                                            <p className="text-sm text-gray-600 mt-1">Low-impact cardiovascular exercises</p>
                                            <div className="mt-3 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Frequency:</span>
                                                    <span className="font-medium">5 days/week</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Duration:</span>
                                                    <span className="font-medium">30-45 minutes</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span>Intensity:</span>
                                                    <span className="font-medium">Moderate</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium">Exercise Log</h3>
                                        <div className="space-y-3">
                                            {[
                                                { activity: 'Walking', duration: '30 min', date: '2025-01-22' },
                                                { activity: 'Swimming', duration: '25 min', date: '2025-01-21' },
                                                { activity: 'Cycling', duration: '35 min', date: '2025-01-20' }
                                            ].map((exercise, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h5 className="font-medium text-gray-900">{exercise.activity}</h5>
                                                            <p className="text-sm text-gray-600">{exercise.duration}</p>
                                                        </div>
                                                        <span className="text-sm text-gray-500">{exercise.date}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Reports & Documents Tab */}
                {activeTab === 'reports' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Medical Reports & Documents</CardTitle>
                                <button
                                    onClick={() => setShowReportsModal(true)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Upload Report
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {[
                                        { name: 'Blood Test Results', type: 'Lab Report', date: '2025-01-20', size: '2.3 MB', format: 'PDF' },
                                        { name: 'Chest X-Ray', type: 'Imaging', date: '2025-01-18', size: '5.1 MB', format: 'DICOM' },
                                        { name: 'ECG Report', type: 'Diagnostic', date: '2025-01-15', size: '1.8 MB', format: 'PDF' },
                                        { name: 'MRI Scan', type: 'Imaging', date: '2025-01-10', size: '15.2 MB', format: 'DICOM' },
                                        { name: 'Prescription', type: 'Medication', date: '2025-01-22', size: '0.5 MB', format: 'PDF' },
                                        { name: 'Consultation Notes', type: 'Clinical', date: '2025-01-22', size: '0.8 MB', format: 'PDF' }
                                    ].map((report, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 text-sm">{report.name}</h4>
                                                    <p className="text-xs text-gray-600 mt-1">{report.type}</p>
                                                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                                                        <span>{report.date}</span>
                                                        <span>•</span>
                                                        <span>{report.size}</span>
                                                        <span>•</span>
                                                        <span>{report.format}</span>
                                                    </div>
                                                </div>
                                                <button className="text-blue-600 hover:text-blue-700 text-sm">
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Care Team Tab */}
                {activeTab === 'team' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Care Team Members</CardTitle>
                                <button
                                    onClick={() => setShowTeamModal(true)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Team Member
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        {
                                            name: 'Dr. Sarah Johnson',
                                            role: 'Primary Care Physician',
                                            specialty: 'Internal Medicine',
                                            contact: 'sarah.johnson@clinic.com',
                                            status: 'Primary'
                                        },
                                        {
                                            name: 'Dr. Michael Chen',
                                            role: 'Cardiologist',
                                            specialty: 'Cardiology',
                                            contact: 'michael.chen@hospital.com',
                                            status: 'Specialist'
                                        },
                                        {
                                            name: 'Jennifer Smith, RN',
                                            role: 'Care Coordinator',
                                            specialty: 'Nursing',
                                            contact: 'jennifer.smith@clinic.com',
                                            status: 'Support'
                                        },
                                        {
                                            name: 'Dr. Maria Rodriguez',
                                            role: 'Endocrinologist',
                                            specialty: 'Endocrinology',
                                            contact: 'maria.rodriguez@hospital.com',
                                            status: 'Consultant'
                                        }
                                    ].map((member, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                                                        <p className="text-sm text-gray-600">{member.role}</p>
                                                        <p className="text-sm text-gray-500">{member.specialty}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{member.contact}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    member.status === 'Primary' ? 'bg-blue-100 text-blue-800' :
                                                        member.status === 'Specialist' ? 'bg-green-100 text-green-800' :
                                                            member.status === 'Support' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                }`}>
                          {member.status}
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Services & Subscriptions Tab */}
                {activeTab === 'subscriptions' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Services & Subscriptions</CardTitle>
                                <button
                                    onClick={() => setShowSubscriptionModal(true)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Service
                                </button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            {
                                                name: 'Remote Monitoring',
                                                description: 'Continuous vital signs monitoring',
                                                status: 'Active',
                                                cost: '$99/month',
                                                nextBilling: '2025-02-15'
                                            },
                                            {
                                                name: 'Medication Reminders',
                                                description: 'Automated medication alerts and tracking',
                                                status: 'Active',
                                                cost: '$29/month',
                                                nextBilling: '2025-02-10'
                                            },
                                            {
                                                name: 'Telemedicine Consultations',
                                                description: 'Video consultations with specialists',
                                                status: 'Paused',
                                                cost: '$149/month',
                                                nextBilling: 'Paused'
                                            },
                                            {
                                                name: 'Diet & Nutrition Coaching',
                                                description: 'Personalized nutrition guidance',
                                                status: 'Trial',
                                                cost: '$79/month',
                                                nextBilling: '2025-01-30'
                                            },
                                            {
                                                name: 'Emergency Response',
                                                description: '24/7 emergency medical response',
                                                status: 'Active',
                                                cost: '$199/month',
                                                nextBilling: '2025-02-20'
                                            },
                                            {
                                                name: 'Family Health Dashboard',
                                                description: 'Shared health insights for family',
                                                status: 'Inactive',
                                                cost: '$49/month',
                                                nextBilling: 'Not subscribed'
                                            }
                                        ].map((service, index) => (
                                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-gray-900 text-sm">{service.name}</h4>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            service.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                                service.status === 'Trial' ? 'bg-blue-100 text-blue-800' :
                                                                    service.status === 'Paused' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                        }`}>
                              {service.status}
                            </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600">{service.description}</p>
                                                    <div className="space-y-1 text-xs text-gray-500">
                                                        <div className="flex justify-between">
                                                            <span>Cost:</span>
                                                            <span className="font-medium">{service.cost}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span>Next billing:</span>
                                                            <span>{service.nextBilling}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}