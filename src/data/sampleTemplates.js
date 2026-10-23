// Frontend-only templates. They are not stored on or known to the backend;
// picking one only fills the message box, and the text is sent as `body`.

// Twilio (and the primary provider) only accept these exact test values as the body.
export const TWILIO_TEMPLATES = [
  { id: 'sms_2fa', name: 'OTP / verification', text: 'sms_2fa' },
  { id: 'sms_appointment_reminders', name: 'Appointment reminder', text: 'sms_appointment_reminders' },
  { id: 'sms_order_confirmation', name: 'Order confirmation', text: 'sms_order_confirmation' },
  { id: 'sms_delivery_updates', name: 'Delivery update', text: 'sms_delivery_updates' },
  { id: 'sms_customer_support', name: 'Customer support', text: 'sms_customer_support' },
  { id: 'sms_marketing_promotions', name: 'Promotional message', text: 'sms_marketing_promotions' },
  { id: 'sms_event_notifications', name: 'Event notification', text: 'sms_event_notifications' },
  { id: 'sms_account_alerts', name: 'Account alert', text: 'sms_account_alerts' },
  { id: 'sms_feedback_surveys', name: 'Feedback survey', text: 'sms_feedback_surveys' },
  { id: 'sms_internal_alerts', name: 'Internal alert', text: 'sms_internal_alerts' },
];

// Free-text samples for Vonage and any other provider, which accept any message.
export const GENERAL_TEMPLATES = [
  {
    id: 'OTP',
    name: 'One-time code',
    text: 'Your verification code is 482913. It expires in 10 minutes. Do not share it with anyone.',
  },
  {
    id: 'PAYMENT_REMINDER',
    name: 'Payment reminder',
    text: 'Reminder: your payment of INR 1,499 is due on 25 Oct. Please ignore this message if you have already paid.',
  },
  {
    id: 'APPOINTMENT',
    name: 'Appointment confirmation',
    text: 'Your appointment is confirmed for 24 Oct at 11:00 AM. Reply C to cancel.',
  },
  {
    id: 'ORDER_SHIPPED',
    name: 'Order shipped',
    text: 'Good news! Your order #48213 has shipped and should arrive in 2 to 3 days.',
  },
  {
    id: 'MAINTENANCE',
    name: 'Service notice',
    text: 'Scheduled maintenance on 26 Oct from 01:00 to 03:00 IST. Some services may be briefly unavailable.',
  },
];

// "" (primary provider) is treated as Twilio.
export function usesTwilioTemplates(providerId) {
  return !providerId || providerId.toUpperCase() === 'TWILIO';
}

export function templatesForProvider(providerId) {
  return usesTwilioTemplates(providerId) ? TWILIO_TEMPLATES : GENERAL_TEMPLATES;
}

export const ALL_TEMPLATES = [...TWILIO_TEMPLATES, ...GENERAL_TEMPLATES];
