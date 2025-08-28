// src/utils/phoneValidation.js - Phone validation with country code support

// Country codes with phone number digit requirements
interface CountryCode {
  code: string;
  name: string;
  digits: number;
  format: string;
  placeholder: string;
}

export const COUNTRY_CODES: Record<string, CountryCode> = {
  US: {
    code: '+1',
    name: 'United States',
    digits: 10,
    format: '(XXX) XXX-XXXX',
    placeholder: '(555) 123-4567'
  },
  CA: {
    code: '+1',
    name: 'Canada',
    digits: 10,
    format: '(XXX) XXX-XXXX',
    placeholder: '(555) 123-4567'
  },
  IN: {
    code: '+91',
    name: 'India',
    digits: 10,
    format: 'XXXXX XXXXX',
    placeholder: '98765 43210'
  },
  GB: {
    code: '+44',
    name: 'United Kingdom',
    digits: 10,
    format: 'XXXX XXX XXXX',
    placeholder: '7911 123456'
  },
  AU: {
    code: '+61',
    name: 'Australia',
    digits: 9,
    format: 'XXX XXX XXX',
    placeholder: '412 345 678'
  },
  DE: {
    code: '+49',
    name: 'Germany',
    digits: 11,
    format: 'XXX XXXXXXXX',
    placeholder: '151 12345678'
  },
  FR: {
    code: '+33',
    name: 'France',
    digits: 10,
    format: 'X XX XX XX XX',
    placeholder: '6 12 34 56 78'
  },
  JP: {
    code: '+81',
    name: 'Japan',
    digits: 10,
    format: 'XXX-XXXX-XXXX',
    placeholder: '090-1234-5678'
  },
  BR: {
    code: '+55',
    name: 'Brazil',
    digits: 11,
    format: '(XX) XXXXX-XXXX',
    placeholder: '(11) 91234-5678'
  },
  MX: {
    code: '+52',
    name: 'Mexico',
    digits: 10,
    format: 'XXX XXX XXXX',
    placeholder: '55 1234 5678'
  },
  ZA: {
    code: '+27',
    name: 'South Africa',
    digits: 9,
    format: 'XX XXX XXXX',
    placeholder: '82 123 4567'
  },
  NG: {
    code: '+234',
    name: 'Nigeria',
    digits: 10,
    format: 'XXX XXX XXXX',
    placeholder: '802 123 4567'
  },
  KE: {
    code: '+254',
    name: 'Kenya',
    digits: 9,
    format: 'XXX XXXXXX',
    placeholder: '712 345678'
  },
  EG: {
    code: '+20',
    name: 'Egypt',
    digits: 10,
    format: 'XXX XXX XXXX',
    placeholder: '100 123 4567'
  },
  CN: {
    code: '+86',
    name: 'China',
    digits: 11,
    format: 'XXX XXXX XXXX',
    placeholder: '138 0013 8000'
  },
  SG: {
    code: '+65',
    name: 'Singapore',
    digits: 8,
    format: 'XXXX XXXX',
    placeholder: '9123 4567'
  },
  MY: {
    code: '+60',
    name: 'Malaysia',
    digits: 10,
    format: 'XX-XXX XXXX',
    placeholder: '12-345 6789'
  },
  TH: {
    code: '+66',
    name: 'Thailand',
    digits: 9,
    format: 'XX XXX XXXX',
    placeholder: '81 234 5678'
  },
  PH: {
    code: '+63',
    name: 'Philippines',
    digits: 10,
    format: 'XXX XXX XXXX',
    placeholder: '917 123 4567'
  },
  ID: {
    code: '+62',
    name: 'Indonesia',
    digits: 10,
    format: 'XXX-XXX-XXXX',
    placeholder: '812-345-6789'
  },
  VN: {
    code: '+84',
    name: 'Vietnam',
    digits: 9,
    format: 'XXX XXX XXX',
    placeholder: '912 345 678'
  }
};

/**
 * Validate phone number with country code
 * @param {string} phoneNumber - The phone number to validate
 * @param {string} countryCode - The country code (e.g., 'US', 'IN')
 * @returns {Object} Validation result
 */
