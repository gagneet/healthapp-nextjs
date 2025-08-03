'use client'

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  XMarkIcon,
  DocumentTextIcon,
  DownloadIcon,
  PrinterIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import { formatDate } from '@/lib/utils'

interface PrescriptionGeneratorProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  patient: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
    medical_record_number: string
    address?: string
    phone?: string
  }
  doctor: {
    id: string
    first_name: string
    last_name: string
    specialty: string
    license_number: string
    npi: string
    clinic_name: string
    clinic_address: string
    phone: string
  }
  medications?: Array<{
    id: string
    name: string
    strength: string
    dosage_form: string
    quantity: string
    directions: string
    refills: number
    generic_substitution: boolean
  }>
}

interface PrescriptionData {
  patient_name: string
  patient_dob: string
  patient_address: string
  patient_mrn: string
  doctor_name: string
  doctor_specialty: string
  doctor_license: string
  doctor_npi: string
  clinic_name: string
  clinic_address: string
  clinic_phone: string
  medications: Array<{
    name: string
    strength: string
    dosage_form: string
    quantity: string
    directions: string
    refills: number
    generic_substitution: boolean
  }>
  prescription_date: string
  prescription_id: string
}

export default function PrescriptionGenerator({
  isOpen,
  setIsOpen,
  patient,
  doctor,
  medications = []
}: PrescriptionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [generatedPdf, setGeneratedPdf] = useState<string | null>(null)

  const generatePrescriptionData = (): PrescriptionData => {
    return {
      patient_name: `${patient.first_name} ${patient.last_name}`,
      patient_dob: formatDate(patient.date_of_birth),
      patient_address: patient.address || 'Address not provided',
      patient_mrn: patient.medical_record_number,
      doctor_name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      doctor_specialty: doctor.specialty,
      doctor_license: doctor.license_number,
      doctor_npi: doctor.npi,
      clinic_name: doctor.clinic_name,
      clinic_address: doctor.clinic_address,
      clinic_phone: doctor.phone,
      medications,
      prescription_date: formatDate(new Date().toISOString()),
      prescription_id: `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      const prescriptionData = generatePrescriptionData()
      
      // In a real implementation, you would use a PDF generation library like:
      // - jsPDF
      // - Puppeteer for server-side generation
      // - PDFKit
      // - react-pdf
      
      // For this example, we'll simulate the PDF generation
      const response = await fetch('/api/prescriptions/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prescriptionData),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const pdfUrl = URL.createObjectURL(blob)
      setGeneratedPdf(pdfUrl)

      // Automatically upload to cloud storage
      await uploadToCloud(blob, prescriptionData.prescription_id)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate prescription PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const uploadToCloud = async (pdfBlob: Blob, prescriptionId: string) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('pdf', pdfBlob, `prescription-${prescriptionId}.pdf`)
      formData.append('patient_id', patient.id)
      formData.append('doctor_id', doctor.id)
      formData.append('prescription_id', prescriptionId)

      const response = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload to cloud storage')
      }

      const uploadResult = await response.json()
      console.log('PDF uploaded successfully:', uploadResult.url)
      
      // Show success message
      alert('Prescription generated and automatically saved to cloud storage!')
      
    } catch (error) {
      console.error('Error uploading to cloud:', error)
      alert('PDF generated successfully, but failed to upload to cloud storage.')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadPDF = () => {
    if (generatedPdf) {
      const link = document.createElement('a')
      link.href = generatedPdf
      link.download = `prescription-${patient.last_name}-${formatDate(new Date().toISOString())}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const printPDF = () => {
    if (generatedPdf) {
      const printWindow = window.open(generatedPdf)
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    }
  }

  // Mock PDF preview component
  const PDFPreview = () => (
    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{doctor.clinic_name}</h2>
        <p className="text-sm text-gray-600">{doctor.clinic_address}</p>
        <p className="text-sm text-gray-600">Phone: {doctor.phone}</p>
      </div>
      
      <div className="border-t border-b border-gray-200 py-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">PRESCRIPTION</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Patient:</strong> {patient.first_name} {patient.last_name}</p>
            <p><strong>DOB:</strong> {formatDate(patient.date_of_birth)}</p>
            <p><strong>MRN:</strong> {patient.medical_record_number}</p>
          </div>
          <div>
            <p><strong>Doctor:</strong> Dr. {doctor.first_name} {doctor.last_name}</p>
            <p><strong>Specialty:</strong> {doctor.specialty}</p>
            <p><strong>License:</strong> {doctor.license_number}</p>
            <p><strong>NPI:</strong> {doctor.npi}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Medications:</h4>
        {medications.length === 0 ? (
          <p className="text-gray-500 italic">No medications added</p>
        ) : (
          <div className="space-y-3">
            {medications.map((med, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <p className="font-medium">
                  {med.name} {med.strength} ({med.dosage_form})
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Quantity:</strong> {med.quantity}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Directions:</strong> {med.directions}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Refills:</strong> {med.refills} | 
                  <strong> Generic substitution:</strong> {med.generic_substitution ? 'Allowed' : 'Not allowed'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-gray-600">Date: {formatDate(new Date().toISOString())}</p>
          </div>
          <div className="text-right">
            <div className="border-t border-gray-400 w-48 mt-8 pt-2">
              <p className="text-sm text-gray-600">Doctor Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Generate Prescription
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Generate a prescription PDF for {patient.first_name} {patient.last_name}. The prescription will be automatically uploaded to secure cloud storage.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PDF Preview */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Prescription Preview</h4>
                  <div className="max-h-96 overflow-y-auto">
                    <PDFPreview />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
                  {!generatedPdf ? (
                    <button
                      type="button"
                      disabled={isGenerating || medications.length === 0}
                      onClick={generatePDF}
                      className="inline-flex w-full justify-center items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed sm:w-auto"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          Generate PDF
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={downloadPDF}
                        className="inline-flex w-full justify-center items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:w-auto"
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={printPDF}
                        className="inline-flex w-full justify-center items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 sm:w-auto"
                      >
                        <PrinterIcon className="h-4 w-4 mr-2" />
                        Print
                      </button>
                    </>
                  )}
                  
                  {isUploading && (
                    <div className="inline-flex w-full justify-center items-center rounded-md bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 sm:w-auto">
                      <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                      Uploading to Cloud...
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
                  >
                    Close
                  </button>
                </div>

                {medications.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> No medications have been added to this prescription. Please add medications before generating the PDF.
                    </p>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}