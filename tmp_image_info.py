from PIL import Image
expected = Image.open('tests/e2e/visual.home.spec.ts-snapshots/home-electron-win32.png')
actual = Image.open('app/test-results/visual.home-Visual-snapshots-home-screen-electron/home-actual.png')
width, height = expected.size
print('expected', width, height, expected.mode)
print('actual', actual.size, actual.mode)
# find first diff
for row in range(height):
    for col in range(width):
        if expected.getpixel((col, row)) != actual.getpixel((col, row)):
            print('first diff at', row, col, expected.getpixel((col, row)), actual.getpixel((col, row)))
            raise SystemExit
print('no diff found')
