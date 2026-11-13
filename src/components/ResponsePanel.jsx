import { CodeWindow } from './CodeWindow.jsx';

// The full response the server sent, as formatted JSON (or as text when the
// server did not send JSON). It scrolls inside a fixed height.
export function ResponsePanel({ title, body }) {
  const text = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  return (
    <section aria-label={title} className="min-w-0">
      <CodeWindow title={title}>
        <pre
          tabIndex={0}
          className="max-h-96 overflow-auto px-4 py-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <code>{text}</code>
        </pre>
      </CodeWindow>
    </section>
  );
}
