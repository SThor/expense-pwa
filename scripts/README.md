# Scripts

This directory contains utility scripts for the project.

## generate-icons.js

Generates all the PWA icons and favicon from the Euro loading spinner SVG.

### Usage

```bash
npm run generate-icons
```

This script will generate:

- `public/favicon.svg` - SVG version of the Euro icon
- `public/favicon.ico` - 32x32 ICO favicon
- `public/favicon-96x96.png` - 96x96 PNG favicon
- `public/apple-touch-icon.png` - 180x180 Apple touch icon
- `public/web-app-manifest-192x192.png` - 192x192 PWA icon
- `public/web-app-manifest-512x512.png` - 512x512 PWA icon

The icons are based on the Euro loading spinner component (`src/components/EuroLoadingSpinner.jsx`) but in a static, non-animated form suitable for use as app icons.

## generate-version.js

Generates version information based on the current git commit.
