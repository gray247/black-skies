from pathlib import Path
path = Path('app/temp-trace/0-trace.trace')
for i,line in enumerate(path.read_text().splitlines()):
    if 200 <= i <= 320:
        print(f"{i:03}: {line}")
