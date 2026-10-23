import { describe, expect, it } from 'vitest';
import { GENERAL_TEMPLATES, TWILIO_TEMPLATES, templatesForProvider } from '../data/sampleTemplates.js';

describe('templatesForProvider', () => {
  it('uses the Twilio test values for Twilio and the primary provider', () => {
    expect(templatesForProvider('')).toBe(TWILIO_TEMPLATES);
    expect(templatesForProvider('TWILIO')).toBe(TWILIO_TEMPLATES);
    expect(templatesForProvider('twilio')).toBe(TWILIO_TEMPLATES);
  });
  it('keeps the free-text samples for Vonage and other providers', () => {
    expect(templatesForProvider('VONAGE')).toBe(GENERAL_TEMPLATES);
    expect(templatesForProvider('MSG91')).toBe(GENERAL_TEMPLATES);
  });
  it('sends the exact Twilio body values', () => {
    expect(TWILIO_TEMPLATES.map((t) => t.text)).toEqual([
      'sms_2fa',
      'sms_appointment_reminders',
      'sms_order_confirmation',
      'sms_delivery_updates',
      'sms_customer_support',
      'sms_marketing_promotions',
      'sms_event_notifications',
      'sms_account_alerts',
      'sms_feedback_surveys',
      'sms_internal_alerts',
    ]);
  });
});
