import { useState } from 'react';
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
    <div className="field">
      <div className="field-row">
        <label htmlFor={id}>Recipients</label>
        <span className="hint chip-count">
          {recipients.length} / {MAX_RECIPIENTS}
          {recipients.length > 0 && !disabled && (
            <button type="button" className="link-button" onClick={() => onChange([])}>
              Clear all
            </button>
          )}
        </span>
      </div>

      <div className={`chip-box${error ? ' chip-box-invalid' : ''}${disabled ? ' chip-box-disabled' : ''}`}>
        {recipients.length > 0 ? (
          <ul className="chip-list" aria-label="Added recipients">
            {recipients.map((number) => (
              <li key={number} className="chip">
                <span>{number}</span>
                <button
                  type="button"
                  className="chip-remove"
                  onMouseDown={keepFocus}
                  onClick={() => remove(number)}
                  disabled={disabled}
                  aria-label={`Remove ${number}`}
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="chip-empty">No numbers added yet.</p>
        )}

        <div className="chip-entry">
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="+919876543210, then press Enter"
            value={draft}
            onChange={(e) => handleDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || recipients.length >= MAX_RECIPIENTS}
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-hint`}
          />
          <button type="button" className="btn btn-sm" onMouseDown={keepFocus} onClick={() => commit(draft)} disabled={disabled || !draft.trim()}>
            Add
          </button>
        </div>
      </div>

      <p id={`${id}-hint`} className="hint">
        Press Enter after each number. You can also paste a list separated by commas or new lines.
      </p>
      {notice && <p className="field-warning" role="status">{notice}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
