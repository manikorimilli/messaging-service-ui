import { useId, useRef, useState } from 'react';
import { FileCodeIcon, ListChecksIcon, UploadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { MASKED_VALUE, PROVIDER_EXAMPLE } from '../utils/providerConfig.js';
import { parseJson, validateProviderConfig } from '../utils/validation.js';
import { CodeWindow } from './CodeWindow.jsx';
import { ErrorAlert } from './ErrorAlert.jsx';
import { Notice } from './Notice.jsx';

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
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-4">
        {mode === 'update' ? (
          <Notice tone="info" title="Secrets stay masked" role="note">
            Secret values show as <code className="text-foreground">{MASKED_VALUE}</code>. Leave them as they are to keep the
            stored secret, or replace one with a new raw value to change it. Updates send the full configuration.
          </Notice>
        ) : (
          <p className="text-muted-foreground text-sm">
            Paste the provider configuration or upload a <code className="text-foreground">.json</code> file. Use raw values in{' '}
            <code className="text-foreground">variables</code> (no <code className="text-foreground">{'${ENV}'}</code>{' '}
            placeholders). Keep <code className="text-foreground">{'{{...}}'}</code> mapping placeholders inside{' '}
            <code className="text-foreground">request</code>.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => fileRef.current?.click()} disabled={submit.pending}>
            <UploadIcon aria-hidden="true" />
            Upload JSON
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
          {mode === 'create' && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => handleText(JSON.stringify(PROVIDER_EXAMPLE, null, 2))}
              disabled={submit.pending}
            >
              <FileCodeIcon aria-hidden="true" />
              Insert example
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-full" onClick={validate} disabled={submit.pending}>
            <ListChecksIcon aria-hidden="true" />
            Validate
          </Button>
        </div>

        <CodeWindow title={mode === 'update' ? `${providerId}.json` : 'provider.json'}>
          <Label htmlFor={textareaId} className="sr-only">
            Provider configuration JSON
          </Label>
          <Textarea
            id={textareaId}
            className="min-h-72 resize-y rounded-none border-0 bg-transparent px-4 py-3 font-mono text-xs leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
            value={text}
            onChange={(e) => handleText(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            disabled={submit.pending}
            placeholder='{ "id": "...", "display-name": "...", "channels": ["SMS"], ... }'
          />
        </CodeWindow>

        {check?.parseError && (
          <Notice tone="error" title="Cannot read JSON">
            {check.parseError}
          </Notice>
        )}
        {check && check.problems.length > 0 && (
          <Notice tone="error" title="Fix these before submitting">
            <ul className="list-disc space-y-0.5 ps-4 text-foreground">
              {check.problems.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </Notice>
        )}
        {check && check.warnings.length > 0 && (
          <Notice tone="warning" title="Notes">
            <ul className="list-disc space-y-0.5 ps-4">
              {check.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Notice>
        )}
        {isValid && !submit.error && <Notice tone="success" title="Configuration looks valid" />}
        <ErrorAlert error={submit.error} onDismiss={submit.reset} />
      </div>

      <DialogFooter className="mx-0 mb-0 border-t bg-muted/40 px-6 py-4">
        <Button variant="ghost" className="rounded-full" onClick={onCancel} disabled={submit.pending}>
          Cancel
        </Button>
        <Button type="submit" className="rounded-full px-5 shadow-lg shadow-primary/25" disabled={submit.pending}>
          {submit.pending && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
          {submit.pending ? 'Saving...' : mode === 'update' ? 'Save changes' : 'Register provider'}
        </Button>
      </DialogFooter>
    </form>
  );
}
