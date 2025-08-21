/**
 * Privacy Policy Page - Healthcare Management Platform
 */

import React from 'react'

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy describes how the Healthcare Management Platform ("we," "our," or "us") 
              collects, uses, and protects your personal information when you use our healthcare management 
              services. We are committed to protecting your privacy and ensuring the security of your 
              personal health information (PHI) in compliance with HIPAA and other applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Health Information (PHI)</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Medical records and health history</li>
                  <li>Diagnostic information and test results</li>
                  <li>Prescription and medication information</li>
                  <li>Treatment plans and care notes</li>
                  <li>Vital signs and health measurements</li>
                  <li>Insurance information</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Name, address, phone number, and email</li>
                  <li>Date of birth and demographic information</li>
                  <li>Emergency contact information</li>
                  <li>Account credentials and login information</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Usage patterns and system logs</li>
                  <li>Cookies and tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthcare Operations</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Providing medical care and treatment coordination</li>
                  <li>Managing appointments and care plans</li>
                  <li>Medication tracking and adherence monitoring</li>
                  <li>Communication between healthcare providers</li>
                  <li>Quality improvement and care optimization</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrative Purposes</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Account management and user authentication</li>
                  <li>Billing and insurance processing</li>
                  <li>Legal compliance and regulatory requirements</li>
                  <li>System maintenance and security</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We may share your information only as permitted or required by law:
              </p>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authorized Healthcare Providers</h3>
                <p className="text-gray-700">
                  With your healthcare team members who need access to provide or coordinate your care.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Associates</h3>
                <p className="text-gray-700">
                  With third-party service providers who assist in healthcare operations, 
                  subject to HIPAA-compliant agreements.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                <p className="text-gray-700">
                  When required by law, court order, or for public health activities, 
                  law enforcement, or emergency situations.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We implement comprehensive security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>End-to-end encryption for data transmission and storage</li>
                <li>Multi-factor authentication and access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on privacy and security practices</li>
                <li>Secure data centers with 24/7 monitoring</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <div className="space-y-4">
              <p className="text-gray-700">Under HIPAA and other applicable laws, you have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Access:</strong> Request copies of your medical records and health information</li>
                <li><strong>Amendment:</strong> Request corrections to inaccurate information</li>
                <li><strong>Restriction:</strong> Request limits on how your information is used or shared</li>
                <li><strong>Confidential Communication:</strong> Request alternative methods of communication</li>
                <li><strong>Breach Notification:</strong> Be notified of any data breaches</li>
                <li><strong>Complaint:</strong> File complaints about privacy practices</li>
                <li><strong>Portability:</strong> Obtain your data in a portable format</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your health information as required by law and professional standards. 
              Generally, medical records are retained for at least 7 years after your last 
              interaction with our services, or longer if required by applicable laws or for 
              minors until they reach the age of majority plus the retention period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Maintain your login session and preferences</li>
              <li>Improve system performance and user experience</li>
              <li>Analyze usage patterns for quality improvement</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform may integrate with third-party services (e.g., laboratory systems, 
              pharmacy networks, insurance providers). These integrations are governed by 
              HIPAA-compliant agreements, and we ensure that any shared information is limited 
              to what's necessary for the specific healthcare function.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your health information is stored and processed within the United States. 
              If we need to transfer data internationally for any legitimate healthcare purpose, 
              we will ensure appropriate safeguards and obtain necessary consents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy periodically to reflect changes in our practices 
              or applicable laws. We will notify you of material changes by posting the updated 
              policy on our platform and, where required, obtaining your consent. The effective 
              date at the top of this policy indicates when it was last updated.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or want to exercise your rights, 
                please contact our Privacy Officer:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Privacy Officer</strong></p>
                <p>Healthcare Management Platform</p>
                <p>Email: privacy@healthcareplatform.com</p>
                <p>Phone: 1-800-PRIVACY (1-800-774-8229)</p>
                <p>Address: [Company Address]</p>
              </div>
              <p className="text-gray-700 mt-4">
                You also have the right to file a complaint with the Department of Health 
                and Human Services if you believe your privacy rights have been violated.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Emergency Situations</h2>
            <p className="text-gray-700 leading-relaxed">
              In emergency situations where your life or health may be in danger, we may 
              share necessary information with emergency responders, hospitals, or other 
              healthcare providers without your prior authorization to ensure you receive 
              appropriate emergency care.
            </p>
          </section>

          <div className="bg-blue-50 p-6 rounded-lg mt-12">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Notice of Privacy Practices
            </h3>
            <p className="text-blue-800">
              This Privacy Policy serves as our Notice of Privacy Practices as required by HIPAA. 
              By using our services, you acknowledge that you have received this notice and 
              understand your rights regarding your health information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}