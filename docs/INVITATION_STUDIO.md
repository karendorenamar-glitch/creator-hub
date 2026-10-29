# Kefoo E-Invitation Studio (localhost prototype)

Route: `http://localhost:3000/studio`

This is a separate local-only editor. It does **not** read or write the wedding
database, does not use Supabase storage, and is not linked from the production
wedding dashboard.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000/studio
```

There is no deployment step in this prototype. `npm run build` is only used to
validate the local production build.

## Libraries

- **Fabric.js 7.4** — canvas object model, drag/selection/transform controls,
  textboxes, serialization, PNG/SVG/JSON rendering.
- **jsPDF 4.2** — PDF export (the design is rendered to a high-resolution PNG
  first, then embedded in the PDF).
- Google Fonts CSS — all 20 requested typefaces are loaded explicitly.

## Implemented

- 10 editable templates: Luxury, Pastel Romance, Modern Minimalist, Botanical
  Garden, Classic Elegant, Movie Premiere, Cinderella, La La Land, Vintage
  Cinema, Enchanted Fairytale.
- Compact template gallery with category filter and search.
- Canvas selection, drag/drop, resize, rotate, layer order, duplicate, copy/paste
  (`Ctrl/Cmd+C` / `Ctrl/Cmd+V`), delete, undo/redo.
- Text editing directly on the canvas (double-click), with font family, size,
  weight, italic, alignment, colour, letter spacing, line height, opacity,
  rotation, and position controls.
- 20 font choices, all loaded before render/export.
- Local SVG decoration library for shapes, wedding, cinematic, fairytale, and
  basic graphic categories. Decoration groups can be recoloured.
- Custom image uploads (JPG/PNG/WEBP, max 8 MB) converted to local data URLs and
  added to the canvas; no external upload service.
- Background solid colours, gradients, presets, custom HEX picker, and six
  colour palettes.
- IndexedDB document save/load, autosave status, design list, and delete with
  confirmation.
- Preview modal, PNG export, and PDF export.

## Current limitations

- Image crop is not implemented; Fabric resize/rotate is supported.
- PDF export is raster-based (not a vector PDF).
- The editor is optimised for desktop/tablet; on narrow screens the canvas is
  horizontally scrollable and the properties panel is hidden below the desktop
  breakpoint.
- No authentication or backend persistence is added in this phase.

## Files

- `app/studio/` — route, client wrapper, local CSS.
- `components/invitation-studio/studio-editor.tsx` — editor shell and interactions.
- `lib/invitation-studio/` — document types, templates, fonts, SVG elements,
  Fabric canvas helpers, and IndexedDB storage.
