# Kefoo Video Invitation Studio

Route: `http://localhost:3000/studio/video`

Local-only prototype. It is separate from the existing `/studio` editor and
does not touch the production wedding dashboard, Supabase schema, storage, or
payment flow.

## Run

```bash
cd /Users/karendorena/creator-hub-wedding
npm run dev
# gallery: http://localhost:3000/studio/video
# editor:  http://localhost:3000/studio/video/editor?template=botanical
```

## Implemented

- Gallery with two categories: five Basic templates and five Movie Inspired
  templates. Basic: Botanical Garden, Pastel Romance, Modern Minimalist,
  Luxury, Classic Elegant. Movie Inspired: Movie Premiere, Cinderella,
  La La Land, Vintage Cinema, Enchanted Fairytale.
- Category filters show 5 Basic, 5 Movie Inspired, or all 10. Each card has a
  static 9:16 preview, animated preview modal, `Preview` action, `Customize`
  action, and a visible video marker. Demo data is labelled.
- Structured invitation data: couple names, wedding/akad/reception dates and
  times, venue name/address, opening message, RSVP, love story, parents, hashtag.
- Canvas 2D renderer shared by gallery, editor, preview, and export.
- Editor with live animated preview, scene timeline, play/pause/seek, scene
  durations, scene order, transitions, and start/end times.
- Layered elements: text, photographs, decorations. Selection, drag, resize,
  rotate, layer order, duplicate, delete, add, undo/redo.
- Text controls: font family (20 loaded fonts), size, weight, italic,
  alignment, colour, line height, letter spacing, opacity, rotation.
- Photo upload, replacement, crop X/Y, zoom, fit, frame, radius.
- Background colour and background photo.
- Optional audio upload for preview and export.
- IndexedDB autosave, manual save, saved drafts list, open/reopen, delete.
- Vertical 9:16 MP4 export at 720×1280 with progress, cancellation, in-modal
  video result, and download. WebM is used only if the browser cannot encode MP4.

## Ten distinct design systems, two categories

The first pass shared one layout builder and one asset vocabulary across all
templates. That has been replaced with ten independent builders in
`lib/video-studio/templates.ts` and template-specific asset collections.

| Template | Typography | Illustration/frame language | Motion |
| --- | --- | --- | --- |
| Botanical Garden | Great Vibes names, Cormorant Garamond support, Montserrat details | Watercolor rose, watercolor spray, organic botanical arch, pressed flower, script butterfly, paper grain | Floral reveals, drifting butterfly, slow dissolves |
| Pastel Romance | Parisienne names, Libre Baskerville headline, Lato details | Scalloped lace, silk ribbon, blush envelope, wax seal, fabric weave | Slide-up reveals, soft fades, one curtain ribbon reveal |
| Modern Minimalist | DM Serif Display names, DM Sans headline/details | Editorial card, asymmetric geometric arch, thin rules, photo arch, no vintage ornament | Slide-left typography, wipes, cinematic zoom |
| Luxury | Bodoni Moda names, Cinzel headline, Cormorant/Montserrat support | Velvet curtain, deco fan, gold rule, spotlight beam, classic seal, velvet folds | Curtain, dramatic zoom, fade |
| Classic Elegant | Pinyon Script names, Cinzel headline, Libre Baskerville details | Engraved frame, acanthus corners, classic seal, symmetrical rules | Slow fades, dissolves, understated wipe |
| Movie Premiere | Playfair Display names, Cinzel headline, Cormorant support | Cinema marquee, premiere spotlight, red carpet, film strip, premiere stars, cinema curtain | Curtain, dramatic zoom, fade, dissolve |
| Cinderella | Allura names, Cinzel headline, Cormorant support | Moonlit castle, glass slipper, silver filigree, fairy stars | Fade, dissolve, royal-ball zoom |
| La La Land | Alex Brush names, Montserrat headline, Playfair support | City skyline, lamp post, night stars, golden glow | City-lights zoom, dissolve, wipe |
| Vintage Cinema | Prata names, Cinzel headline, Libre Baskerville support | Vintage film strip, ticket stub, retro sunburst, film grain | Film-strip slide, wipe, curtain, fade |
| Enchanted Fairytale | Great Vibes names, Cinzel headline, Playfair Display support | Enchanted moon, forest, castle, floral, fairy sparkle | Moonlit dissolve, fade, zoom |

Each template also has its own scene compositions and durations. Typography
tokens are stored separately for names, headlines, supporting copy, event
details, and RSVP. The renderer uses those explicit tokens; it does not apply a
single global style.

