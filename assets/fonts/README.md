# Brand fonts (build-time only)

These TrueType files are used **only** to generate the static brand assets in
`app/` (`favicon.ico`, `icon.png`, `apple-icon.png`, `opengraph-image.png`,
`twitter-image.png`). They are not shipped to the browser — the site loads its
webfonts via `next/font/google` in `app/layout.tsx`.

- **Cormorant Garamond** (SemiBold) — display wordmark / "V" monogram
- **Inter** (Regular, Medium) — supporting text. Subset to include the ₹
  (U+20B9) glyph, which the default Google Fonts latin subset omits.

Both are licensed under the SIL Open Font License 1.1.

## Regenerate

```bash
python3 scripts/generate-brand-assets.py
```

The script auto-downloads any missing font here from Google Fonts, so this
folder can be deleted and will be repopulated on the next run.
