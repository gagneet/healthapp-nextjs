'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  MapPinIcon,
  HeartIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock data - replace with actual API calls
const SYMPTOMS_OPTIONS = [
  'Fever', 'Headache', 'Chest Pain', 'Shortness of Breath', 'Nausea', 'Vomiting',
  'Dizziness', 'Fatigue', 'Cough', 'Sore Throat', 'Abdominal Pain', 'Back Pain',
  'Joint Pain', 'Muscle Weakness', 'Palpitations', 'Diarrhea', 'Constipation',
  'Loss of Appetite', 'Weight Loss', 'Weight Gain', 'Swelling', 'Rash'
]

const DIAGNOSIS_OPTIONS = [
  'Congenital Heart Disease', 'Congestive Heart Failure', 'Acute Rheumatic Fever',
  'Anemia', 'Hypertension', 'Developmental Disorders', 'Neurological Disorders',
  'Blood Disorders', 'Meningitis', 'Musculoskeletal Disorders'
]

const TREATMENT_OPTIONS = [
  'Medication',
  'Surgery',
  'Hip Replacement',
  'Chemotherapy',
  'Diet & Nutrition',
  'Exercise & Lifestyle',
  'Saline',
  'Other'
]

const CONDITIONS_OPTIONS = [
  'Acute', 'Chronic', 'Stable', 'Progressive', 'Terminal', 'Recovering',
  'Under Investigation', 'Monitoring Required', 'Emergency'
]

const COUNTRY_CODES = [
  { code: 'US', name: 'United States', dialCode: '+1', digits: 10 },
  { code: 'IN', name: 'India', dialCode: '+91', digits: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', digits: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', digits: 9 },
  { code: 'CA', name: 'Canada', dialCode: '+1', digits: 10 },
]

interface VoiceRecognition {
  start: () => void
  stop: () => void
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (event: any) => void
  onend: () => void
  onerror: (event: any) => void
}

declare global {
  interface Window {
    SpeechRecognition: new() => VoiceRecognition
    webkitSpeechRecognition: new() => VoiceRecognition
  }
}