export function validatePhoneNumber(phoneNumber: string, countryCode: string = 'US') {
  try {
    if (!phoneNumber || !countryCode) {
      return {
        isValid: false,
        error: 'Phone number and country code are required',
        formatted: null
      };
    }

    const country = COUNTRY_CODES[countryCode];
    if (!country) {
      return {
        isValid: false,
        error: 'Invalid country code',
        formatted: null
      };
    }

    // Clean the phone number (remove spaces, hyphens, parentheses)
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if number starts with country code
    let numberToValidate = cleanNumber;
    if (cleanNumber.startsWith(country.code.replace('+', ''))) {
      numberToValidate = cleanNumber.substring(country.code.length - 1);
    } else if (cleanNumber.startsWith(country.code)) {
      numberToValidate = cleanNumber.substring(country.code.length);
    }

    // Validate digit count
    if (numberToValidate.length !== country.digits) {
      return {
        isValid: false,
        error: `Phone number must be ${country.digits} digits for ${country.name}`,
        formatted: null,
        expectedFormat: country.format,
        expectedDigits: country.digits
      };
    }

    // Additional validation based on country-specific rules
    let isValidFormat = true;
    
    // Country-specific validation patterns
    switch (countryCode) {
      case 'US':
      case 'CA':
        // North American Numbering Plan - no 0 or 1 as first digit of area code or exchange
        const areaCode = numberToValidate.substring(0, 3);
        const exchange = numberToValidate.substring(3, 6);
        if (areaCode.startsWith('0') || areaCode.startsWith('1') || 
            exchange.startsWith('0') || exchange.startsWith('1')) {
          isValidFormat = false;
        }
        break;
      case 'IN':
        // Indian mobile numbers start with 6, 7, 8, or 9
        if (!['6', '7', '8', '9'].includes(numberToValidate.charAt(0))) {
          isValidFormat = false;
        }
        break;
      case 'GB':
        // UK mobile numbers start with 7
        if (!numberToValidate.startsWith('7')) {
          isValidFormat = false;
        }
        break;
      case 'AU':
        // Australian mobile numbers start with 4
        if (!numberToValidate.startsWith('4')) {
          isValidFormat = false;
        }
        break;
    }
    
    if (!isValidFormat) {
      return {
        isValid: false,
        error: 'Invalid phone number format for this country',
        formatted: null,
        expectedFormat: country.format
      };
    }

    // Format the number for different representations
    const fullNumber = country.code + numberToValidate;
    const formattedNumber = formatPhoneInput(numberToValidate, countryCode);
    
    return {
      isValid: true,
      formatted: `${country.code} ${formattedNumber}`,
      national: formattedNumber,
      e164: fullNumber,
      countryCode: countryCode,
      countryCallingCode: country.code,
      error: null
    };

  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid phone number',
      formatted: null
    };
  }
}

/**
 * Format phone number as user types
 * @param {string} value - Current input value
 * @param {string} countryCode - Country code
 * @returns {string} Formatted phone number
 */
export function formatPhoneInput(value: string, countryCode: string = 'US') {
  const country = COUNTRY_CODES[countryCode];
  if (!country || !value) return value;

  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply country-specific formatting
  switch (countryCode) {
    case 'US':
    case 'CA':
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    
    case 'IN':
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    
    case 'GB':
      if (digits.length <= 4) return digits;
      if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
    
    case 'AU':
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    
    default:
      return digits;
  }
}

/**
 * Get country info by country code
 * @param {string} countryCode - Country code
 * @returns {Object|null} Country information
 */
export function getCountryInfo(countryCode: string) {
  return COUNTRY_CODES[countryCode] || null;
}

/**
 * Get all countries for dropdown
 * @returns {Array} Array of country objects
 */
