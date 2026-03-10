from PIL import Image
expected = Image.open('app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-win32.png')
actual = Image.open('app/test-results/visual.home-Visual-snapshots-home-screen-electron/home-actual.png')
if actual.size != expected.size:
    actual = actual.resize(expected.size)
box = (730, 440, 770, 470)
for y in range(box[1], box[3]):
    row = []
    for x in range(box[0], box[2]):
        exp = expected.getpixel((x, y))
        act = actual.getpixel((x, y))
        if exp != act:
            row.append(f"{exp}->{act}")
        else:
            row.append(".")
    print(y, ' '.join(row))
