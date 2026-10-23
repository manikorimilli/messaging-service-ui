import { ChevronDownIcon, FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { templatesForProvider, usesTwilioTemplates } from '../data/sampleTemplates.js';
import { BODY_MAX_LENGTH } from '../utils/validation.js';

// Message textarea with a character counter and frontend-only sample templates.
// The template list depends on the selected provider. Templates only fill the
// textarea; the final text is sent as `body`.
export function MessageField({ id, provider, value, onChange, onBlur, error, disabled }) {
  const over = value.length > BODY_MAX_LENGTH;
  const templates = templatesForProvider(provider);
  const twilio = usesTwilioTemplates(provider);

  return (
    <Field invalid={Boolean(error)}>
      <div className="flex w-full items-center justify-between gap-2">
        <FieldLabel>Message</FieldLabel>
        <Menu>
          <MenuTrigger disabled={disabled} render={<Button variant="outline" size="sm" />}>
            <FileTextIcon aria-hidden="true" />
            {twilio ? 'Twilio template' : 'Template'}
            <ChevronDownIcon aria-hidden="true" />
          </MenuTrigger>
          <MenuPopup align="end">
            <MenuGroup>
              <MenuGroupLabel>{twilio ? 'Twilio test templates' : 'Sample messages'}</MenuGroupLabel>
              {templates.map((t) => (
                <MenuItem key={t.id} onClick={() => onChange(t.text)}>
                  <span className="flex flex-col">
                    <span>{t.name}</span>
                    {twilio && <span className="font-mono text-muted-foreground text-xs">{t.text}</span>}
                  </span>
                </MenuItem>
              ))}
            </MenuGroup>
          </MenuPopup>
        </Menu>
      </div>
      <Textarea
        id={id}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        placeholder={twilio ? 'Pick a Twilio test template, for example sms_2fa' : 'Type your message'}
      />
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0">
          {error ? (
            <FieldError match>{error}</FieldError>
          ) : (
            <FieldDescription>
              {twilio
                ? 'Twilio (and the primary provider) only accept the test template values as the message body.'
                : 'Any message text works with this provider.'}
            </FieldDescription>
          )}
        </div>
        <p className={cn('shrink-0 text-xs tabular-nums', over ? 'font-medium text-destructive-foreground' : 'text-muted-foreground')}>
          {value.length} / {BODY_MAX_LENGTH}
        </p>
      </div>
    </Field>
  );
}
