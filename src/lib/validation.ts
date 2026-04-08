// Email validation (RFC 5322 simplified)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation (E.164 international format)
export const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

export const MIN_AMOUNT = 0.01;

/**
 * Validates the recipient string against standardized email or phone formats.
 * @returns An error message if invalid, or null if valid.
 */
export function validateRecipient(value: string): string | null {
  if (!value) return "Recipient is required.";
  
  if (EMAIL_REGEX.test(value) || PHONE_REGEX.test(value)) {
    return null;
  }
  
  return "Please enter a valid email address or phone number";
}

/**
 * Validates the transaction amount bounds.
 * @returns An error message if invalid, or null if valid.
 */
export function validateAmount(value: number | string): string | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return "Amount must be a valid number.";
  
  if (num < MIN_AMOUNT) {
    return `Amount must be greater than $0.00`;
  }
  
  return null;
}
