import { useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MAX_RECIPIENTS, mergeRecipients } from '../utils/validation.js';

const SEPARATOR = /[\s,;]/;
// Keeps the cursor in the number box after pressing Add or a chip's remove button.
const keepFocus = (e) => e.preventDefault();

function describe({ invalid, duplicates, overflow }) {
  const parts = [];
  if (invalid.length) parts.push(`Not valid E.164: ${invalid.join(', ')}. Fix it in the box and press Enter.`);
  if (duplicates.length) parts.push(`Already added: ${duplicates.join(', ')}.`);
  if (overflow.length) parts.push(`The limit is ${MAX_RECIPIENTS} recipients; ${overflow.length} not added.`);
  return parts.join(' ');
}

// Phone numbers as removable chips. Press Enter (or type a comma, or paste a list)
// to add. Invalid numbers stay in the box so they can be corrected.
// Nothing is committed on blur: changing the layout on mousedown would make a
// click on the Send button miss. The form adds any leftover typed number on submit.
export function RecipientsInput({ id, recipients, onChange, draft, onDraftChange, error, disabled }) {
  const [notice, setNotice] = useState('');

  function commit(text) {
    if (!text.trim()) return;
    const result = mergeRecipients(recipients, text);
    if (result.recipients.length !== recipients.length) onChange(result.recipients);
    onDraftChange([...result.invalid, ...result.overflow].join(', '));
    setNotice(describe(result));
  }

  function handleDraft(value) {
    // A separator means the user finished a number (comma, space, or a pasted list).
    if (SEPARATOR.test(value)) commit(value);
    else {
      onDraftChange(value);
      if (notice) setNotice('');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault(); // do not submit the form
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && recipients.length > 0) {
      onChange(recipients.slice(0, -1));
    }
  }

  function remove(number) {
    onChange(recipients.filter((n) => n !== number));
    setNotice('');
  }

  return (
    <Field invalid={Boolean(error)}>
      <div className="flex w-full items-center justify-between gap-2">
        <FieldLabel htmlFor={id}>Recipients</FieldLabel>
        <span className="flex items-center gap-2 text-muted-foreground text-xs tabular-nums">
          {recipients.length} / {MAX_RECIPIENTS}
          {recipients.length > 0 && !disabled && (
            <Button variant="ghost" size="xs" onClick={() => onChange([])}>
              Clear all
            </Button>
          )}
        </span>
      </div>

      <div
        className={cn(
          'flex w-full flex-col gap-2 rounded-lg border border-input bg-background p-2 shadow-xs/5 transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/24 dark:bg-input/32',
          error && 'border-destructive/36 focus-within:border-destructive/64 focus-within:ring-destructive/16',
          disabled && 'opacity-64',
        )}
      >
        {recipients.length > 0 ? (
          <ul className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto" aria-label="Added recipients">
            {recipients.map((number) => (
              <li
                key={number}
                className="inline-flex items-center gap-1 rounded-md border bg-secondary py-0.5 ps-2 pe-0.5 font-mono text-secondary-foreground text-xs"
              >
                <span>{number}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onMouseDown={keepFocus}
                  onClick={() => remove(number)}
                  disabled={disabled}
                  aria-label={`Remove ${number}`}
                >
                  <XIcon aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-muted-foreground text-xs">No numbers added yet.</p>
        )}

        <div className="flex items-center gap-2">
          <Input
            id={id}
            unstyled
            type="tel"
            inputMode="tel"
            autoComplete="off"
            className="flex-1 px-1"
            placeholder="+919876543210, then press Enter"
            value={draft}
            onChange={(e) => handleDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || recipients.length >= MAX_RECIPIENTS}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={`${id}-hint`}
          />
          <Button
            variant="outline"
            size="sm"
            onMouseDown={keepFocus}
            onClick={() => commit(draft)}
            disabled={disabled || !draft.trim()}
          >
            <PlusIcon aria-hidden="true" />
            Add
          </Button>
        </div>
      </div>

      <FieldDescription id={`${id}-hint`}>
        Press Enter after each number. You can also paste a list separated by commas or new lines.
      </FieldDescription>
      {notice && (
        <p className="text-warning-foreground text-xs" role="status">
          {notice}
        </p>
      )}
      {error && <FieldError match>{error}</FieldError>}
    </Field>
  );
}
