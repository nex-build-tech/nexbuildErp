# NexBuild ERP — Logo Pack
by NexBuild Technologies

Four logo directions. Each folder has the same files, so you can choose one and drop it in.

## Files in each option folder
| File | Use |
|---|---|
| svg/logo-horizontal.svg | Main logo for light backgrounds (website header, login page, PDFs) |
| svg/logo-horizontal-white.svg | Logo for dark/navy backgrounds |
| svg/mark.svg / mark-white.svg | Symbol only (sidebar collapsed, watermark) |
| svg/app-icon.svg | Rounded-square app icon |
| png/logo-horizontal*.png | 480 px tall PNGs (transparent, on white, on navy) |
| png/mark-1024.png, mark-white-1024.png | Symbol PNGs |
| png/app-icon-1024/512/192.png | Play Store / PWA / manifest icons |
| favicon/favicon.ico (16/32/48) | Browser tab icon |
| favicon/apple-touch-icon-180.png | iOS home-screen icon |

The SVG text is converted to outlines, so no fonts need to be installed.

## Colours
| Name | Hex | Use |
|---|---|---|
| NexBuild Navy | #12263F | Primary, wordmark, app-icon background |
| Build Amber | #E8A33D | Accent (girder/roof/slab, ERP badge) |
| Slate text | #5B6B7F | Tagline on light backgrounds |
| Mist text | #AFC0D4 | Tagline on dark backgrounds |

Tenant (client) themes, such as Kings gold #C5A04E, should stay inside the app UI. Keep the NexBuild ERP logo in navy and amber.

## Fonts
- Wordmark: Space Grotesk (500 / 700)
- Tagline and UI: Inter

## Usage
- Leave clear space around the logo of at least the height of the "N".
- Minimum width for the horizontal logo is 120 px. Below that, use the mark or app icon.
- Don't stretch, recolour outside the palette, or add shadows.

## Web snippet
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon-180.png">
```
