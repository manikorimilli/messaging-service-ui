import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FileCodeIcon, ListChecksIcon, UploadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAsyncAction } from '../hooks/useAsyncAction.js';
import { MASKED_VALUE, PROVIDER_EXAMPLE } from '../utils/providerConfig.js';
import {
  describeSendTimeParameter,
  detectParameters,
  missingParameters,
  parameterValue,
  withParameterValues,
} from '../utils/providerParams.js';
import { parseJson, validateProviderConfig } from '../utils/validation.js';
import { CodeWindow } from './CodeWindow.jsx';
import { ErrorAlert } from './ErrorAlert.jsx';
import { FormField, controlClass } from './FormField.jsx';
import { Notice } from './Notice.jsx';

const MAX_FILE_BYTES = 256 * 1024;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// One plain text box per placeholder found in the JSON. Values are shown as
// typed: no masking. A box starts with the matching "variables" value, if any.
function ParameterFields({ formId, parameters, variables, values, missing, onChange, disabled }) {
  if (parameters.provider.length === 0 && parameters.sendTime.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No <code className="text-foreground">{'{parameters}'}</code> found in this configuration.
      </p>
    );
  }
  return (
    <section aria-labelledby={`${formId}-params`} className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="space-y-1">
        <h3 id={`${formId}-params`} className="font-semibold text-sm">
          Parameters
        </h3>
        <p className="text-muted-foreground text-xs">
          Found from the <code className="text-foreground">{'{...}'}</code> placeholders above. Values are saved in{' '}
          <code className="text-foreground">variables</code>.
        </p>
      </div>
      {parameters.provider.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {parameters.provider.map((name) => {
            const id = `${formId}-param-${name}`;
            const isMissing = missing.includes(name);
            return (
              <FormField key={name} id={id} label={<code>{name}</code>} error={isMissing ? 'Enter a value' : undefined}>
                <Input
                  id={id}
                  className={controlClass}
                  value={parameterValue(name, values, variables)}
                  aria-invalid={isMissing || undefined}
                  aria-describedby={isMissing ? `${id}-error` : undefined}
                  onChange={(e) => onChange(name, e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={disabled}
                />
              </FormField>
            );
          })}
        </div>
      )}
      {parameters.sendTime.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium text-muted-foreground text-xs">Filled at send time</p>
          <ul className="flex flex-wrap gap-1.5">
            {parameters.sendTime.map((name) => {
              const meaning = describeSendTimeParameter(name);
              return (
                <li key={name} className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-xs">
                  <code>{name}</code>
                  <span className={meaning ? 'text-muted-foreground' : 'text-destructive'}>
                    · {meaning ? meaning.source : 'unknown'}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground text-xs">
            Saved as the backend's <code className="text-foreground">{'{{to}}'}</code>,{' '}
            <code className="text-foreground">{'{{to_digits}}'}</code> and <code className="text-foreground">{'{{text}}'}</code>.
          </p>
        </div>
      )}
    </section>
  );
}

// JSON editor for registering (mode="create") or updating (mode="update") a provider.
// onSubmit receives the parsed config and should return a promise.
export function ProviderForm({ mode, providerId, initialText = '', onSubmit, onCancel }) {
  const textareaId = useId();
  const fileRef = useRef(null);
  const resultsRef = useRef(null);
  const [text, setText] = useState(initialText);
  const [check, setCheck] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const submit = useAsyncAction(onSubmit);

  // Parameter boxes are part of registering only. They follow the JSON as it is
  // typed and disappear while it does not parse.
  const showParameters = mode === 'create';
  const draft = useMemo(() => (showParameters ? parseJson(text).value : undefined), [showParameters, text]);
  const parameters = useMemo(() => detectParameters(draft), [draft]);
  const draftVariables = isObject(draft?.variables) ? draft.variables : {};

  function withEnteredParameters(cfg) {
    if (!showParameters) return cfg;
    const entered = Object.fromEntries(
      parameters.provider.filter((name) => name in paramValues).map((name) => [name, paramValues[name].trim()]),
    );
    return withParameterValues(cfg, entered);
  }

  // Checks the JSON and, when registering, that every parameter box has a value.
  // A passing check keeps the exact config it checked, which is what Save sends.
  function validate() {
    const parsed = parseJson(text);
    if (parsed.error) {
      setCheck({ parseError: parsed.error, problems: [], warnings: [], missing: [] });
      return null;
    }
    const cfg = withEnteredParameters(parsed.value);
    const result = validateProviderConfig(cfg, { mode, pathId: providerId, requireVariables: !showParameters });
    const missing = showParameters ? missingParameters(parameters.provider, paramValues, parsed.value?.variables) : [];
    const problems = [...result.problems, ...missing.map((name) => `Enter a value for the ${name} parameter`)];
    setCheck({ ...result, problems, missing, cfg: problems.length ? null : cfg });
    return problems.length ? null : cfg;
  }

  // Validate sits above the editor and its results below, so bring them into view.
  useEffect(() => {
    if (!check) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultsRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [check]);

  function handleParameter(name, value) {
    setParamValues((current) => ({ ...current, [name]: value }));
    setCheck(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submit.pending) return;
    // Registering is two steps: Validate, then Save. Save stays disabled until
    // a check passes, and it sends the config that check approved.
    if (showParameters) {
      if (check?.cfg) await submit.run(check.cfg);
      else validate();
      return;
    }
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
  const saveLocked = showParameters && !isValid;

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
            Paste the provider configuration or upload a <code className="text-foreground">.json</code> file. Each{' '}
            <code className="text-foreground">{'{name}'}</code> or <code className="text-foreground">{'{{name}}'}</code>{' '}
            placeholder gets a box below for its value, and is saved as <code className="text-foreground">{'{{name}}'}</code>.
            Use <code className="text-foreground">{'{uaap.message.to}'}</code> and{' '}
            <code className="text-foreground">{'{uaap.message.text}'}</code> for the recipient and the message. Use raw values,
            not <code className="text-foreground">{'${ENV}'}</code> placeholders.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => fileRef.current?.click()} disabled={submit.pending}>
            <UploadIcon aria-hidden="true" />
            Upload JSON
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
          {mode === 'create' && (
            <Button
              type="button"
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
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={validate} disabled={submit.pending}>
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

        {showParameters && draft !== undefined && (
          <ParameterFields
            formId={textareaId}
            parameters={parameters}
            variables={draftVariables}
            values={paramValues}
            missing={check?.missing ?? []}
            onChange={handleParameter}
            disabled={submit.pending}
          />
        )}

        <div ref={resultsRef} className="space-y-4 empty:hidden">
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
      </div>

      <DialogFooter className="mx-0 mb-0 border-t bg-muted/40 px-6 py-4">
        {saveLocked && !submit.pending && (
          <p id={`${textareaId}-save-hint`} className="self-center text-muted-foreground text-xs sm:me-auto">
            Validate the configuration to enable saving.
          </p>
        )}
        <Button type="button" variant="ghost" className="rounded-full" onClick={onCancel} disabled={submit.pending}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="rounded-full px-5 shadow-lg shadow-primary/25"
          disabled={submit.pending || saveLocked}
          aria-describedby={saveLocked ? `${textareaId}-save-hint` : undefined}
        >
          {submit.pending && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
          {submit.pending ? 'Saving...' : mode === 'update' ? 'Save changes' : 'Register provider'}
        </Button>
      </DialogFooter>
    </form>
  );
}
