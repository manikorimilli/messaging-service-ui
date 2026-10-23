import { ErrorAlert } from './ErrorAlert.jsx';
import { Modal } from './Modal.jsx';
import { Spinner } from './States.jsx';

export function ConfirmDialog({ title, children, confirmLabel, pending, error, onConfirm, onCancel }) {
  const close = () => !pending && onCancel();
  return (
    <Modal
      title={title}
      onClose={close}
      footer={
        <>
          <button type="button" className="btn" onClick={close} disabled={pending}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={pending}>
            {pending && <Spinner small />} {confirmLabel}
          </button>
        </>
      }
    >
      {children}
      <ErrorAlert error={error} />
    </Modal>
  );
}
