import zipfile
from pathlib import Path
trace = Path('app/test-results/gui.flows-GUI-flow-smoke-tests-budget-indicator-flow-UI--electron/trace.zip')
with zipfile.ZipFile(trace, 'r') as z:
    print(z.namelist())
