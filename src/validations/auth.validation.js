/**
 * Auth Validation Schema
 * Contains validation rules for authentication endpoints
 */

export const authValidation = {
  register: {
    required: ['email', 'password', 'name'],
    rules: {
      email: {
        type: 'email',
        message: 'Please provide a valid email address'
      },
      password: {
        type: 'string',
        minLength: 8,
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
      },
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        message: 'Name must be between 2 and 50 characters'
      },
      phone: {
        type: 'string',
        optional: true,
        pattern: /^\+?[\d\s\-\(\)]+$/,
        message: 'Please provide a valid phone number'
      }
    }
  },

  login: {
    required: ['email', 'password'],
    rules: {
      email: {
        type: 'email',
        message: 'Please provide a valid email address'
      },
      password: {
        type: 'string',
        minLength: 1,
        message: 'Password is required'
      }
    }
  },

  verifyOtp: {
    required: ['email', 'code'],
    rules: {
      email: {
        type: 'email',
        message: 'Please provide a valid email address'
      },
      code: {
        type: 'string',
        pattern: /^\d{6}$/,
        message: 'OTP must be a 6-digit number'
      }
    }
  },

  resendOtp: {
    required: ['email'],
    rules: {
      email: {
        type: 'email',
        message: 'Please provide a valid email address'
      }
    }
  }
};

/**
 * Validates request body against validation schema
 * @param {Object} data - Request body data
 * @param {Object} schema - Validation schema
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateRequest(data, schema) {
  const errors = [];

  // Check required fields
  for (const field of schema.required) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors.push(`${field} is required`);
    }
  }

  // Validate each field against rules
  for (const [fieldName, rules] of Object.entries(schema.rules)) {
    const value = data[fieldName];

    // Skip validation if field is optional and not provided
    if (rules.optional && (!value || value.trim() === '')) {
      continue;
    }

    // Skip if required validation already failed
    if (!value) continue;

    // Type validation
    if (rules.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(rules.message);
        continue;
      }
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(rules.message);
      continue;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(rules.message);
      continue;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.message);
      continue;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}