export default function AddPatientPage() {
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState({
    // Contact & Basic Info (Mandatory)
    countryCode: 'US',
    mobileNumber: '',
    email: '',
    
    // Patient Info
    patientName: '',
    dateOfBirth: '',
    gender: '',
    patientId: '',
    address: '',
    
    // Physical Info
    heightCm: '',
    weightKg: '',
    
    // Medical Info
    comorbidities: '',
    allergies: '',
    
    // Treatment Plan (Mandatory)
    symptoms: [] as string[],
    diagnosis: [] as string[],
    treatment: '',
    clinicalNotes: '',
    condition: '',
    severity: ''
  })

  // UI state
  const [existingPatient, setExistingPatient] = useState<any>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<VoiceRecognition | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [symptomsSearch, setSymptomsSearch] = useState('')
  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const [isPatientIdEditable, setIsPatientIdEditable] = useState(false)

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const rec = new SpeechRecognition()
        rec.continuous = true
        rec.interimResults = true
        rec.lang = formData.clinicalNotes.includes('हिंदी') ? 'hi-IN' : 'en-US'
        
        rec.onresult = (event) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          
          setFormData(prev => ({
            ...prev,
            clinicalNotes: prev.clinicalNotes + transcript
          }))
        }
        
        rec.onend = () => {
          setIsRecording(false)
        }
        
        rec.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
        }
        
        setRecognition(rec)
      }
    }
  }, [])

  // Auto-generate patient ID when page loads
  useEffect(() => {
    if (!formData.patientId) {
      const doctorName = 'Dr. John Doe' // Replace with actual doctor name from context
      generatePatientId(doctorName)
    }
  }, [])

  const generatePatientId = (doctorName: string) => {
    const namePrefix = doctorName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3)
      .padEnd(3, 'X')

    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const sequence = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
    
    const patientId = `${namePrefix}/${year}${month}/${sequence}`
    setFormData(prev => ({ ...prev, patientId }))
  }

  const generateRandomMobile = async () => {
    // Generate random mobile number that doesn't exist in database
    const country = COUNTRY_CODES.find(c => c.code === formData.countryCode)
    if (!country) return

    let randomNumber = ''
    
    // Generate based on country format
    switch (formData.countryCode) {
      case 'US':
      case 'CA':
        const areaCode = '555' // Safe test area code
        const exchange = Math.floor(Math.random() * 900) + 100
        const number = Math.floor(Math.random() * 9000) + 1000
        randomNumber = `(${areaCode}) ${exchange}-${number}`
        break
      case 'IN':
        const firstDigit = Math.floor(Math.random() * 4) + 6 // 6-9
        const remaining = Math.floor(Math.random() * 999999999).toString().padStart(9, '0')
        randomNumber = `${firstDigit}${remaining.substring(0, 4)} ${remaining.substring(4)}`
        break
      default:
        for (let i = 0; i < country.digits; i++) {
          randomNumber += Math.floor(Math.random() * 10)
        }
    }

    setFormData(prev => ({ ...prev, mobileNumber: randomNumber }))
    
    // Clear existing patient data since this is a new number
    setExistingPatient(null)
  }

  const handleMobileChange = async (value: string) => {
    setFormData(prev => ({ ...prev, mobileNumber: value }))
    
    // Search for existing patient after user stops typing
    if (value.length >= 8) {
      // Debounce the search
      setTimeout(async () => {
        await searchPatientByMobile(value)
      }, 500)
    } else {
      setExistingPatient(null)
    }
  }

  const searchPatientByMobile = async (mobile: string) => {
    try {
      // Mock API call - replace with actual API
      // const response = await fetch(`/api/patients/search-by-phone`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ phoneNumber: mobile, countryCode: formData.countryCode })
      // })
      
      // Mock existing patient for demo
      if (mobile.includes('555-1234')) {
        const mockPatient = {
          id: '1',
          patientId: 'JND/202507/000001',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@email.com',
          dateOfBirth: '1985-06-15',
          gender: 'MALE'
        }
        setExistingPatient(mockPatient)
        
        // Pre-fill form with existing patient data
        setFormData(prev => ({
          ...prev,
          patientName: `${mockPatient.firstName} ${mockPatient.lastName}`,
          email: mockPatient.email,
          gender: mockPatient.gender,
          patientId: mockPatient.patientId
        }))
      } else {
        setExistingPatient(null)
      }
    } catch (error) {
      console.error('Error searching patient:', error)
    }
  }

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, patientName: value }))
  }

  const handleDateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: value
    }))
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    handleDateChange(value)
  }

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }))
    
    // Auto-suggest diagnoses based on symptoms
    if (!formData.symptoms.includes(symptom)) {
      suggestDiagnoses([...formData.symptoms, symptom])
    }
  }

  const handleDiagnosisToggle = (diagnosis: string) => {
    setFormData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis.includes(diagnosis)
        ? prev.diagnosis.filter(d => d !== diagnosis)
        : [...prev.diagnosis, diagnosis]
    }))
  }

  const addCustomSymptom = (customSymptom: string) => {
    if (customSymptom && !formData.symptoms.includes(customSymptom)) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, customSymptom]
      }))
      setSymptomsSearch('')
    }
  }

  const addCustomDiagnosis = (customDiagnosis: string) => {
    if (customDiagnosis && !formData.diagnosis.includes(customDiagnosis)) {
      setFormData(prev => ({
        ...prev,
        diagnosis: [...prev.diagnosis, customDiagnosis]
      }))
      setDiagnosisSearch('')
    }
  }

  const suggestDiagnoses = (symptoms: string[]) => {
    // Mock logic to suggest diagnoses based on symptoms
    // In real implementation, this would use the symptoms-diagnosis database
  }

  const startVoiceRecording = () => {
    if (recognition && !isRecording) {
      recognition.start()
      setIsRecording(true)
    }
  }

  const stopVoiceRecording = () => {
    if (recognition && isRecording) {
      recognition.stop()
      setIsRecording(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    // Mandatory fields
    if (!formData.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required'
    }
    
    if (!formData.patientName) {
      newErrors.patientName = 'Patient name is required'
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    }
    
    if (formData.symptoms.length === 0) {
      newErrors.symptoms = 'At least one symptom is required'
    }
    
    if (formData.diagnosis.length === 0) {
      newErrors.diagnosis = 'At least one diagnosis is required'
    }
    
    if (!formData.treatment) {
      newErrors.treatment = 'Treatment selection is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Process date of birth - if only day/month provided, use current year minus 25
      let processedDateOfBirth = formData.dateOfBirth
      if (formData.dateOfBirth && !formData.dateOfBirth.includes('-')) {
        // Handle partial date input if needed
        const currentYear = new Date().getFullYear()
        processedDateOfBirth = `${currentYear - 25}-01-01`
      } else if (!formData.dateOfBirth) {
        // Default to 25 years ago if no date provided
        const currentYear = new Date().getFullYear()
        processedDateOfBirth = `${currentYear - 25}-01-01`
      }
      
      // Split patient name into components
      const nameParts = formData.patientName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts[nameParts.length - 1] || ''
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : nameParts[1] || ''
      
      const patientData = {
        // User fields (snake_case for backend)
        first_name: firstName,
        middle_name: middleName || '',
        last_name: lastName,
        email: formData.email || '',
        mobile_number: formData.mobileNumber,
        gender: formData.gender,
        date_of_birth: processedDateOfBirth,
        street: formData.address || '',
        city: '',
        state: '',
        country: formData.countryCode || 'US',
        
        // Patient-specific fields
        patient_id: formData.patientId.trim() || null, // Include custom patient ID
        height_cm: parseFloat(formData.heightCm) || null,
        weight_kg: parseFloat(formData.weightKg) || null,
        allergies: formData.allergies || [],
        chronic_conditions: formData.comorbidities || [],
        emergency_contact: null,
        insurance_info: null,
        
        // Additional clinical data (for care plan creation)
        symptoms: formData.symptoms,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        clinical_notes: formData.clinicalNotes,
        condition: formData.condition,
        severity: formData.severity
      }
      
      console.log('Submitting patient data:', patientData)
      
      // Make actual API call
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Add auth token
        },
        body: JSON.stringify(patientData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.payload?.error?.message || 'Failed to create patient')
      }
      
      const result = await response.json()
      console.log('Patient created successfully:', result)
      
      // Show success message
      alert('Patient created successfully!')
      
      // Redirect to patient list
      router.push('/dashboard/doctor/patients')
      
    } catch (error) {
      console.error('Error creating patient:', error)
      alert(`Error creating patient: ${error.message || 'Please try again'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    // Save as draft functionality
    localStorage.setItem('patientDraft', JSON.stringify(formData))
    alert('Draft saved successfully!')
  }

  const filteredSymptoms = SYMPTOMS_OPTIONS.filter(symptom =>
    symptom.toLowerCase().includes(symptomsSearch.toLowerCase())
  )

  const filteredDiagnoses = DIAGNOSIS_OPTIONS.filter(diagnosis =>
    diagnosis.toLowerCase().includes(diagnosisSearch.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Patient</h1>
          <p className="text-gray-600 mt-1">Create a comprehensive patient record and care plan</p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Save Draft
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneIcon className="h-5 w-5" />
              Contact Information
              <span className="text-red-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  {COUNTRY_CODES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.dialCode} {country.name}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="Enter mobile number"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={generateRandomMobile}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
                  title="Generate random mobile number for patients without phones"
                >
                  Generate Random
                </button>
              </div>
              {errors.mobileNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>
              )}
            </div>

            {/* Patient Status */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                {existingPatient ? (
                  <span className="text-blue-600">
                    Existing Patient: {existingPatient.firstName} {existingPatient.lastName} (ID: {existingPatient.patientId})
                  </span>
                ) : (
                  <span className="text-green-600">Adding New Patient</span>
                )}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="patient@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="First Middle Last Name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Will be automatically split into first, middle, and last name
              </p>
              {errors.patientName && (
                <p className="text-red-500 text-sm mt-1">{errors.patientName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formatDateForInput(formData.dateOfBirth)}
                  onChange={handleDateInput}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <CalendarDaysIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select date using the calendar widget or enter manually
              </p>
              {errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <div className="flex gap-4">
                {['MALE', 'FEMALE', 'OTHER'].map(gender => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender }))}
                    className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                      formData.gender === gender
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {gender.charAt(0) + gender.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient ID */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Patient ID
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editPatientId"
                    checked={isPatientIdEditable}
                    onChange={(e) => {
                      setIsPatientIdEditable(e.target.checked)
                      // If enabling editing and no ID exists, generate one first
                      if (e.target.checked && !formData.patientId) {
                        const doctorName = 'Dr. John Doe'
                        generatePatientId(doctorName)
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editPatientId" className="text-sm text-gray-600 cursor-pointer">
                    {isPatientIdEditable ? '🔓 Editing enabled' : '🔒 Allow editing'}
                  </label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
                  readOnly={!isPatientIdEditable}
                  placeholder={isPatientIdEditable ? "Enter custom patient ID" : "Auto-generated patient ID"}
                  className={`flex-1 border rounded-lg px-3 py-2 transition-all duration-200 ${
                    isPatientIdEditable 
                      ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm' 
                      : 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed'
                  }`}
                />
                {!isPatientIdEditable && (
                  <button
                    type="button"
                    onClick={() => {
                      const doctorName = 'Dr. John Doe' // Replace with actual doctor name from context
                      generatePatientId(doctorName)
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 whitespace-nowrap"
                    title="Regenerate auto ID"
                  >
                    Regenerate
                  </button>
                )}
              </div>
              
              <div className="flex items-start gap-2 mt-1">
                <div className="flex-1">
                  <p className={`text-xs transition-colors duration-200 ${
                    isPatientIdEditable ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {isPatientIdEditable 
                      ? "✏️ Custom format: supports numbers (123456), alphanumeric (PAT001), or structured (ABC/202501/000001)"
                      : "🔄 Auto-generated format: Doctor Initials/YYYYMM/NNNNNN (check 'Allow editing' to customize)"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Physical Measurements */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) => setFormData(prev => ({ ...prev, heightCm: e.target.value }))}
                  placeholder="170"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weightKg}
                  onChange={(e) => setFormData(prev => ({ ...prev, weightKg: e.target.value }))}
                  placeholder="70"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BeakerIcon className="h-5 w-5" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comorbidities</label>
              <textarea
                value={formData.comorbidities}
                onChange={(e) => setFormData(prev => ({ ...prev, comorbidities: e.target.value }))}
                placeholder="List any existing medical conditions"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                placeholder="List any known allergies"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Treatment Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="h-5 w-5" />
              Treatment Plan
              <span className="text-red-500">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symptoms <span className="text-red-500">*</span>
              </label>
              
              {/* Custom symptom input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={symptomsSearch}
                  onChange={(e) => setSymptomsSearch(e.target.value)}
                  placeholder="Search or add new symptom"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => addCustomSymptom(symptomsSearch)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              {/* Selected symptoms */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.symptoms.map(symptom => (
                  <span
                    key={symptom}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => handleSymptomToggle(symptom)}
                      className="hover:bg-blue-200 rounded-full p-1"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              {/* Available symptoms */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {filteredSymptoms.map(symptom => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => handleSymptomToggle(symptom)}
                    className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                      formData.symptoms.includes(symptom)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
              {errors.symptoms && (
                <p className="text-red-500 text-sm mt-1">{errors.symptoms}</p>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnosis <span className="text-red-500">*</span>
              </label>
              
              {/* Custom diagnosis input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={diagnosisSearch}
                  onChange={(e) => setDiagnosisSearch(e.target.value)}
                  placeholder="Search or add new diagnosis"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => addCustomDiagnosis(diagnosisSearch)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              {/* Selected diagnoses */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.diagnosis.map(diagnosis => (
                  <span
                    key={diagnosis}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {diagnosis}
                    <button
                      type="button"
                      onClick={() => handleDiagnosisToggle(diagnosis)}
                      className="hover:bg-green-200 rounded-full p-1"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              {/* Available diagnoses */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredDiagnoses.map(diagnosis => (
                  <button
                    key={diagnosis}
                    type="button"
                    onClick={() => handleDiagnosisToggle(diagnosis)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                      formData.diagnosis.includes(diagnosis)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {diagnosis}
                  </button>
                ))}
              </div>
              {errors.diagnosis && (
                <p className="text-red-500 text-sm mt-1">{errors.diagnosis}</p>
              )}
            </div>

            {/* Treatment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treatment <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.treatment}
                onChange={(e) => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select treatment</option>
                {TREATMENT_OPTIONS.map(treatment => (
                  <option key={treatment} value={treatment}>{treatment}</option>
                ))}
              </select>
              {errors.treatment && (
                <p className="text-red-500 text-sm mt-1">{errors.treatment}</p>
              )}
            </div>

            {/* Clinical Notes with Voice-to-Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinical Notes
              </label>
              <div className="relative">
                <textarea
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                  placeholder="Enter clinical notes... (Supports Hindi and English voice input)"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`absolute right-2 top-2 p-2 rounded-lg ${
                    isRecording 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice recording'}
                >
                  {isRecording ? (
                    <StopIcon className="h-4 w-4" />
                  ) : (
                    <MicrophoneIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click the microphone to record voice notes in Hindi or English
              </p>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value, treatment: '' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select condition</option>
                {CONDITIONS_OPTIONS.map(condition => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecting a condition will reset treatment selection
              </p>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <div className="flex gap-4">
                {['Mild', 'Moderate', 'Severe'].map(severity => (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, severity }))}
                    className={`px-6 py-3 rounded-lg border-2 transition-colors ${
                      formData.severity === severity
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Patient...' : 'Create Patient'}
          </button>
        </div>
      </form>
    </div>
  )
}