// Shared referral form validation utilities

export interface ReferralFormData {
  partnerAgencyName: string;
  referrerName: string;
  clientName: string;
  reason: string;
  programRequested: string;
  contactInfo: string;
  notes?: string;
  source: string;
}

export interface ValidationErrors {
  partnerAgencyName?: string;
  referrerName?: string;
  clientName?: string;
  reason?: string;
  programRequested?: string;
  contactInfo?: string;
  source?: string;
}

export function validateReferralForm(data: Partial<ReferralFormData>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.partnerAgencyName?.trim()) {
    errors.partnerAgencyName = 'Partner agency name is required';
  }

  if (!data.referrerName?.trim()) {
    errors.referrerName = 'Referrer name is required';
  }

  if (!data.clientName?.trim()) {
    errors.clientName = 'Client name is required';
  }

  if (!data.reason?.trim()) {
    errors.reason = 'Reason for referral is required';
  }

  if (!data.programRequested?.trim()) {
    errors.programRequested = 'Program requested is required';
  }

  if (!data.contactInfo?.trim()) {
    errors.contactInfo = 'Contact info is required';
  }

  if (!data.source?.trim()) {
    errors.source = 'Referral source is required';
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('invalid input') || message.includes('missing required')) {
      return 'Please fill in all required fields correctly';
    }
    if (message.includes('partner agency profile not found')) {
      return 'Please complete your Partner Agency profile first';
    }
    return error.message;
  }
  return 'An unexpected error occurred';
}
