// src/utils/helpers.js
import crypto from 'crypto';
import moment from 'moment';

class Helpers {
  static generateUID(prefix = 'USR', length = 6) {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.random().toString(36).substring(2, length - 2).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  static calculateAge(birthDate: string | Date): number {
    return moment().diff(moment(birthDate), 'years');
  }

  static formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
    return moment(date).format(format);
  }

  static generateHash(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  static maskSensitiveData(data: Record<string, any>, fields: string[] = ['password', 'ssn', 'card_number']): Record<string, any> {
    const masked = { ...data };
    fields.forEach(field => {
      if (masked[field]) {
        masked[field] = '*'.repeat(masked[field].length);
      }
    });
    return masked;
  }

  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static generateScheduleTimes(repeatType: string, startDate: string | Date, endDate: string | Date): Date[] {
    const times: Date[] = [];
    const start = moment(startDate);
    const end = moment(endDate);

    while (start.isSameOrBefore(end)) {
      times.push(start.toDate());
      
      switch (repeatType) {
        case 'daily':
          start.add(1, 'day');
          break;
        case 'weekly':
          start.add(1, 'week');
          break;
        case 'monthly':
          start.add(1, 'month');
          break;
        default:
          start.add(1, 'day');
      }
    }

    return times;
  }
}

export default Helpers;
