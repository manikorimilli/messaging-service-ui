import { errorHelp } from '../utils/errors.js';
import { Alert } from './Alert.jsx';

export function ErrorAlert({ error, onDismiss }) {
  if (!error) return null;
  const help = errorHelp(error);
  const meta = [error.status ? `HTTP ${error.status}` : null, error.code].filter(Boolean).join(' · ');

  return (
    <Alert tone="error" title={error.title || 'Something went wrong'} onDismiss={onDismiss}>
      {meta && <p className="alert-meta">{meta}</p>}
      {error.detail && <p>{error.detail}</p>}
      {!error.detail && !error.title && error.message && <p>{error.message}</p>}
      {error.providerErrorCode && (
        <p>
          Provider error code: <code>{error.providerErrorCode}</code>
        </p>
      )}
      {error.problems?.length > 0 && (
        <ul className="problem-list">
          {error.problems.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {help && <p className="alert-help">{help}</p>}
    </Alert>
  );
}
