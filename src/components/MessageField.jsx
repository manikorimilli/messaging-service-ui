import { BODY_MAX_LENGTH } from '../utils/validation.js';
import { templatesForProvider, usesTwilioTemplates } from '../data/sampleTemplates.js';

// Message textarea with a character counter and frontend-only sample templates.
// The template list depends on the selected provider. Templates only fill the
// textarea; the final text is sent as `body`.
export function MessageField({ id, provider, value, onChange, onBlur, error, disabled }) {
  const over = value.length > BODY_MAX_LENGTH;
  const templates = templatesForProvider(provider);
  const twilio = usesTwilioTemplates(provider);

  return (
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>Message</label>
        <select
          className="template-select"
          aria-label="Insert a sample template"
          value=""
          disabled={disabled}
          onChange={(e) => {
            const template = templates.find((t) => t.id === e.target.value);
            if (template) onChange(template.text);
          }}
        >
          <option value="">{twilio ? 'Insert Twilio test template...' : 'Insert sample template...'}</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {twilio ? `${t.name} (${t.text})` : t.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        id={id}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint ${id}-count`}
        placeholder={twilio ? 'Pick a Twilio test template, for example sms_2fa' : 'Type your message'}
      />
      <p id={`${id}-hint`} className="hint">
        {twilio
          ? 'Twilio (and the primary provider) only accept the test template values as the message body.'
          : 'Any message text works with this provider.'}
      </p>
      <div className="field-row">
        <p className="field-error">{error}</p>
        <p id={`${id}-count`} className={over ? 'char-count over' : 'char-count'}>
          {value.length} / {BODY_MAX_LENGTH} characters
        </p>
      </div>
    </div>
  );
}
