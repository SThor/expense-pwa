# Version Display

This application automatically displays version information on all pages.

## How it works

1. **Version Generation**: The `scripts/generate-version.js` script automatically generates version information from git at build time.

2. **Version Component**: The `Version` component displays the version information with different variants:

   - `short`: Shows just the commit hash (or tag if available)
   - `full`: Shows the full version string (branch-commit or tag)
   - `branch-commit`: Shows branch@commit format
   - `tag-only`: Shows only git tags, falls back to commit hash

3. **Auto-generation**: The version file is automatically generated:
   - Before each development server start (`npm run dev`)
   - Before each production build (`npm run build`)

## Version Information Displayed

The version information includes:

- **Git Tag**: If available (currently none)
- **Branch**: Current git branch name
- **Commit**: Short commit hash
- **Dirty State**: Shows asterisk (\*) if working directory has uncommitted changes
- **Build Time**: When the version file was generated

## Location

The version is displayed below the main content card on every page. This is implemented directly in the `CenteredCardLayout` component, so it automatically appears on all pages that use this layout (which is all pages in the app).

## Hover Details

Hovering over the version shows detailed information including:

- Full version string
- Branch name
- Commit hash
- Working directory status
- Build timestamp

## Files

- `scripts/generate-version.js`: Version generation script
- `src/version.js`: Auto-generated version information (not committed to git)
- `src/components/Version.jsx`: Version display component
- `src/components/CenteredCardLayout.jsx`: Layout component that displays the version below the card

## Customization

To change the version display:

1. Modify the `Version` component props in `CenteredCardLayout.jsx`
2. Available variants: `short`, `full`, `branch-commit`, `tag-only`
3. Add custom CSS classes via the `className` prop

## Future Considerations

When you create git tags (e.g., `git tag v1.0.0`), the version display will automatically show the tag instead of the branch-commit format.
