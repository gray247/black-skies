from PIL import Image, ImageChops
expected = Image.open('app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-win32.png').convert('RGBA')
actual = Image.open('app/test-results/visual.home-Visual-snapshots-home-screen-electron/home-actual.png').convert('RGBA')
if actual.size != expected.size:
    actual = actual.resize(expected.size)
diff = ImageChops.difference(expected, actual)
for y in range(440, 470):
    line = []
    for x in range(730, 770):
        r, g, b, a = diff.getpixel((x, y))
        total = r + g + b + a
        line.append(total)
    print(y, line)
