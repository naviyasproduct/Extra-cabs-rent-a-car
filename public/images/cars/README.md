# Fleet photos

Drop the vehicle photos in **this folder**. Nothing else needs to change — the
pages pick them up automatically, and until a file exists the site shows a
branded placeholder tile instead of a broken image.

## Naming

Use the exact filenames below. The first file is the card and hero shot; the
`-2` / `-3` files fill the gallery on the vehicle page. Files already supplied
are marked ✅.

| Vehicle | Files (in order) |
| --- | --- |
| Toyota C-HR | `toyota-chr.png` ✅, `toyota-chr-2.png`, `toyota-chr-3.png` |
| Toyota Prius | `toyota-prius.png` ✅, `toyota-prius-2.png` |
| Suzuki Wagon R Stingray | `suzuki-wagon-r-stingray.png` ✅, `suzuki-wagon-r-stingray-2.png` |
| Toyota Aqua | `toyota-aqua.png` |
| Suzuki Alto | `suzuki-alto.png` |
| Toyota KDH Hiace | `toyota-kdh-hiace.png`, `toyota-kdh-hiace-2.png` |
| Honda Vezel | `honda-vezel.png`, `honda-vezel-2.png` |
| Toyota Premio | `toyota-premio.png` |
| Toyota Land Cruiser Prado | `toyota-land-cruiser-prado.png`, `toyota-land-cruiser-prado-2.png` |
| Nissan Leaf | `nissan-leaf.png` |
| Mercedes-Benz E-Class | `mercedes-benz-e-class.png`, `mercedes-benz-e-class-2.png` |
| Mitsubishi Montero Sport | `mitsubishi-montero-sport.png` |

## What works best

- **Aspect ratio:** roughly 4:3 landscape. Cards crop to 4:3 and the vehicle
  page hero crops to 16:10, so keep the car centred with a little room around it.
- **Size:** 1600 x 1200 px is plenty. Anything larger is wasted — Next.js
  resizes on the fly.
- **Format:** `.png` matches the names above. To use `.jpg` or `.webp` instead,
  update the `images` array for that vehicle in `src/lib/data/cars.ts`.
- **Background:** the three photos supplied so far are **cut-outs on a
  transparent background**, and the site is set up to suit them — vehicle
  images are fitted inside their tile rather than cropped to fill it, so the
  whole car stays visible. Keep the rest of the fleet in the same style. If you
  switch to photographs with real backgrounds instead, change `fit="contain"`
  to `fit="cover"` in `src/components/common/CarImage.tsx`.

## Adding a vehicle that is not listed

Add an entry to the `cars` array in `src/lib/data/cars.ts`, then name the photo
after the `slug` you gave it. The fleet page, filters, category counts, booking
picker and related-vehicle lists all update on their own.
