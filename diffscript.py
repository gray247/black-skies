from PIL import Image, ImageChops
expected = Image.open('app/tests/e2e/visual.home.spec.ts-snapshots/home-electron-win32.png')
actual = Image.open('app/test-results/visual.home-Visual-snapshots-home-screen-electron/home-actual.png')
if actual.size != expected.size:
    print('size mismatch', expected.size, actual.size)
    actual = actual.resize(expected.size)
    print('resized actual to', actual.size)
diff = ImageChops.difference(expected, actual)
bbox = diff.getbbox()
print('bbox', bbox)
diff.save('tmp_diff.png')
print('diff extrema', diff.getextrema())
print('total diff sum', sum((value for channel in diff.getbands() for value in diff.getchannel(channel).getdata())))
