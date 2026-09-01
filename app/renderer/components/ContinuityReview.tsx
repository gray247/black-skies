import { useId } from 'react';

import type { ContinuityAllowedActionV1, ContinuityFindingV1 } from '../../shared/continuity';

export interface ContinuityReviewProps {
  readonly findings: readonly ContinuityFindingV1[];
  readonly onAction?: (finding: ContinuityFindingV1, action: ContinuityAllowedActionV1) => void;
}

function sourceStatus(currentness: ContinuityFindingV1['currentness']): string {
  return currentness === 'current' ? 'Source available' : `Source ${currentness}`;
}

export default function ContinuityReview({ findings, onAction }: ContinuityReviewProps): JSX.Element {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <section className="continuity-review" aria-labelledby={titleId} aria-describedby={descriptionId} data-testid="continuity-review">
      <header className="continuity-review__header">
        <div>
          <h2 id={titleId}>Continuity review</h2>
          <p id={descriptionId}>Advisory structured findings. Review the cited source before taking any owner-governed action.</p>
        </div>
        <span className="continuity-review__posture">Candidate only</span>
      </header>
      {findings.length === 0 ? (
        <p className="continuity-review__empty" data-testid="continuity-review-empty">No current structured continuity findings are available.</p>
      ) : (
        <div className="continuity-review__table-wrap">
          <table className="continuity-review__table">
            <caption>Source-linked continuity findings</caption>
            <thead><tr><th scope="col">Category</th><th scope="col">Finding</th><th scope="col">Confidence</th><th scope="col">Impact</th><th scope="col">Source</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {findings.map((finding) => (
                <tr key={finding.findingId} data-testid="continuity-finding">
                  <th scope="row">{finding.category}</th>
                  <td><strong>{finding.summary}</strong><span className="continuity-review__evidence">{finding.evidenceSummary}</span><span className="continuity-review__refs">Refs: {finding.evidenceRefs.map((item) => `${item.recordType}/${item.recordId}`).join(', ')}</span></td>
                  <td>{finding.confidenceBand}</td>
                  <td>{finding.impact}</td>
                  <td>{sourceStatus(finding.currentness)}</td>
                  <td>
                    <div className="continuity-review__actions" aria-label={`Actions for ${finding.summary}`}>
                      {finding.allowedActions.map((action) => (
                        <button key={action} type="button" onClick={() => onAction?.(finding, action)}>{action.replace(/-/g, ' ')}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
