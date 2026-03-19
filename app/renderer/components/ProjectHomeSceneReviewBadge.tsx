import type { SceneEditorialReview } from '../../shared/ipc/projectLoader';
import { reviewStatusLabel } from './projectHomeEditorial';

interface ProjectHomeSceneReviewBadgeProps {
  review: SceneEditorialReview;
}

export default function ProjectHomeSceneReviewBadge({
  review,
}: ProjectHomeSceneReviewBadgeProps): JSX.Element {
  return (
    <div className="project-home__scene-review-badge">
      <span>{reviewStatusLabel(review)}</span>
      <span>{review.carryover_snapshot?.carryover_mode ?? 'safe'}</span>
    </div>
  );
}
