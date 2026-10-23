import { useId, useRef, useState } from 'react';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  FileCodeIcon,
  KeyRoundIcon,
  ListChecksIcon,
  TriangleAlertIcon,
  UploadIcon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DialogFooter, DialogPanel } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { MASKED_VALUE, PROVIDER_EXAMPLE } from '../utils/providerConfig.js';
import { parseJson, validateProviderConfig } from '../utils/validation.js';
import { ErrorAlert } from './ErrorAlert.jsx';

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
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <DialogPanel className="space-y-4">
        {mode === 'update' ? (
          <Alert variant="info" role="note">
            <KeyRoundIcon aria-hidden="true" />
            <AlertTitle>Secrets stay masked</AlertTitle>
            <AlertDescription>
              <p>
                Secret values show as <code className="font-mono">{MASKED_VALUE}</code>. Leave them as they are to keep the
                stored secret, or replace one with a new raw value to change it. Updates send the full configuration.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <p className="text-muted-foreground text-sm">
            Paste the provider configuration or upload a <code className="font-mono">.json</code> file. Use raw values in{' '}
            <code className="font-mono">variables</code> (no <code className="font-mono">{'${ENV}'}</code> placeholders).
            Keep <code className="font-mono">{'{{...}}'}</code> mapping placeholders inside{' '}
            <code className="font-mono">request</code>.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={submit.pending}>
            <UploadIcon aria-hidden="true" />
            Upload JSON
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
          {mode === 'create' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleText(JSON.stringify(PROVIDER_EXAMPLE, null, 2))}
              disabled={submit.pending}
            >
              <FileCodeIcon aria-hidden="true" />
              Insert example
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={validate} disabled={submit.pending}>
            <ListChecksIcon aria-hidden="true" />
            Validate
          </Button>
        </div>

        <Field>
          <FieldLabel htmlFor={textareaId} className="sr-only">
            Provider configuration JSON
          </FieldLabel>
          <Textarea
            id={textareaId}
            className="min-h-64 font-mono text-xs leading-relaxed"
            rows={16}
            value={text}
            onChange={(e) => handleText(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            disabled={submit.pending}
            placeholder='{ "id": "...", "display-name": "...", "channels": ["SMS"], ... }'
          />
        </Field>

        {check?.parseError && (
          <Alert variant="error">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Cannot read JSON</AlertTitle>
            <AlertDescription>{check.parseError}</AlertDescription>
          </Alert>
        )}
        {check && check.problems.length > 0 && (
          <Alert variant="error">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Fix these before submitting</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-0.5 ps-4 text-foreground">
                {check.problems.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {check && check.warnings.length > 0 && (
          <Alert variant="warning">
            <TriangleAlertIcon aria-hidden="true" />
            <AlertTitle>Notes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-0.5 ps-4">
                {check.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {isValid && !submit.error && (
          <Alert variant="success">
            <CircleCheckIcon aria-hidden="true" />
            <AlertTitle>Configuration looks valid</AlertTitle>
          </Alert>
        )}
        <ErrorAlert error={submit.error} onDismiss={submit.reset} />
      </DialogPanel>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={submit.pending}>
          Cancel
        </Button>
        <Button type="submit" loading={submit.pending}>
          {mode === 'update' ? 'Save changes' : 'Register provider'}
        </Button>
      </DialogFooter>
    </form>
  );
}
