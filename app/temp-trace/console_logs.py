import json
from pathlib import Path
path=Path('app/temp-trace/0-trace.trace')
for line in path.read_text().splitlines():
    if not line.strip():
        continue
    try:
        entry=json.loads(line)
    except json.JSONDecodeError:
        continue
    if entry.get('type')=='console':
        print(entry)
