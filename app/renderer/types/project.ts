import type { DraftUnitScope } from '../../shared/ipc/services';

export interface ProjectSummary {
  projectId: string;
  path: string;
  unitScope: DraftUnitScope;
  unitIds: string[];
}

export default ProjectSummary;
