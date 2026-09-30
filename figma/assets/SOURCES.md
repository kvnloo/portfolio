# Original design assets

Source: [website Figma](https://www.figma.com/design/fZ4xxz3KZ9Dy48cgMNNnHUkL/website?node-id=319-48), inspected 2026-09-30.

The nine SVGs were exported directly from their original Figma nodes, unmodified. They are external image files with their intrinsic SVG dimensions preserved. No screenshot crops, redrawn vectors, or temporary Figma URLs are used by the implementation.

| File | Original node | Intrinsic size | Slot |
| --- | --- | --- | --- |
| synchrony-mark.svg | 319:49 | 54×54 | Overview/selected mark at x24,y291 |
| synchrony-outline.svg | 319:59 | 52×60 | x25.02,y288 |
| amazon-tile.svg | 319:60 | 78×78 | Overview x11,y356; selected x12,y318 |
| unidentified-tile.svg | 319:70 | 78×78 | Overview x12,y542 |
| dot-amazon.svg | 2:279 | 12×12 | Compact Amazon marker |
| dot-bcbs.svg | 2:281 | 12×12 | Compact BCBS marker |
| dot-unidentified.svg | 2:284 | 12×12 | Compact unidentified marker |
| dot-synchrony.svg | 319:90 | 12×12 | Compact Synchrony marker |
| scroll-chevron.svg | 319:58 | 21×12 | Bottom-left navigation, already downward-oriented |

`manifest.json` records file sizes and viewBoxes. The dots already contain their source 50% opacity. The chevron needs no further rotation. The main original BCBS tile (319:65) and Resources artwork (326:99) could not be fully exported. They remain explicitly pending rather than fabricated.

## Typeface

`Inter.woff2` is the preinstalled Inter Variable font, unchanged from the installed Blender distribution. Its embedded metadata identifies Inter 4.000 (`git-a52131595`), copyright 2016 The Inter Project Authors, and SIL Open Font License 1.1. It supports weight 100–900 and optical size 14–32. This is Inter, not a Figma-exported font; exact glyph parity with an unspecified historical Figma version remains unverified.

The original upstream [Inter license](https://github.com/rsms/inter/blob/master/LICENSE.txt) is included unchanged as `Inter-LICENSE.txt`.
