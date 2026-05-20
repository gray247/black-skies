import type {
  LoadedProject,
  ProjectIssue,
  ProjectLoadFailure,
} from '../shared/ipc/projectLoader';
import {
  createRuntimeSessionTruthContract,
  type DraftSessionStateClassification,
  type RuntimeSessionTruthContract,
  type SessionLifecycleState,
} from '../shared/runtimeSessionTruth';

export type MainProcessLifecycleSignal =
  | { readonly kind: 'app-startup' }
  | {
      readonly kind: 'project-load-success';
      readonly project: LoadedProject;
      readonly issues: readonly ProjectIssue[];
    }
  | {
      readonly kind: 'project-load-failure';
      readonly errorCode: ProjectLoadFailure['error']['code'];
      readonly issues: readonly ProjectIssue[];
    }
  | { readonly kind: 'graceful-shutdown' };

export interface MainProcessSessionTruthSnapshot {
  readonly signal: MainProcessLifecycleSignal['kind'];
  readonly truth: RuntimeSessionTruthContract;
}

function classifySessionLifecycleState(signal: MainProcessLifecycleSignal): SessionLifecycleState {
  switch (signal.kind) {
    case 'app-startup':
      return 'bootstrap';
    case 'project-load-success':
      return 'project-loaded';
    case 'project-load-failure':
    case 'graceful-shutdown':
      return 'recover-fail-closed';
    default:
      return 'bootstrap';
  }
}

function classifyDraftSessionStateClassifications(
  signal: MainProcessLifecycleSignal,
): DraftSessionStateClassification[] {
  switch (signal.kind) {
    case 'app-startup':
      return ['runtime-only'];
    case 'project-load-success': {
      const classifications: DraftSessionStateClassification[] = ['persisted'];
      if (signal.issues.length > 0) {
        classifications.push('partial');
      }
      return classifications;
    }
    case 'project-load-failure': {
      const classifications: DraftSessionStateClassification[] = ['runtime-only'];
      if (
        signal.errorCode === 'PROJECT_INVALID' ||
        signal.errorCode === 'PROJECT_UNSUPPORTED_VERSION'
      ) {
        classifications.push('recovery-required');
      } else if (signal.issues.length > 0) {
        classifications.push('partial');
      } else {
        classifications.push('partial');
      }
      return classifications;
    }
    case 'graceful-shutdown':
      return ['runtime-only'];
    default:
      return ['runtime-only'];
  }
}

export function createMainProcessSessionTruthSnapshot(
  signal: MainProcessLifecycleSignal,
): MainProcessSessionTruthSnapshot {
  return {
    signal: signal.kind,
    truth: createRuntimeSessionTruthContract({
      sessionLifecycleState: classifySessionLifecycleState(signal),
      draftSessionStateClassifications: classifyDraftSessionStateClassifications(signal),
    }),
  };
}