export function getAllCountries(): CountryCode[] {
  return Object.keys(COUNTRY_CODES).map(countryKey => 
    COUNTRY_CODES[countryKey]
  ).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search patient by phone number in different formats
 * @param {string} phoneNumber - Phone number to search
 * @param {string} countryCode - Country code
 * @returns {Array} Array of possible phone number formats for search
 */
export function getPhoneSearchFormats(phoneNumber: string, countryCode: string = 'US') {
  const validation = validatePhoneNumber(phoneNumber, countryCode);
  
  if (!validation.isValid) {
    return [phoneNumber]; // Return original if invalid
  }

  // Return multiple formats for database search
  return [
    validation.e164,
    validation.formatted,
    validation.national,
    phoneNumber // Original input
  ].filter(Boolean);
}

/**
 * Extract country code from full phone number
 * @param {string} phoneNumber - Full phone number with country code
 * @returns {string|null} Country code or null
 */
export function extractCountryCode(phoneNumber: string) {
  try {
    if (!phoneNumber) return null;
    
    // Remove all non-digits and leading +
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    
    // Check against known country codes
    for (const [countryCode, country] of Object.entries(COUNTRY_CODES)) {
      const dialCode = country.code.replace('+', '');
      if (cleanNumber.startsWith(dialCode)) {
        return countryCode;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a random phone number for a given country
 * @param {string} countryCode - Country code (e.g., 'US', 'IN')
 * @returns {string} Random phone number
 */
export function generateRandomPhoneNumber(countryCode: string = 'US') {
  const country = COUNTRY_CODES[countryCode];
  if (!country) {
    throw new Error('Invalid country code');
  }

  let randomDigits = '';
  
  // Generate random digits based on country requirements
  switch (countryCode) {
    case 'US':
    case 'CA':
      // Format: (XXX) XXX-XXXX - avoid certain area codes
      const validAreaCodes = ['555', '202', '213', '310', '415', '617', '718', '212', '305', '404', '512', '713', '214', '312', '216'];
      const areaCode = validAreaCodes[Math.floor(Math.random() * validAreaCodes.length)];
      const exchange = Math.floor(Math.random() * 900) + 100; // 100-999
      const number = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
      randomDigits = `${areaCode}${exchange}${number}`;
      break;
      
    case 'IN':
      // Format: XXXXX XXXXX - start with 6-9 for mobile
      const firstDigit = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, or 9
      const remaining = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
      randomDigits = `${firstDigit}${remaining}`;
      break;
      
    case 'GB':
      // Format: 07XXX XXXXXX - mobile numbers start with 07
      const remaining_gb = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
      randomDigits = `7${remaining_gb}`;
      break;
      
    case 'AU':
      // Format: 04XX XXX XXX - mobile numbers start with 04
      const remaining_au = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
      randomDigits = `4${remaining_au}`;
      break;
      
    default:
      // Generic random number generation
      for (let i = 0; i < country.digits; i++) {
        if (i === 0) {
          // First digit should not be 0
          randomDigits += Math.floor(Math.random() * 9) + 1;
        } else {
          randomDigits += Math.floor(Math.random() * 10);
        }
      }
  }

  // Format the number
  const formattedNumber = formatPhoneInput(randomDigits, countryCode);
  return country.code + ' ' + formattedNumber;
}

/**
 * Generate a unique random phone number that doesn't exist in database
 * @param {string} countryCode - Country code
 * @param {Function} checkExistence - Function to check if phone exists in DB
 * @param {number} maxAttempts - Maximum attempts to generate unique number
 * @returns {Promise<string>} Unique random phone number
 */
export async function generateUniquePhoneNumber(countryCode: string = 'US', checkExistence: (phone: string, country: string) => Promise<boolean>, maxAttempts: number = 10) {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const randomPhone = generateRandomPhoneNumber(countryCode);
    
    if (checkExistence) {
      const exists = await checkExistence(randomPhone, countryCode);
      if (!exists) {
        return randomPhone;
      }
    } else {
      return randomPhone;
    }
    
    attempts++;
  }
  
  throw new Error(`Could not generate unique phone number after ${maxAttempts} attempts`);
}

/**
 * Get test/demo phone numbers for different countries
 * @param {string} countryCode - Country code
 * @returns {Array} Array of test phone numbers
 */
export function getTestPhoneNumbers(countryCode: string = 'US') {
  const testNumbers: Record<string, string[]> = {
    US: ['+1 (555) 123-4567', '+1 (555) 987-6543', '+1 (555) 111-2222'],
    IN: ['+91 98765 43210', '+91 87654 32109', '+91 76543 21098'],
    GB: ['+44 7911 123456', '+44 7922 234567', '+44 7933 345678'],
    AU: ['+61 412 345 678', '+61 423 456 789', '+61 434 567 890']
  };
  
  return testNumbers[countryCode] || testNumbers.US;
}

export default {
  validatePhoneNumber,
  formatPhoneInput,
  getCountryInfo,
  getAllCountries,
  getPhoneSearchFormats,
  extractCountryCode,
  generateRandomPhoneNumber,
  generateUniquePhoneNumber,
  getTestPhoneNumbers,
  COUNTRY_CODES
};