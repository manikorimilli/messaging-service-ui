import { ChevronDownIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { templatesForProvider, usesTwilioTemplates } from '../data/sampleTemplates.js';
import { BODY_MAX_LENGTH } from '../utils/validation.js';
import { FormField } from './FormField.jsx';

// Message textarea with a character counter and frontend-only sample templates.
// The template list depends on the selected provider. Templates only fill the
// textarea; the final text is sent as `body`.
export function MessageField({ id, provider, value, onChange, onBlur, error, disabled }) {
  const over = value.length > BODY_MAX_LENGTH;
  const templates = templatesForProvider(provider);
  const twilio = usesTwilioTemplates(provider);

  return (
    <FormField
      id={id}
      label="Message"
      error={error}
      description={
        twilio
          ? 'Twilio (and the primary provider) only accept the test template values as the message body.'
          : 'Any message text works with this provider.'
      }
      aside={
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button variant="outline" size="sm" className="rounded-full">
              <SparklesIcon aria-hidden="true" />
              {twilio ? 'Twilio template' : 'Template'}
              <ChevronDownIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-xl">
            <DropdownMenuLabel>{twilio ? 'Twilio test templates' : 'Sample messages'}</DropdownMenuLabel>
            {templates.map((t) => (
              <DropdownMenuItem key={t.id} onSelect={() => onChange(t.text)} className="flex-col items-start gap-0.5">
                <span>{t.name}</span>
                <span className={cn('text-muted-foreground text-xs', twilio ? 'tabular-nums' : 'line-clamp-1')}>{t.text}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      }
      footerEnd={
        <span className={cn('shrink-0 tabular-nums', over ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
          {value.length} / {BODY_MAX_LENGTH}
        </span>
      }
    >
      <Textarea
        id={id}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : `${id}-description`}
        className="min-h-32 rounded-xl bg-background/60 px-3 py-2.5 text-sm shadow-xs"
        placeholder={twilio ? 'Pick a Twilio test template, for example sms_2fa' : 'Type your message'}
      />
    </FormField>
  );
}
