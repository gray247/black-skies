import type { DraftCritiqueBridgeResponse } from '../../shared/ipc/services';

interface CritiqueModalProps {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  critique: DraftCritiqueBridgeResponse | null;
  traceId?: string;
  accepting: boolean;
  sceneId?: string | null;
  sceneTitle?: string | null;
  onClose: () => void;
  onReject: () => void;
  onAccept: () => void;
}

function renderPriorities(priorities?: string[]): JSX.Element | null {
  if (!priorities || priorities.length === 0) {
    return null;
  }
  return (
    <section className="critique-modal__section">
      <h4>Priorities</h4>
      <ul className="critique-modal__list">
        {priorities.map((priority) => (
          <li key={priority}>{priority}</li>
        ))}
      </ul>
    </section>
  );
}

function renderLineComments(
  lineComments?: DraftCritiqueBridgeResponse['line_comments'],
): JSX.Element | null {
  if (!lineComments || lineComments.length === 0) {
    return null;
  }
  return (
    <section className="critique-modal__section">
      <h4>Line comments</h4>
      <ul className="critique-modal__line-comments">
        {lineComments.map((comment, index) => (
          <li key={`${comment.line}-${index}`}>
            <span className="critique-modal__line-number">Line {comment.line}</span>
            <span>{comment.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CritiqueModal({
  isOpen,
  loading,
  error,
  critique,
  traceId,
  accepting,
  sceneId,
  sceneTitle,
  onClose,
  onReject,
  onAccept,
}: CritiqueModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const canAccept = Boolean(critique) && !loading && !accepting;
  const derivedTitle = sceneTitle?.trim() || sceneId || 'Selected scene';

  return (
    <div className="critique-modal" role="dialog" aria-modal="true" aria-label="Critique review">
      <div className="critique-modal__overlay" onClick={onClose} aria-hidden="true" />
      <div className="critique-modal__content">
        <header className="critique-modal__header">
          <div>
            <h3 className="critique-modal__title">Critique summary</h3>
            <p className="critique-modal__subtitle">{derivedTitle}</p>
          </div>
          <button type="button" className="critique-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <section className="critique-modal__body">
          {loading ? (
            <p className="critique-modal__status">Requesting critique…</p>
          ) : null}

          {!loading && error ? (
            <div className="critique-modal__error" role="alert">
              <strong>Critique request failed.</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {!loading && critique ? (
            <>
              <section className="critique-modal__section">
                <h4>Summary</h4>
                <p className="critique-modal__summary">{critique.summary}</p>
              </section>
              {renderPriorities(critique.priorities)}
              {renderLineComments(critique.line_comments)}
            </>
          ) : null}
        </section>

        <footer className="critique-modal__footer">
          {traceId ? <span className="critique-modal__trace">Trace ID: {traceId}</span> : <span />}
          <div className="critique-modal__actions">
            <button
              type="button"
              className="critique-modal__button"
              onClick={onReject}
              disabled={accepting}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="critique-modal__button critique-modal__button--primary"
              onClick={onAccept}
              disabled={!canAccept}
            >
              {accepting ? 'Accepting…' : 'Accept draft'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
