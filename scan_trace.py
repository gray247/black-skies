from pathlib import Path
import zipfile
trace_zip = Path('app/test-results/gui.flows-GUI-flow-smoke-tests-budget-indicator-flow-UI--electron/trace.zip')
with zipfile.ZipFile(trace_zip, 'r') as z:
    with z.open('test.trace') as trace:
        for line in trace:
            decoded = line.decode('utf-8', errors='ignore')
            if 'Budget' in decoded or 'expect' in decoded.lower() or 'budget' in decoded:
                print(decoded.strip())
