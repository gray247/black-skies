import React from 'react';

import type { DraftPreflightEstimate } from '../../shared/ipc/services';

interface PreflightModalProps {
  isOpen: boolean;
  loading: boolean;
  error?: string | null;
  estimate?: DraftPreflightEstimate;
  onClose: () => void;
  onProceed: () => void;
}

function statusLabel(status: DraftPreflightEstimate['budget']['status']): string {
  switch (status) {
    case 'ok':
      return 'Within budget';
    case 'soft-limit':
      return 'Soft limit exceeded';
    case 'blocked':
      return 'Hard limit exceeded';
    case 'offline':
      return 'Offline estimate';
    default:
      return status;
  }
}

export function PreflightModal({
  isOpen,
  loading,
  error,
  estimate,
  onClose,
  onProceed,
}: PreflightModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const budget = estimate?.budget;
  const status = budget?.status ?? 'offline';
  const estimatedUsd = budget?.estimated_usd ?? 0;
  const disableProceed =
    loading || status === 'blocked' || status === 'offline' || Boolean(error);

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
            </div>
          ) : budget ? (
            <>
              <dl className="preflight-modal__summary">
                <dt>Estimate</dt>
                <dd>${estimatedUsd.toFixed(2)}</dd>
                <dt>Status</dt>
                <dd>{statusLabel(status)}</dd>
                {budget.soft_limit_usd ? (
                  <>
                    <dt>Soft limit</dt>
                    <dd>${budget.soft_limit_usd.toFixed(2)}</dd>
                  </>
                ) : null}
                {budget.hard_limit_usd ? (
                  <>
                    <dt>Hard limit</dt>
                    <dd>${budget.hard_limit_usd.toFixed(2)}</dd>
                  </>
                ) : null}
              </dl>
              {budget.message ? (
                <p className="preflight-modal__message">{budget.message}</p>
              ) : null}
              {status === 'offline' ? (
                <p className="preflight-modal__todo">
                  TODO: Replace with connected UI once services expose a budget endpoint.
                </p>
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
              : status === 'offline'
              ? 'Offline'
              : loading
              ? 'Working…'
              : 'Proceed'}
          </button>
        </footer>
      </div>
    </div>
  );
}
