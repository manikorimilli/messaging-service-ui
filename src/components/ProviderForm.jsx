import { useId, useRef, useState } from 'react';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { MASKED_VALUE, PROVIDER_EXAMPLE } from '../utils/providerConfig.js';
import { parseJson, validateProviderConfig } from '../utils/validation.js';
import { Alert } from './Alert.jsx';
import { ErrorAlert } from './ErrorAlert.jsx';
import { Spinner } from './States.jsx';

const MAX_FILE_BYTES = 256 * 1024;

// JSON editor for registering (mode="create") or updating (mode="update") a provider.
// onSubmit receives the parsed config and should return a promise.
export function ProviderForm({ mode, providerId, initialText = '', onSubmit, onCancel }) {
  const textareaId = useId();
  const fileRef = useRef(null);
  const [text, setText] = useState(initialText);
  const [check, setCheck] = useState(null);
  const submit = useAsyncAction(onSubmit);

  function validate() {
    const parsed = parseJson(text);
    if (parsed.error) {
      setCheck({ parseError: parsed.error, problems: [], warnings: [] });
      return null;
    }
    const result = validateProviderConfig(parsed.value, { mode, pathId: providerId });
    setCheck(result);
    return result.problems.length ? null : parsed.value;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submit.pending) return;
    const value = validate();
    if (value) await submit.run(value);
  }

  function handleText(next) {
    setText(next);
    setCheck(null);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setCheck({ parseError: 'File is larger than 256 KB. Provider configs are usually a few KB.', problems: [], warnings: [] });
      return;
    }
    handleText(await file.text());
  }

  const isValid = check && !check.parseError && check.problems.length === 0;

  return (
    <form onSubmit={handleSubmit} className="provider-form" noValidate>
      {mode === 'update' ? (
        <Alert tone="info">
          Secret values show as <code>{MASKED_VALUE}</code>. Leave them as they are to keep the stored secret,
          or replace one with a new raw value to change it. Updates send the full configuration.
        </Alert>
      ) : (
        <p className="muted">
          Paste the provider configuration or upload a <code>.json</code> file. Use raw values in{' '}
          <code>variables</code> (no <code>{'${ENV}'}</code> placeholders). Keep <code>{'{{...}}'}</code> mapping
          placeholders inside <code>request</code>.
        </p>
      )}

      <div className="toolbar">
        <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={submit.pending}>
          Upload JSON file
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
        {mode === 'create' && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => handleText(JSON.stringify(PROVIDER_EXAMPLE, null, 2))}
            disabled={submit.pending}
          >
            Insert example
          </button>
        )}
        <button type="button" className="btn btn-sm" onClick={validate} disabled={submit.pending}>
          Validate
        </button>
      </div>

      <label htmlFor={textareaId} className="sr-only">
        Provider configuration JSON
      </label>
      <textarea
        id={textareaId}
        className="code-input"
        rows={18}
        value={text}
        onChange={(e) => handleText(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        disabled={submit.pending}
        placeholder='{ "id": "...", "display-name": "...", "channels": ["SMS"], ... }'
      />

      {check?.parseError && <Alert tone="error" title="Cannot read JSON">{check.parseError}</Alert>}
      {check && check.problems.length > 0 && (
        <Alert tone="error" title="Fix these before submitting">
          <ul className="problem-list">
            {check.problems.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Alert>
      )}
      {check && check.warnings.length > 0 && (
        <Alert tone="warning" title="Notes">
          <ul className="problem-list">
            {check.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Alert>
      )}
      {isValid && !submit.error && <Alert tone="success">Configuration looks valid.</Alert>}
      <ErrorAlert error={submit.error} onDismiss={submit.reset} />

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={submit.pending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submit.pending}>
          {submit.pending && <Spinner small />} {mode === 'update' ? 'Save changes' : 'Register provider'}
        </button>
      </div>
    </form>
  );
}
