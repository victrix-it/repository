/**
 * Password Policy Configuration and Validation
 */

export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_POLICY.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getPasswordRequirements(): string[] {
  const requirements: string[] = [];

  requirements.push(`At least ${PASSWORD_POLICY.minLength} characters long`);

  if (PASSWORD_POLICY.requireUppercase) {
    requirements.push('At least one uppercase letter');
  }

  if (PASSWORD_POLICY.requireLowercase) {
    requirements.push('At least one lowercase letter');
  }

  if (PASSWORD_POLICY.requireNumbers) {
    requirements.push('At least one number');
  }

  if (PASSWORD_POLICY.requireSpecialChars) {
    requirements.push('At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  return requirements;
}
