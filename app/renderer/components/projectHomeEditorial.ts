import type { SceneEditorialReview } from '../../shared/ipc/projectLoader';

export function formatReviewActionLabel(action: string): string {
  if (action === 'regenerate_local_repair') {
    return 'Retry Local Repair';
  }
  return action
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function visibleReviewActions(
  review: SceneEditorialReview | null | undefined,
): string[] {
  const actions = review?.review_snapshot?.review_actions ?? [];
  const retryConsumed =
    review?.retry_action_state?.action === 'regenerate_local_repair' &&
    review.retry_action_state.attempt_count >= 1;

  if (review?.accepted_review?.accepted) {
    return actions.filter(
      (action) => action === 'show_flag_reason' || action === 'mark_for_manual_rewrite',
    );
  }
  if (review?.manual_review?.marked) {
    return actions.filter((action) => action !== 'regenerate_local_repair');
  }
  if (review?.retry_action_state?.status === 'succeeded') {
    return actions.filter(
      (action) => action === 'show_flag_reason' || action === 'mark_for_manual_rewrite',
    );
  }
  if (retryConsumed) {
    return actions.filter((action) => action !== 'regenerate_local_repair');
  }
  return actions;
}

export function isWiredReviewAction(action: string): boolean {
  return (
    action === 'accept_current_text' ||
    action === 'regenerate_local_repair' ||
    action === 'mark_for_manual_rewrite' ||
    action === 'clear_manual_review_mark' ||
    action === 'show_flag_reason'
  );
}

export function reviewStatusLabel(review: SceneEditorialReview | null | undefined): string {
  if (review?.manual_review?.marked) {
    return 'Manual review';
  }
  if (review?.accepted_review?.accepted) {
    return 'Accepted';
  }
  if (review?.retry_action_state?.status === 'succeeded') {
    return 'Retry succeeded';
  }
  if (review?.retry_action_state?.status === 'still_flagged') {
    return 'Still flagged';
  }
  if (review?.retry_action_state?.status === 'failed') {
    return 'Retry failed';
  }
  return 'Flagged';
}

export function hasExpandedFlagReason(
  review: SceneEditorialReview | null | undefined,
): boolean {
  if (!review) {
    return false;
  }
  return Boolean(
    review.review_snapshot?.failure_class ||
      review.review_snapshot?.summary ||
      review.review_snapshot?.why_flagged?.length ||
      review.review_snapshot?.targeted_lines?.length ||
      review.carryover_snapshot,
  );
}
