from PIL import Image
import numpy as np
img = Image.open('app/test-results/visual.home-Visual-snapshots-home-screen-electron/home-diff.png').convert('RGB')
arr = np.array(img)
nonzero = np.any(arr != 0, axis=2)
coords = list(zip(*np.where(nonzero)))
if not coords:
    print('no non-zero pixels')
else:
    min_row = min(r for r,c in coords)
    max_row = max(r for r,c in coords)
    min_col = min(c for r,c in coords)
    max_col = max(c for r,c in coords)
    print('bounding box', min_row, max_row, min_col, max_col)
    print('total non-zero', len(coords))
    print('sample pixel at', coords[0], 'value', arr[coords[0]])
