// src/services/NotificationService.ts - Generic SMS/Email Notification Service

class NotificationService {
  constructor() {
    // Mock service for now
  }

  /**
   * Send OTP via both SMS and Email
   */
  async sendBothOtp(phone: string, email: string, otpCode: string, patientName: string, doctorName: string) {
    // Mock implementation
    return {
      sms: {
        success: true,
        error: null
      },
      email: {
        success: true,
        error: null
      },
      overall_success: true
    };
  }

  /**
   * Send SMS using configured provider
   */
  async sendSms(to: string, message: string, options: any = {}) {
    // Mock implementation
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock',
      cost: 0,
      message: 'SMS sent successfully (mock)'
    };
  }

  /**
   * Send Email using configured provider
   */
  async sendEmail(to: string, subject: string, body: string, options: any = {}) {
    // Mock implementation
    return {
      success: true,
      messageId: `mock_email_${Date.now()}`,
      provider: 'mock',
      message: 'Email sent successfully (mock)'
    };
  }

  /**
   * Test SMS provider connection
   */
  async testSmsConnection() {
    return { success: true, provider: 'mock', message: 'Mock SMS provider ready' };
  }

  /**
   * Test Email provider connection
   */
  async testEmailConnection() {
    return { success: true, provider: 'mock', message: 'Mock email provider ready' };
  }

  /**
   * Get current provider configuration
   */
  getProviderConfig() {
    return {
      sms_provider: 'mock',
      email_provider: 'mock',
      sms_configured: false,
      email_configured: false
    };
  }
}

export default new NotificationService();