The new illustrated assets are original Canvas 2D drawings in
`lib/video-studio/render.ts`: watercolor petals/leaves, an organic botanical
arch, a script butterfly, lace, ribbon, envelope, wax seal, velvet folds, deco
fan, engraved frame, acanthus, and seals. Existing legacy assets remain in the
type union only so older local drafts do not break.

## MP4 strategy (verified locally)

The export uses the browser's native `MediaRecorder` with a canvas
`captureStream(30)`:

- MP4 candidate: `video/mp4;codecs=avc1.42001f,mp4a.40.2`
- MP4 fallback: `video/mp4;codecs=avc1.42001f`, `video/mp4`
- WebM fallback: `video/webm;codecs=vp9,opus` / `vp8`

The optional audio is decoded with Web Audio, connected to a
`MediaStreamDestination`, and added as an audio track to the recorded stream.
The renderer is the same function used by the live preview, so exported frames
match the edited scene state and animation timeline.

Local verification produced a playable `ISO Media, MP4 Base Media` file at
720×1280 with a 17.9 s duration, and a separate 4 s MP4 with audio
(`captureStream().getAudioTracks()` reported one audio track).

## Persistence/security boundary

This phase stores drafts and media locally in IndexedDB:

- Templates are immutable source snapshots; every customization uses a deep
  cloned draft.
- Uploaded media is validated by MIME type and size and stored as data URLs in
  the local browser database. No user file is sent to an external service.
- No Supabase service-role key or secret is used in the client.
- Draft IDs are generated client-side; there is no multi-user server
  authorization layer in this local prototype.

For production, the intended next step is a private Supabase bucket and a
`video_invitation_drafts` table with `wedding_id`, RLS through the existing
`wedding_has_access()` helper, and server actions for draft/media access. That
requires a reviewed migration and production configuration and was intentionally
not added in this local-only iteration.

## Validation performed locally

- `npx tsc --noEmit` — pass.
- `npx eslint app/studio/video components/video-studio lib/video-studio` — pass.
- `npm run build` — pass.
- Existing tests: `node --experimental-strip-types --test tests/*.test.mjs` — 9 suites, 35 checks, 0 failed.
- `npm audit --omit=dev` — 0 vulnerabilities.
- Playwright smoke tests:
  - gallery renders 10 static template canvases and animated preview modal;
  - category filter shows 5 Basic and 5 Movie Inspired;
  - all 10 editor routes open with the correct template;
  - editing a data field changes the canvas output;
  - canvas element selection, resize, rotate, drag, add text, add photo,
    duplicate, delete, undo/redo;
  - photo upload and draft save survive a page reload;
  - scene duration change and scene reorder;
  - saved draft appears in the gallery and reopens from the gallery;
  - desktop and mobile layouts have no horizontal document overflow;
  - MP4 export produced a playable 720×1280, 21.2 s Botanical file;
  - a short export of every template produced a playable 720×1280 MP4,
    including all five Movie Inspired templates;
  - a Movie Premiere draft saved and reopened from the local draft URL;
  - a shorter export with uploaded photo produced a playable MP4;
  - a short export with WAV audio produced a playable MP4 with an audio track.

## Known limitations

- Local drafts are browser-specific; clearing browser data removes them.
- Export is real-time and needs the tab to stay active; it is not a server-side
  render farm.
- MP4 support depends on the browser. It was verified in local Chromium; Safari
  and other browsers should be checked before launch. Browsers without MP4 fall
  back to WebM with a visible notification.
- The UI exports 9:16. The renderer accepts arbitrary target dimensions so a
  16:9 option can be added later, but the 16:9 UI/option is not implemented yet.
- Audio loops through the full video duration when it is shorter than the video.
- There is no direct inline text caret on the canvas; text is selected by click
  and edited from the Properties panel.

## Files

- `app/studio/video/page.tsx` — gallery route.
- `app/studio/video/editor/page.tsx` — editor route.
- `components/video-studio/video-gallery.tsx` — gallery and preview modal.
- `components/video-studio/video-editor.tsx` — editor, content/design/scenes,
  inspector, timeline, export dialog.
- `components/video-studio/editor-stage.tsx` — canvas selection/drag/resize/rotate.
- `components/video-studio/video-canvas.tsx` — animated canvas playback.
- `lib/video-studio/types.ts` — layered data model.
- `lib/video-studio/templates.ts` — ten template definitions and demo data.
- `lib/video-studio/render.ts` — shared Canvas 2D renderer and scene timeline.
- `lib/video-studio/draft.ts` — immutable draft creation and element factories.
- `lib/video-studio/storage.ts` — IndexedDB drafts.
- `lib/video-studio/export.ts` — MediaRecorder MP4/WebM export.
