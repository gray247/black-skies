import React from 'react';

import type { DraftPreflightEstimate } from '../../shared/ipc/services';

interface PreflightModalProps {
  isOpen: boolean;
  loading: boolean;
  error?: string | null;
  errorDetails?: unknown | null;
  estimate?: DraftPreflightEstimate;
  onClose: () => void;
  onProceed: () => void;
}

interface ValidationSummaryEntry {
  heading: string;
  items: string[];
  ariaLabel?: string;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function deriveValidationSummary(details: unknown): ValidationSummaryEntry[] {
  if (!details || typeof details !== 'object') {
    return [];
  }

  const record = details as Record<string, unknown>;
  const summary: ValidationSummaryEntry[] = [];

  if (isStringArray(record.missing_scene_ids)) {
    summary.push({
      heading: 'Missing scene IDs',
      items: record.missing_scene_ids,
      ariaLabel: 'Missing scene IDs',
    });
  }

  return summary;
}

function statusLabel(status: DraftPreflightEstimate['budget']['status'] | undefined): string {
  switch (status) {
    case 'ok':
      return 'Within budget';
    case 'soft-limit':
      return 'Soft limit exceeded';
    case 'blocked':
      return 'Hard limit exceeded';
    default:
      return 'Unknown';
  }
}

function formatAmount(value: number | undefined): string {
  return typeof value === 'number' ? `$${value.toFixed(2)}` : '—';
}

export function PreflightModal({
  isOpen,
  loading,
  error,
  errorDetails,
  estimate,
  onClose,
  onProceed,
}: PreflightModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const validationSummary = deriveValidationSummary(errorDetails);
  const budget = estimate?.budget;
  const status = budget?.status;
  const estimatedUsd = budget?.estimated_usd;
  const softLimit = budget?.soft_limit_usd;
  const hardLimit = budget?.hard_limit_usd;
  const currentSpend = budget?.spent_usd;
  const projectedTotal = budget?.total_after_usd;
  const scenes = estimate?.scenes ?? [];
  const model = estimate?.model;
  const disableProceed = loading || !budget || status === 'blocked' || Boolean(error);

  return (
    <div className="preflight-modal" role="dialog" aria-modal="true" aria-label="Draft preflight">
      <div className="preflight-modal__content">
        <header className="preflight-modal__header">
          <h2>Preflight Check</h2>
          <button type="button" className="preflight-modal__close" onClick={onClose}>
            Close
          </button>
        </header>
        <section className="preflight-modal__body">
          {loading ? (
            <p>Estimating…</p>
          ) : error ? (
            <div className="preflight-modal__error">
              <strong>Unable to complete preflight</strong>
              <p>{error}</p>
              {validationSummary.length > 0 ? (
                <div className="preflight-modal__error-summary" aria-live="polite">
                  <h3 id="preflight-modal-validation-summary-heading">Validation summary</h3>
                  {validationSummary.map((entry) => (
                    <div key={entry.heading} className="preflight-modal__error-summary-section">
                      <p className="preflight-modal__error-summary-title">{entry.heading}</p>
                      <ul
                        className="preflight-modal__error-summary-list"
                        aria-label={entry.ariaLabel ?? entry.heading}
                      >
                        {entry.items.map((item) => (
                          <li key={item} className="preflight-modal__error-summary-item">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : budget ? (
            <>
              <dl className="preflight-modal__summary">
                <dt>Estimate</dt>
                <dd>{formatAmount(estimatedUsd)}</dd>
                <dt>Status</dt>
                <dd>{statusLabel(status)}</dd>
                {model ? (
                  <>
                    <dt>Model</dt>
                    <dd>
                      {model.name}
                      {model.provider ? ` · ${model.provider}` : ''}
                    </dd>
                  </>
                ) : null}
                {typeof currentSpend === 'number' ? (
                  <>
                    <dt>Current spend</dt>
                    <dd>{formatAmount(currentSpend)}</dd>
                  </>
                ) : null}
                {typeof projectedTotal === 'number' ? (
                  <>
                    <dt>Projected total</dt>
                    <dd>{formatAmount(projectedTotal)}</dd>
                  </>
                ) : null}
                {typeof softLimit === 'number' ? (
                  <>
                    <dt>Soft limit</dt>
                    <dd>{formatAmount(softLimit)}</dd>
                  </>
                ) : null}
                {typeof hardLimit === 'number' ? (
                  <>
                    <dt>Hard limit</dt>
                    <dd>{formatAmount(hardLimit)}</dd>
                  </>
                ) : null}
              </dl>
              {budget.message ? (
                <p className="preflight-modal__message">{budget.message}</p>
              ) : null}
              {scenes.length > 0 ? (
                <div className="preflight-modal__scenes" aria-live="polite">
                  <h3>Scenes in this run</h3>
                  <ul className="preflight-modal__scene-list">
                    {scenes.map((scene) => (
                      <li key={scene.id} className="preflight-modal__scene">
                        <span className="preflight-modal__scene-title">{scene.title}</span>
                        <span className="preflight-modal__scene-id">{` (${scene.id})`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <p>No estimate available.</p>
          )}
        </section>
        <footer className="preflight-modal__footer">
          <button
            type="button"
            className="preflight-modal__button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="preflight-modal__button preflight-modal__button--primary"
            onClick={onProceed}
            disabled={disableProceed}
          >
            {status === 'blocked'
              ? 'Blocked'
              : loading
              ? 'Working…'
              : 'Proceed'}
          </button>
        </footer>
      </div>
    </div>
  );
}
