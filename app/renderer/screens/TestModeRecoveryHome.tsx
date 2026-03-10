import type { ReactElement, ReactNode } from "react";
import type { ProjectHomeProps } from "../components/ProjectHome";
import { TestModeFlatHome } from "./TestModeFlatHome";
import * as testMode from "../testMode/testModeManager";

type TestModeRecoveryHomeProps = {
  wizardPanel: ReactNode;
  projectHomeProps: ProjectHomeProps;
  workspaceHeader?: ReactNode;
  recoveryBanner?: ReactNode;
  onReload?: () => void;
  children: ReactNode;
};

export function TestModeRecoveryHome({
  wizardPanel,
  projectHomeProps,
  workspaceHeader,
  recoveryBanner,
  onReload,
  children,
}: TestModeRecoveryHomeProps): ReactElement {
  if (testMode.isFlat()) {
    return (
      <TestModeFlatHome
        wizardPanel={wizardPanel}
        workspaceHeader={workspaceHeader}
        recoveryBanner={recoveryBanner}
        onReload={onReload}
        {...projectHomeProps}
      />
    );
  }

  return (
    <div data-testid="test-recovery-home" className="test-recovery-home">
      {children}
    </div>
  );
}
