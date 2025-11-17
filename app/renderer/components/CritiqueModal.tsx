import type { ChangeEvent } from 'react';
import type {
  Phase4CritiqueBridgeResponse,
  Phase4Issue,
} from '../../shared/ipc/services';
import type { RewritePreview } from '../hooks/useCritique';

interface CritiqueModalProps {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  critique: Phase4CritiqueBridgeResponse | null;
  traceId?: string;
  sceneId?: string | null;
  sceneTitle?: string | null;
  instructions: string;
  rewrite: RewritePreview | null;
  rewriteLoading: boolean;
  rewriteError: string | null;
  onClose: () => void;
  onReject: () => void;
  onRunRewrite: () => void;
  onApplyRewrite: () => void;
  onDiscardRewrite: () => void;
  onChangeInstructions: (next: string) => void;
}

function renderIssues(issues?: Phase4Issue[]): JSX.Element | null {
  if (!issues || issues.length === 0) {
    return null;
  }
  return (
    <section className="critique-modal__section">
      <h4>Issues</h4>
      <ul className="critique-modal__list critique-modal__list--issues">
        {issues.map((issue, index) => (
          <li key={`${issue.type}-${index}`}>
            {issue.line ? <span className="critique-modal__line-number">Line {issue.line}</span> : null}
            <strong>{issue.type}</strong>
            <p>{issue.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function renderSuggestions(suggestions?: string[]): JSX.Element | null {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }
  return (
    <section className="critique-modal__section">
      <h4>Suggestions</h4>
      <ul className="critique-modal__list">
        {suggestions.map((suggestion) => (
          <li key={suggestion}>{suggestion}</li>
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
  sceneId,
  sceneTitle,
  instructions,
  rewrite,
  rewriteLoading,
  rewriteError,
  onClose,
  onReject,
  onRunRewrite,
  onApplyRewrite,
  onDiscardRewrite,
  onChangeInstructions,
}: CritiqueModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const derivedTitle = sceneTitle?.trim() || sceneId || 'Selected scene';
  const canRequestRewrite = Boolean(critique) && !loading && !rewriteLoading;

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
            A-
          </button>
        </header>

        <section className="critique-modal__body">
          {loading ? <p className="critique-modal__status">Requesting critique…</p> : null}
          {!loading && error ? (
            <div className="critique-modal__error" role="alert">
              <strong>Critique request failed.</strong>
              <p>{error}</p>
            </div>
          ) : null}
          {!loading && critique ? (
            <>
              <section className="critique-modal__section">
                <div className="critique-modal__summary">
                  <h4>Summary</h4>
                  <p>{critique.summary}</p>
                </div>
              </section>
              {renderIssues(critique.issues)}
              {renderSuggestions(critique.suggestions)}
            </>
          ) : null}
          {rewriteError ? (
            <div className="critique-modal__error" role="alert">
              <strong>Rewrite failed.</strong>
              <p>{rewriteError}</p>
            </div>
          ) : null}
          <section className="critique-modal__section">
            <h4>Rewrite instructions</h4>
            <textarea
              value={instructions}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChangeInstructions(event.target.value)}
              placeholder="Summarize what you want to improve, or describe the feeling to amplify."
            />
            <div className="critique-modal__actions">
              <button
                type="button"
                className="critique-modal__button critique-modal__button--primary"
                onClick={onRunRewrite}
                disabled={!canRequestRewrite}
              >
                {rewriteLoading ? 'Rewriting…' : 'Generate rewrite'}
              </button>
            </div>
          </section>
          {rewrite ? (
            <section className="critique-modal__section critique-modal__section--rewrite">
              <header>
                <h4>Rewrite preview</h4>
                <p>Compare the original and revised scene text.</p>
              </header>
              <div className="critique-modal__rewrite-columns">
                <div>
                  <h5>Original</h5>
                  <pre>{rewrite.originalText}</pre>
                </div>
                <div>
                  <h5>Revised</h5>
                  <pre>{rewrite.revisedText}</pre>
                </div>
              </div>
              <div className="critique-modal__rewrite-actions">
                <button type="button" className="critique-modal__button" onClick={onDiscardRewrite}>
                  Discard rewrite
                </button>
              </div>
            </section>
          ) : null}
        </section>

        <footer className="critique-modal__footer">
          {traceId ? <span className="critique-modal__trace">Trace ID: {traceId}</span> : <span />}
          <div className="critique-modal__actions">
            <button type="button" className="critique-modal__button" onClick={onReject} disabled={loading || rewriteLoading}>
              Dismiss
            </button>
            <button
              type="button"
              className="critique-modal__button critique-modal__button--primary"
              onClick={onApplyRewrite}
              disabled={!rewrite}
            >
              Apply rewrite
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
