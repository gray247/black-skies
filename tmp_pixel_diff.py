from PIL import Image
expected = Image.open('app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-win32.png')
actual = Image.open('app/test-results/visual.home-Visual-snapshots-home-screen-electron/home-actual.png')
center_col = 749
center_row = 454
radius = 30
for row in range(center_row - radius, center_row + radius + 1):
    exp_row = [expected.getpixel((col, row)) for col in range(center_col - radius, center_col + radius + 1)]
    act_row = [actual.getpixel((col, row)) for col in range(center_col - radius, center_col + radius + 1)]
    diffs = [(col, exp_row[col - (center_col-radius)], act_row[col - (center_col-radius)]) for col in range(center_col - radius, center_col + radius + 1) if exp_row[col - (center_col-radius)] != act_row[col - (center_col-radius)] ]
    if diffs:
        print(f"row {row} diffs:")
        for col, exp, act in diffs:
            print(f" col {col}: exp={exp}, act={act}")
        print()
