from PIL import Image, ImageChops
expected = Image.open('app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-win32.png').convert('RGBA')
actual = Image.open('app/test-results/visual.home-Visual-snapshots-home-screen-electron/home-actual.png').convert('RGBA')
if actual.size != expected.size:
    actual = actual.resize(expected.size)
diff = ImageChops.difference(expected, actual)
width, height = diff.size
row_sums = [0] * height
col_sums = [0] * width
pixels = diff.load()
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        total = r + g + b + a
        if total:
            row_sums[y] += total
            col_sums[x] += total
max_row = max(row_sums)
max_col = max(col_sums)
print('row_sums peak', max_row, 'at', [i for i,v in enumerate(row_sums) if v==max_row][:5])
print('col_sums peak', max_col, 'at', [i for i,v in enumerate(col_sums) if v==max_col][:5])
