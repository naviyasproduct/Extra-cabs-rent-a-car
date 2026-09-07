# Fleet photos

## What is here now

Three stock photographs, shared by all twelve vehicles:

| File | Size |
| --- | --- |
| `fleet-01.jpg` | 1920x1280 |
| `fleet-02.jpg` | 1920x1134 |
| `fleet-03.jpg` | 1920x1282 |

They are rotated across the fleet in `src/lib/data/cars.ts` so that
neighbouring tiles in the grid do not show an identical shot. Each vehicle
carries all three, which also fills the gallery on its detail page.

Source: Unsplash, by Olav Tvedt, Peter Broomfield and Tyler Clemmensen. The
originals were 6000px wide and up to 4.7 MB; they were resized to 1920px at
quality 82, which is the cap in `next.config.ts` and cut them by about 92%.

**These are placeholders.** They are not photographs of the actual fleet, and
the same three cars appear under twelve different names. Replace them with real
vehicle photography before launch.

## Adding real photos

Drop the files in this folder and point the vehicle at them in
`src/lib/data/cars.ts`:

```ts
images: [
  "/images/cars/toyota-prius.jpg",
  "/images/cars/toyota-prius-2.jpg",
],
```

The first file is the card and hero shot; the rest fill the gallery on the
vehicle page. Nothing else needs to change, and until a file exists the site
shows a branded placeholder tile rather than a broken image.

## What to supply

- **Landscape**, roughly 3:2 or 16:9. Frames are filled and cropped
  (`object-cover`), so leave a little room around the vehicle.
- **At least 1600px wide.** Anything above 1920px is wasted; resize before
  committing rather than shipping a 5 MB file.
- **Ordinary photographs**, not cut-outs on a transparent background. The site
  used to compensate for transparent PNGs with a pool of light behind each
  vehicle; that has been removed, so a transparent image will now show as a car
  floating on plain black.
