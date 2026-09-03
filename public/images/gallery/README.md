# Destination photos

Used by the "Popular routes" section on the home page. Until these exist the
tiles render as dark cards with the destination name ghosted across them, which
is a deliberate placeholder rather than a broken image.

Expected filenames:

- `kandy.jpg`
- `galle.jpg`
- `ella.jpg`
- `nuwara-eliya.jpg`
- `yala.jpg`
- `sigiriya.jpg`

Landscape, roughly 5:4 or wider, around 1400 px on the long edge. A flat dark
scrim is drawn over each one so the caption stays readable — bright, busy
photos still work fine.

Filenames are set per destination in `src/lib/data/content.ts`.
