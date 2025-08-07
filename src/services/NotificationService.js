// src/services/NotificationService.js - Generic SMS/Email Notification Service
import axios from 'axios';
import nodemailer from 'nodemailer';

class NotificationService {
  constructor() {
    this.smsProvider = process.env.SMS_PROVIDER || 'mock';
    this.emailProvider = process.env.EMAIL_PROVIDER || 'mock';
    this.smsBazarConfig = {
      apiUrl: process.env.SMS_BAZAR_API_URL || 'http://api.smsbazar.in/sms/1/text/query',
      username: process.env.SMS_BAZAR_USERNAME || '',
      password: process.env.SMS_BAZAR_PASSWORD || '',
      from: process.env.SMS_BAZAR_FROM || 'HealthApp'
    };
    this.emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    };
  }

  /**
   * Send OTP via SMS
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} otp - OTP code
   * @param {string} patientName - Patient name for personalization
   * @param {string} doctorName - Doctor name for context
   * @returns {Promise<Object>} - Result with success status and details
   */
  async sendSmsOtp(phoneNumber, otp, patientName = '', doctorName = '') {
    try {
      const message = this.generateSmsOtpMessage(otp, patientName, doctorName);
      
      switch (this.smsProvider) {
        case 'smsbazar':
          return await this.sendSmsBazarSms(phoneNumber, message);
        case 'mock':
        default:
          return await this.sendMockSms(phoneNumber, message);
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      return {
        success: false,
        error: error.message,
        provider: this.smsProvider
      };
    }
  }

  /**
   * Send OTP via Email
   * @param {string} email - Recipient email address
   * @param {string} otp - OTP code
   * @param {string} patientName - Patient name for personalization
   * @param {string} doctorName - Doctor name for context
   * @returns {Promise<Object>} - Result with success status and details
   */
  async sendEmailOtp(email, otp, patientName = '', doctorName = '') {
    try {
      const { subject, htmlContent, textContent } = this.generateEmailOtpContent(otp, patientName, doctorName);
      
      switch (this.emailProvider) {
        case 'nodemailer':
          return await this.sendNodemailerEmail(email, subject, htmlContent, textContent);
        case 'mock':
        default:
          return await this.sendMockEmail(email, subject, htmlContent);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message,
        provider: this.emailProvider
      };
    }
  }

  /**
   * Send both SMS and Email OTP
   * @param {string} phoneNumber - Phone number
   * @param {string} email - Email address
   * @param {string} otp - OTP code
   * @param {string} patientName - Patient name
   * @param {string} doctorName - Doctor name
   * @returns {Promise<Object>} - Combined result
   */
  async sendBothOtp(phoneNumber, email, otp, patientName = '', doctorName = '') {
    const results = await Promise.allSettled([
      phoneNumber ? this.sendSmsOtp(phoneNumber, otp, patientName, doctorName) : Promise.resolve({ success: true, skipped: true, reason: 'no_phone' }),
      email ? this.sendEmailOtp(email, otp, patientName, doctorName) : Promise.resolve({ success: true, skipped: true, reason: 'no_email' })
    ]);

    const smsResult = results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason };
    const emailResult = results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason };

    return {
      sms: smsResult,
      email: emailResult,
      overall_success: (smsResult.success || smsResult.skipped) && (emailResult.success || emailResult.skipped)
    };
  }

  // ===== SMS PROVIDERS =====

  /**
   * Send SMS via SMS Bazar (India)
   */
  async sendSmsBazarSms(phoneNumber, message) {
    try {
      const response = await axios.post(this.smsBazarConfig.apiUrl, null, {
        params: {
          username: this.smsBazarConfig.username,
          password: this.smsBazarConfig.password,
          from: this.smsBazarConfig.from,
          to: phoneNumber,
          text: message
        },
        timeout: 10000 // 10 second timeout
      });

      return {
        success: true,
        provider: 'smsbazar',
        response_data: response.data,
        message_id: response.data?.messageId || null,
        sent_at: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        provider: 'smsbazar',
        error: error.response?.data?.message || error.message,
        error_code: error.response?.status || 'NETWORK_ERROR'
      };
    }
  }

  /**
   * Mock SMS sending for testing
   */
  async sendMockSms(phoneNumber, message) {
    console.log(`[MOCK SMS] To: ${phoneNumber}, Message: ${message}`);
    
    return {
      success: true,
      provider: 'mock',
      message_id: `mock_sms_${Date.now()}`,
      sent_at: new Date().toISOString(),
      mock: true
    };
  }

  // ===== EMAIL PROVIDERS =====

  /**
   * Send Email via Nodemailer
   */
  async sendNodemailerEmail(email, subject, htmlContent, textContent) {
    try {
      const transporter = nodemailer.createTransporter(this.emailConfig);
      
      const mailOptions = {
        from: `"HealthApp" <${this.emailConfig.auth.user}>`,
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);

      return {
        success: true,
        provider: 'nodemailer',
        message_id: result.messageId,
        sent_at: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        provider: 'nodemailer',
        error: error.message,
        error_code: error.code || 'EMAIL_SEND_ERROR'
      };
    }
  }

  /**
   * Mock Email sending for testing
   */
  async sendMockEmail(email, subject, htmlContent) {
    console.log(`[MOCK EMAIL] To: ${email}, Subject: ${subject}`);
    console.log(`[MOCK EMAIL] Content: ${htmlContent.substring(0, 200)}...`);
    
    return {
      success: true,
      provider: 'mock',
      message_id: `mock_email_${Date.now()}`,
      sent_at: new Date().toISOString(),
      mock: true
    };
  }

  // ===== MESSAGE TEMPLATES =====

  /**
   * Generate SMS OTP message using healthcare best practices
   */
  generateSmsOtpMessage(otp, patientName, doctorName) {
    const templates = [
      // Template for patient name and doctor name
      `[HealthApp] Your healthcare consent OTP is ${otp}. Dr. ${doctorName} has requested access to your medical records. This OTP expires in 5 minutes. Do not share this OTP with anyone else.`,
      
      // Template with only doctor name
      `[HealthApp] Healthcare Consent OTP: ${otp}. Dr. ${doctorName} is requesting access to your medical records. Valid for 5 minutes. Keep this OTP confidential.`,
      
      // Generic template
      `[HealthApp] Your medical consent OTP is ${otp}. A healthcare provider is requesting access to your medical records. This code expires in 5 minutes. Do not share this OTP.`
    ];

    if (patientName && doctorName) {
      return templates[0];
    } else if (doctorName) {
      return templates[1];
    } else {
      return templates[2];
    }
  }

  /**
   * Generate Email OTP content using healthcare best practices
   */
  generateEmailOtpContent(otp, patientName, doctorName) {
    const subject = 'Healthcare Consent Verification - Your OTP Code';
    
    const patientGreeting = patientName ? `Dear ${patientName},` : 'Dear Patient,';
    const doctorContext = doctorName ? `Dr. ${doctorName}` : 'A healthcare provider';

    const textContent = `
${patientGreeting}

${doctorContext} has requested access to your medical records for your continued care.

Your One-Time Password (OTP) for consent verification is: ${otp}

This OTP is valid for 5 minutes only.

IMPORTANT SECURITY NOTICE:
- Do not share this OTP with anyone other than your healthcare provider
- This OTP is only for medical record access consent
- If you did not expect this request, please contact your healthcare provider immediately

For your privacy and security, this access requires your explicit consent.

Thank you for trusting us with your healthcare.

Best regards,
HealthApp Security Team

---
This is an automated message. Please do not reply to this email.
If you have questions, contact your healthcare provider directly.
    `;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Healthcare Consent OTP</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c5aa0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .otp-box { background-color: #e8f4fd; border: 2px solid #2c5aa0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #2c5aa0; letter-spacing: 4px; }
        .security-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .security-notice h4 { color: #856404; margin-top: 0; }
        .footer { background-color: #f8f9fa; padding: 15px; font-size: 12px; color: #666; text-align: center; border-radius: 0 0 8px 8px; }
        .footer a { color: #2c5aa0; text-decoration: none; }
        .validity { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🏥 HealthApp - Medical Consent Verification</h2>
    </div>
    
    <div class="content">
        <h3>${patientGreeting}</h3>
        
        <p><strong>${doctorContext}</strong> has requested access to your medical records for your continued healthcare.</p>
        
        <div class="otp-box">
            <h4>Your Consent OTP Code:</h4>
            <div class="otp-code">${otp}</div>
            <p class="validity">⏰ Valid for 5 minutes only</p>
        </div>
        
        <div class="security-notice">
            <h4>🔒 Important Security Notice:</h4>
            <ul>
                <li><strong>Keep this OTP confidential</strong> - Only share with your healthcare provider</li>
                <li><strong>Limited use</strong> - This OTP is only for medical record access consent</li>
                <li><strong>Contact your provider</strong> if you didn't expect this request</li>
                <li><strong>Time-sensitive</strong> - This code expires in 5 minutes</li>
            </ul>
        </div>
        
        <p>For your privacy and security, accessing your medical records requires your explicit consent through this verification process.</p>
        
        <p>Thank you for trusting us with your healthcare information.</p>
        
        <p><strong>Best regards,</strong><br>
        HealthApp Security Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated security message. Please do not reply to this email.</p>
        <p>If you have questions about your medical care, contact your healthcare provider directly.</p>
        <p>© 2025 HealthApp. Your privacy and security are our priority.</p>
    </div>
</body>
</html>
    `;

    return {
      subject,
      textContent: textContent.trim(),
      htmlContent
    };
  }

  // ===== UTILITY METHODS =====

  /**
   * Test connection to SMS provider
   */
  async testSmsConnection() {
    try {
      switch (this.smsProvider) {
        case 'smsbazar':
          // Test with a dummy request (you might want to implement a specific test endpoint)
          return { success: true, provider: 'smsbazar', message: 'SMS Bazar configuration loaded' };
        case 'mock':
        default:
          return { success: true, provider: 'mock', message: 'Mock SMS provider ready' };
      }
    } catch (error) {
      return { success: false, provider: this.smsProvider, error: error.message };
    }
  }

  /**
   * Test connection to Email provider
   */
  async testEmailConnection() {
    try {
      switch (this.emailProvider) {
        case 'nodemailer':
          const transporter = nodemailer.createTransporter(this.emailConfig);
          await transporter.verify();
          return { success: true, provider: 'nodemailer', message: 'Email connection verified' };
        case 'mock':
        default:
          return { success: true, provider: 'mock', message: 'Mock email provider ready' };
      }
    } catch (error) {
      return { success: false, provider: this.emailProvider, error: error.message };
    }
  }

  /**
   * Get current provider configuration
   */
  getProviderConfig() {
    return {
      sms_provider: this.smsProvider,
      email_provider: this.emailProvider,
      sms_configured: this.smsProvider !== 'mock' && !!this.smsBazarConfig.username,
      email_configured: this.emailProvider !== 'mock' && !!this.emailConfig.auth.user
    };
  }
}

export default new NotificationService();