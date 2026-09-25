# Rive assets

`rive.wasm` is copied from `@rive-app/canvas` so the runtime never hits a CDN.
If you upgrade `@rive-app/react-canvas`, re-copy it:

    cp node_modules/@rive-app/canvas/rive.wasm public/rive/

## login.riv (optional)

The **Rive State-Machine Character** demo looks for `public/rive/login.riv`.
Download any "animated login character" file from the Rive community
(rive.app/community — search "login") and save it here as `login.riv`.

Expected state machine: `Login Machine` with inputs
- `isChecking` (boolean) — email field focused
- `numLook` (number 0–100) — caret position → where the eyes look
- `isHandsUp` (boolean) — password field focused
- `trigSuccess` / `trigFail` (triggers)

If your file uses different names, edit `RIVE_CONFIG` at the top of
`src/demos/vector/rive-login.tsx`. Without the file, the demo runs a
code-built Motion/SVG character that implements the same state machine.
