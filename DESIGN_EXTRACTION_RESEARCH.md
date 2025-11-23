# Website Design Extraction Research Guide

**Research Date:** November 23, 2025
**Purpose:** Comprehensive guide for extracting colors, fonts, and design tokens from existing websites

---

## Table of Contents
1. [Browser DevTools for Inspecting Colors and Fonts](#browser-devtools)
2. [Automated Color Palette Extraction](#color-extraction)
3. [Font Detection Tools and Browser Extensions](#font-detection)
4. [CSS Variable Extraction Techniques](#css-variable-extraction)
5. [Color Scheme Analysis and Generation Tools](#color-scheme-analysis)
6. [Font Pairing Detection and Analysis](#font-pairing)
7. [Gradient Extraction and Recreation](#gradient-extraction)
8. [Shadow and Effect Parameter Extraction](#shadow-extraction)
9. [Detailed Guidance](#guidance)
   - [Tools for Automated Extraction](#automated-tools)
   - [Manual Inspection Techniques](#manual-techniques)
   - [Design Token Organization](#token-organization)
   - [CSS Custom Properties Strategy](#css-properties-strategy)
   - [Accuracy Validation Methods](#validation-methods)

---

## <a name="browser-devtools"></a>1. Browser DevTools for Inspecting Colors and Fonts

### Accessing DevTools
**Quick Access Methods:**
- **Right-click** on any element and select "Inspect"
- **Keyboard shortcuts:**
  - Windows/Linux: `Ctrl + Shift + I`
  - Mac: `Cmd + Option + I`

### Color Inspection Features

#### Color Picker
1. Navigate to the **Styles** or **Computed** panel
2. Click on the **color swatch** (small colored circle) next to any color property
3. A color picker opens showing:
   - Real-time color adjustments
   - Multiple format options (HEX, RGB, HSL, CMYK)
   - Suggested accessible alternatives
   - Color contrast ratios

#### CSS Overview Tool (Chrome)
- **Access:** Three-dot menu → More tools → CSS Overview
- **Features:**
  - Shows all colors on the page grouped by type (background, text, borders)
  - Click any color to see elements using it
  - Identifies low contrast issues
  - Displays color counts and distribution

#### Color Contrast Checking
Chrome DevTools can:
- Inspect HD and non-HD colors
- Show text with low contrast issues
- Provide WCAG accessibility compliance information
- Suggest accessible color alternatives

### Font Inspection

#### Font Info Section (CSS Overview)
- Displays all fonts on the page
- Groups by:
  - Font size
  - Font weight
  - Line height
- Click occurrences to view affected elements

#### Styles Panel
- Shows applied font properties:
  - `font-family`
  - `font-size`
  - `font-weight`
  - `line-height`
  - `letter-spacing`
  - `text-transform`
- Indicates inheritance chain
- Shows overridden styles (struck through)

#### Computed Panel
- Displays final computed font values
- Shows resolved sizes (converts rem/em to px)
- Useful for verifying actual rendered values

---

## <a name="color-extraction"></a>2. Automated Color Palette Extraction from Screenshots

### Top Color Extraction Tools (2025)

#### 1. **Colorize.design**
- **Method:** Analyzes screenshots, favicons, CSS, HTML, and JS files
- **Features:**
  - Intelligent color grouping
  - Automatic color naming
  - Multiple export formats:
    - CSS variables
    - SASS/SCSS variables
    - Design tool palettes (Figma, Sketch, Adobe)
  - Pro users get API access for workflow integration
- **URL:** https://extractcolorpalettes.com/

#### 2. **ExtractColorPalettes.com**
- **Features:**
  - Converts each color to HEX, RGB, HSL, CMYK
  - Automatic WCAG accessibility compliance analysis
  - Export formats:
    - CSS variables
    - Figma color libraries
    - Adobe swatches
    - Development-ready code
- **Best for:** Accessibility-focused projects

#### 3. **Folge.me Website Color Extractor**
- **Technology:** Puppeteer + Color Thief algorithm
- **Features:**
  - Full-page screenshot capture
  - Identifies dominant colors
  - Generates palettes up to 10 colors
  - Provides HEX, RGB, and HSL values
- **URL:** https://folge.me/tools/website-color-extractor

#### 4. **ToolsSpark Webpage Color Scheme Extractor**
- **Features:**
  - Extracts up to 12 main colors
  - Ranks by visual prominence
  - Ideal for identifying primary, secondary, and accent palettes
  - Provides HEX, RGB, and HSL formats
- **URL:** https://toolsspark.com/webpage-color-scheme-extractor

#### 5. **ScreenScout Color Palette Extractor**
- **Features:**
  - Website color scheme analysis
  - Quick palette extraction from URLs
  - Design-ready export formats
- **URL:** https://screenscout.io/tools/color-extractor

#### 6. **Extract Colors DevTool (Chrome Extension)**
- **Features:**
  - Color picker
  - Palette extractor (hex, rgb, css custom variables)
  - Cache clearing
  - Full-page screenshot
  - Window resizer
- **Install:** Chrome Web Store

---

## <a name="font-detection"></a>3. Font Detection Tools and Browser Extensions

### Top Font Detection Extensions (2025)

#### 1. **WhatFont**
- **Platforms:** Chrome, Firefox, Safari, Internet Explorer
- **Features:**
  - Hover to view font name instantly
  - Shows font size, weight, line-height
  - Extremely simple and fast
  - Zero configuration needed
- **Best for:** Quick font identification
- **Install:** Chrome Web Store

#### 2. **Fonts Ninja**
- **Platforms:** Chrome, Firefox, Safari
- **Features:**
  - Identifies fonts on any website
  - Try fonts before purchasing
  - Bookmark favorite fonts
  - Compare similar fonts
  - Download options for licensed fonts
- **Best for:** Professional designers and font shoppers
- **URL:** https://fonts.ninja/tools

#### 3. **Font Finder**
- **Platforms:** Chrome, Firefox, Opera
- **Features:**
  - Comprehensive font analysis
  - Captures extensive details:
    - Font family, size, weight
    - Line height, letter spacing
    - Font color, background color
    - Text rendering properties
  - Copy any information to clipboard
  - Inline editing to test changes
- **Best for:** Developers and typographers
- **Install:** Chrome Web Store, Firefox Add-ons

#### 4. **Fontanello**
- **Platforms:** Chrome, Firefox, Edge, iOS
- **Features:**
  - Advanced font information
  - Originally for professional web developers
  - Shows CSS properties
  - Identifies web fonts and system fonts
- **Best for:** Advanced typography analysis

#### 5. **WhatFontIs**
- **Unique Feature:** Identifies fonts used in IMAGES
- **Process:**
  - Upload image with text
  - AI identifies font family
  - Suggests similar alternatives if exact match not found
- **Best for:** Logo and graphic design analysis

#### 6. **Font Picker**
- **Downloads:** 30,000+
- **Features:**
  - Speed and accuracy focused
  - Quick font identification
  - Clean interface
- **Best for:** Fast workflow

---

## <a name="css-variable-extraction"></a>4. CSS Variable Extraction Techniques

### Browser-Based Extraction

#### Method 1: Chrome DevTools Built-in
1. Right-click element → Inspect
2. In Styles panel, look for CSS custom properties:
   ```css
   --primary-color: #007bff;
   --font-size-base: 1rem;
   ```
3. Chrome 77+ allows "Copy Styles":
   - Right-click element in Elements panel
   - Copy → Copy styles
   - Includes inherited styles and custom CSS variables

#### Method 2: Extract from Computed Styles
1. Navigate to Computed panel
2. Check "Show all" to see inherited variables
3. Filter by typing `--` to see only custom properties
4. Right-click values to copy

#### Method 3: Console JavaScript Method
```javascript
// Paste this in console to extract all CSS variables
function extractCSSVariables(element = document.documentElement) {
  const styles = getComputedStyle(element);
  const cssVars = {};

  for (let i = 0; i < styles.length; i++) {
    const prop = styles[i];
    if (prop.startsWith('--')) {
      cssVars[prop] = styles.getPropertyValue(prop).trim();
    }
  }

  return cssVars;
}

// Extract from :root
const rootVars = extractCSSVariables();
console.table(rootVars);

// Copy to clipboard as JSON
copy(JSON.stringify(rootVars, null, 2));
```

### Tools and Extensions

#### **token2variablizer** (Chrome Extension)
- Paste design tokens
- Click "COPY-VARIABLE"
- Copies correctly formatted CSS variable to clipboard
- Supports various token formats

#### **Token CSS**
- Define tokens in JSON format
- Author CSS using token names as values
- Automatically converts to custom properties
- Build-time transformation

### Source File Extraction

1. Open DevTools → Sources panel
2. Navigate to CSS files in file tree
3. Search for `:root` or `--` to find variable definitions
4. Copy entire `:root` block:
   ```css
   :root {
     --color-primary: #007bff;
     --color-secondary: #6c757d;
     --spacing-unit: 8px;
     --font-family-base: 'Inter', sans-serif;
   }
   ```

---

## <a name="color-scheme-analysis"></a>5. Color Scheme Analysis and Generation Tools

### Analysis Tools

#### **CSS Overview (Chrome DevTools)**
- **Access:** DevTools → More tools → CSS Overview
- **Capabilities:**
  - Complete color inventory
  - Groups by usage (background, text, border, fill)
  - Contrast issues identification
  - Unused colors detection
  - Media query analysis

#### **Extract Colors DevTool (Chrome Extension)**
- Real-time color extraction
- Export as CSS custom variables
- Automatic categorization
- Color frequency analysis

### Color Palette Generators

While primarily for creation, these tools help analyze extracted colors:

#### **Coolors.co**
- Import existing palettes
- Analyze color relationships
- Generate variations and tints
- Export in multiple formats

#### **Adobe Color**
- Upload images to extract palettes
- Analyze color harmony
- Accessibility checker
- Export to various formats

### Accessibility Analysis

#### **WebAIM Contrast Checker**
- Test color contrast ratios
- WCAG AA/AAA compliance
- Integrated with DevTools
- Suggests accessible alternatives

#### **Color Contrast Analyzer (Browser Extension)**
- Real-time contrast checking
- WCAG 2.1 compliance
- Visual overlay of issues
- Batch testing

---

## <a name="font-pairing"></a>6. Font Pairing Detection and Analysis

### AI-Powered Detection Tools (2025)

#### **Fontjoy**
- **Technology:** Deep learning AI
- **Features:**
  - Suggests font combinations
  - Adjustable contrast levels (high, balanced, similar)
  - Real-time preview
  - Locks individual fonts while generating alternatives
- **URL:** https://fontjoy.com/
- **Best for:** Finding similar or complementary pairings

#### **Monotype Font Pairing Generator**
- **Technology:** AI-powered matching
- **Features:**
  - Professional font recommendations
  - Commercial font library access
  - Contextual suggestions
- **URL:** https://www.monotype.com/font-pairing

### Analysis and Testing Tools

#### **FontsDiff**
- **Features:**
  - Google Fonts tester
  - Side-by-side comparison
  - X-Height and Cap-Height analysis
  - Precise font proportion insights
  - Visual metrics comparison
- **URL:** https://fontsdiff.com/
- **Best for:** Technical typography analysis

#### **Typ.io: Fonts that go together**
- **Unique Approach:** Analyzes real websites
- **Features:**
  - Reveals actual designer decisions
  - Shows fonts used on beautiful websites
  - Displays implementation context
  - Real-world pairing examples
- **URL:** https://typ.io/
- **Best for:** Finding proven, production-ready pairings

#### **FontPair**
- **Focus:** Google Fonts combinations
- **Features:**
  - Curated pairings
  - Visual examples
  - Free font resources
  - Updated for 2025
- **URL:** https://www.fontpair.co/

#### **Elementor Font Pairing Tool**
- **Features:**
  - Live preview with custom text
  - Readability assessment
  - Contrast evaluation
  - Real-time adjustments
  - Export CSS code
- **URL:** https://elementor.com/tools/font-pairing-tool/

### Font Matching from Images

#### **Fontspring Matcherator**
- Upload image with text
- AI identifies font
- Shows similar alternatives if exact match unavailable
- Database of commercial and free fonts

---

## <a name="gradient-extraction"></a>7. Gradient Extraction and Recreation

### Inspector Tools

#### **CSS Gradient Inspector (Chrome Extension)**
- **Features:**
  - Extends Developer Tools with gradient sidebar
  - Displays gradient information for inspected elements
  - Toggle individual gradient layers
  - Copy gradient CSS code
  - Visual gradient editor
- **Install:** Chrome Web Store

### Manual DevTools Method

1. Inspect element with gradient
2. In Styles panel, locate gradient property:
   ```css
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   ```
3. Click color swatches to adjust
4. Copy entire gradient declaration

### Gradient Recreation Tools (2025)

#### **CSS Gradient Generator (Various)**
While primarily for creation, useful for recreating extracted gradients:
- Adjust angle, colors, and stop positions
- Preview in real-time
- Generate CSS code
- Support for linear, radial, and conic gradients

### Gradient Shadow Techniques

**Important Note:** The native `box-shadow` property only supports solid colors, not gradients.

#### **Workaround Methods:**
1. **Pseudo-element technique:**
   ```css
   .element {
     position: relative;
   }

   .element::after {
     content: '';
     position: absolute;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background: linear-gradient(45deg, rgba(0,0,0,0.2), rgba(0,0,0,0));
     filter: blur(10px);
     z-index: -1;
   }
   ```

2. **Multiple box-shadows:**
   - Layer multiple solid-color shadows
   - Creates gradient effect through opacity variation

#### **Alvaro Trigo's CSS Shadow Gradients Generator**
- Visual editor for gradient shadows
- Uses linear-gradient for background property
- Generates complete CSS code
- Real-time preview
- **URL:** https://alvarotrigo.com/shadow-gradients/

---

## <a name="shadow-extraction"></a>8. Shadow and Effect Parameter Extraction

### DevTools Extraction

#### Method 1: Styles Panel
1. Inspect element with shadow
2. Locate `box-shadow` or `filter: drop-shadow()` property
3. Copy complete declaration:
   ```css
   box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
               0 2px 4px -1px rgba(0, 0, 0, 0.06);
   ```

#### Method 2: Computed Panel
1. Navigate to Computed tab
2. Search for "shadow"
3. See final computed values
4. Useful for resolved inherited shadows

### Shadow Analysis

#### Parameters to Extract:
```css
box-shadow: [horizontal offset] [vertical offset] [blur radius] [spread radius] [color];
```

Example breakdown:
```css
box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
/*          ↑  ↑   ↑    ↑    ↑
 *          x  y  blur spread color
 */
```

#### Multiple Shadows:
```css
box-shadow:
  0 1px 3px rgba(0,0,0,0.12),    /* Subtle near shadow */
  0 8px 24px rgba(0,0,0,0.15);   /* Larger ambient shadow */
```

### Shadow Generator Tools

#### **Neumorphism.io**
- **Focus:** Soft UI / Neumorphic design
- **Features:**
  - CSS code generator
  - Color, gradient, and shadow tools
  - Real-time preview
  - Copy-paste ready code
- **URL:** https://neumorphism.io/

#### **Box Shadow CSS Generator**
- Visual editor
- Multiple shadow layers
- Inset shadows support
- Live preview
- Export CSS code

### Filter Effects Extraction

#### Common Filter Properties:
```css
filter:
  blur(5px)
  brightness(1.2)
  contrast(1.1)
  drop-shadow(0 4px 6px rgba(0,0,0,0.1))
  grayscale(0.5)
  hue-rotate(90deg)
  invert(0)
  opacity(0.9)
  saturate(1.2)
  sepia(0);
```

#### Backdrop Filter:
```css
backdrop-filter: blur(10px) saturate(180%);
```

---

## <a name="guidance"></a>9. Detailed Guidance

## <a name="automated-tools"></a>Tools for Automated Color/Font Extraction

### Complete Workflow Toolkit

#### **For Initial Website Analysis:**
1. **CSS Overview (Chrome DevTools)** - Free, built-in
   - Get complete inventory of colors and fonts
   - Identify accessibility issues
   - No installation required

2. **Colorize.design or ExtractColorPalettes.com** - Free
   - Automated color extraction from URL
   - Export in developer-friendly formats
   - WCAG compliance checking

3. **Fonts Ninja or WhatFont** - Free browser extensions
   - Quick font identification
   - Font metrics capture
   - Try-before-buy features

#### **For Deep Analysis:**
1. **FontsDiff** - Free
   - Detailed typography comparison
   - X-height and cap-height analysis
   - Google Fonts focus

2. **Typ.io** - Free
   - Real-world font pairing examples
   - See implementation in context
   - Professional inspiration

3. **CSS Gradient Inspector** - Free extension
   - Extract complex gradients
   - Layer-by-layer analysis
   - Copy-paste ready code

#### **For Production Export:**
1. **Extract Colors DevTool** - Chrome extension
   - Export as CSS variables directly
   - Color frequency analysis
   - Screenshot capabilities

2. **Font Finder** - Browser extension
   - Complete font metrics
   - Copy to clipboard
   - All CSS properties included

### Recommended Workflow

```
Step 1: Browser DevTools
└─→ CSS Overview to inventory all colors/fonts

Step 2: Automated Extraction
├─→ Colorize.design for color palette
├─→ Fonts Ninja for font identification
└─→ CSS Gradient Inspector for gradients

Step 3: Analysis & Validation
├─→ FontsDiff for typography metrics
├─→ WCAG contrast checker for accessibility
└─→ Typ.io for pairing inspiration

Step 4: Export
└─→ Format as design tokens (JSON/CSS)
```

---

## <a name="manual-techniques"></a>Manual Inspection Techniques

### Color Extraction Process

#### 1. **Systematic Element Inspection**
```
Header/Navigation
├─→ Background colors
├─→ Text colors (default, hover, active)
├─→ Border colors
└─→ Icon colors

Content Areas
├─→ Primary background
├─→ Secondary background
├─→ Text hierarchy (h1-h6, body, caption)
└─→ Link colors (default, visited, hover, active)

Buttons & Interactive Elements
├─→ Primary button (background, text, border)
├─→ Secondary button variants
├─→ Disabled states
├─→ Focus/active states
└─→ Hover transitions

Semantic Colors
├─→ Success (green variants)
├─→ Warning (yellow/orange variants)
├─→ Error (red variants)
└─→ Info (blue variants)

Neutral Palette
├─→ Blacks and grays (text, borders, backgrounds)
└─→ White and off-white variants
```

#### 2. **Color Documentation Template**
```css
/* Primary Colors */
--color-primary-50: #...;    /* Lightest tint */
--color-primary-100: #...;
--color-primary-200: #...;
/* ... */
--color-primary-900: #...;   /* Darkest shade */

/* Secondary Colors */
/* ... similar structure ... */

/* Semantic Colors */
--color-success: #...;
--color-warning: #...;
--color-error: #...;
--color-info: #...;

/* Neutral Colors */
--color-white: #...;
--color-gray-50: #...;
/* ... */
--color-gray-900: #...;
--color-black: #...;
```

### Font Extraction Process

#### 1. **Typography Hierarchy Analysis**
```
Headings
├─→ H1: font-family, size, weight, line-height, letter-spacing
├─→ H2: (same properties)
├─→ H3-H6: (same properties)

Body Text
├─→ Default: font-family, size, weight, line-height
├─→ Large: (for lead paragraphs)
└─→ Small: (for captions, footnotes)

UI Elements
├─→ Buttons
├─→ Navigation
├─→ Forms (inputs, labels, placeholders)
└─→ Tables

Specialty Text
├─→ Code/Monospace
├─→ Quotes/Blockquotes
└─→ Emphasis (bold, italic)
```

#### 2. **Font Documentation Template**
```css
/* Font Families */
--font-family-primary: 'Inter', sans-serif;
--font-family-secondary: 'Merriweather', serif;
--font-family-mono: 'Fira Code', monospace;

/* Font Sizes */
--font-size-xs: 0.75rem;      /* 12px */
--font-size-sm: 0.875rem;     /* 14px */
--font-size-base: 1rem;        /* 16px */
--font-size-lg: 1.125rem;      /* 18px */
--font-size-xl: 1.25rem;       /* 20px */
--font-size-2xl: 1.5rem;       /* 24px */
--font-size-3xl: 1.875rem;     /* 30px */
--font-size-4xl: 2.25rem;      /* 36px */

/* Font Weights */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

/* Letter Spacing */
--letter-spacing-tight: -0.025em;
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.025em;
```

### Shadow and Spacing Extraction

#### 1. **Shadow Inventory**
```css
/* Elevation Shadows */
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);

/* Focus States */
--shadow-outline: 0 0 0 3px rgba(66, 153, 225, 0.5);
```

#### 2. **Spacing Scale**
```css
/* Spacing (typically based on 4px or 8px) */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

### Border and Radius Extraction

```css
/* Border Widths */
--border-width-thin: 1px;
--border-width-base: 2px;
--border-width-thick: 4px;

/* Border Radius */
--radius-sm: 0.125rem;   /* 2px */
--radius-base: 0.25rem;  /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-full: 9999px;   /* Fully rounded */
```

---

## <a name="token-organization"></a>How to Organize Extracted Design Tokens

### Design Token Architecture (W3C Specification 2025)

Based on the October 2025 W3C Design Tokens Specification:

#### **Naming Structure**
The recommended structure follows this pattern:
```
[category]-[property]-[variant]-[modifier]-[state]
```

Examples:
```css
/* Good - Semantic naming */
--color-button-primary-background-hover
--color-text-heading-primary
--font-size-heading-large
--spacing-component-padding-horizontal

/* Bad - Presentational naming */
--blue-button
--big-text
--20px-space
```

### Three-Tier Token System

#### **1. Primitive/Foundation Tokens**
Raw values - the source of truth
```css
/* primitives/colors.css */
:root {
  /* Blue scale */
  --primitive-blue-50: #eff6ff;
  --primitive-blue-100: #dbeafe;
  --primitive-blue-500: #3b82f6;
  --primitive-blue-900: #1e3a8a;

  /* Gray scale */
  --primitive-gray-50: #f9fafb;
  --primitive-gray-900: #111827;

  /* Font families */
  --primitive-font-sans: 'Inter', system-ui, sans-serif;
  --primitive-font-serif: 'Merriweather', Georgia, serif;

  /* Base measurements */
  --primitive-spacing-unit: 0.25rem; /* 4px base */
}
```

#### **2. Semantic/Decision Tokens**
Context-specific meanings
```css
/* tokens/semantic.css */
:root {
  /* Brand colors - what they mean */
  --color-brand-primary: var(--primitive-blue-500);
  --color-brand-secondary: var(--primitive-gray-700);

  /* Semantic colors - communication */
  --color-success: var(--primitive-green-500);
  --color-warning: var(--primitive-yellow-500);
  --color-error: var(--primitive-red-500);
  --color-info: var(--primitive-blue-500);

  /* Text colors - purpose-based */
  --color-text-primary: var(--primitive-gray-900);
  --color-text-secondary: var(--primitive-gray-600);
  --color-text-disabled: var(--primitive-gray-400);
  --color-text-inverse: var(--primitive-white);

  /* Background colors */
  --color-background-primary: var(--primitive-white);
  --color-background-secondary: var(--primitive-gray-50);
  --color-background-elevated: var(--primitive-white);

  /* Typography semantic */
  --font-heading: var(--primitive-font-sans);
  --font-body: var(--primitive-font-sans);
  --font-code: var(--primitive-font-mono);
}
```

#### **3. Component Tokens**
Specific component implementations
```css
/* components/button.css */
:root {
  /* Button Primary */
  --button-primary-background: var(--color-brand-primary);
  --button-primary-background-hover: var(--primitive-blue-600);
  --button-primary-background-active: var(--primitive-blue-700);
  --button-primary-background-disabled: var(--primitive-gray-300);

  --button-primary-text: var(--primitive-white);
  --button-primary-text-disabled: var(--primitive-gray-500);

  --button-primary-border: transparent;
  --button-primary-border-hover: transparent;

  /* Button spacing */
  --button-padding-y: calc(var(--primitive-spacing-unit) * 2);
  --button-padding-x: calc(var(--primitive-spacing-unit) * 4);
  --button-radius: var(--radius-base);

  /* Button typography */
  --button-font-size: var(--font-size-base);
  --button-font-weight: var(--font-weight-medium);
  --button-line-height: var(--line-height-tight);
}
```

### File Organization Structure

```
/design-tokens/
├── primitives/
│   ├── colors.css           # Raw color values
│   ├── typography.css       # Font families, base sizes
│   ├── spacing.css          # Base spacing unit, scale
│   ├── borders.css          # Border widths, radius
│   └── shadows.css          # Raw shadow definitions
│
├── semantic/
│   ├── colors.css           # Semantic color assignments
│   ├── typography.css       # Semantic type scale
│   ├── spacing.css          # Semantic spacing scale
│   └── elevation.css        # Semantic shadow usage
│
├── components/
│   ├── button.css
│   ├── card.css
│   ├── form.css
│   ├── navigation.css
│   └── ...
│
├── themes/
│   ├── light.css            # Light theme overrides
│   ├── dark.css             # Dark theme overrides
│   └── high-contrast.css    # Accessibility theme
│
└── index.css                # Main import file
```

### Industry-Standard Naming Patterns

#### **Carbon Design System Pattern**
```css
--[category]-[concept]-[property]-[variant]-[state]

Examples:
--background-layer-01
--text-primary
--button-primary-hover
--border-subtle-01
```

#### **Material Design Pattern**
```css
--md-[component]-[element]-[property]-[state]

Examples:
--md-sys-color-primary
--md-sys-color-on-primary
--md-comp-button-background
```

#### **Tailwind-Inspired Pattern**
```css
--[property]-[variant]-[scale]

Examples:
--color-blue-500
--spacing-4
--text-lg
--shadow-md
```

### Token Export Formats

#### **CSS Custom Properties**
```css
:root {
  --color-primary: #007bff;
  --spacing-4: 1rem;
}
```

#### **JSON (for tooling)**
```json
{
  "color": {
    "primary": {
      "$value": "#007bff",
      "$type": "color",
      "$description": "Primary brand color"
    }
  },
  "spacing": {
    "4": {
      "$value": "1rem",
      "$type": "dimension"
    }
  }
}
```

#### **SCSS Variables**
```scss
$color-primary: #007bff;
$spacing-4: 1rem;
```

#### **JavaScript/TypeScript**
```typescript
export const tokens = {
  color: {
    primary: '#007bff',
  },
  spacing: {
    4: '1rem',
  },
} as const;
```

---

## <a name="css-properties-strategy"></a>CSS Custom Properties Strategy

### Architecture Principles

#### **1. Global vs Local Scope**

**Global Tokens (`:root`)**
```css
:root {
  /* Available everywhere */
  --color-primary: #007bff;
  --font-family-base: 'Inter', sans-serif;
}
```

**Component-Scoped Tokens**
```css
.card {
  /* Only available within .card and descendants */
  --card-padding: var(--spacing-4);
  --card-background: var(--color-background-elevated);
  --card-shadow: var(--shadow-md);

  padding: var(--card-padding);
  background: var(--card-background);
  box-shadow: var(--card-shadow);
}
```

#### **2. Cascading Strategy**

Use the cascade for theming and variants:

```css
/* Base theme */
:root {
  --button-background: var(--color-primary);
  --button-text: white;
}

/* Dark theme override */
[data-theme="dark"] {
  --button-background: var(--color-primary-light);
  --button-text: var(--color-gray-900);
}

/* High contrast override */
@media (prefers-contrast: high) {
  :root {
    --button-background: #0000ff;
    --button-text: #ffffff;
  }
}
```

#### **3. Fallback Values**

Always provide fallbacks for critical values:

```css
.element {
  /* Fallback if custom property undefined */
  color: var(--color-text-primary, #1a1a1a);

  /* Chained fallbacks */
  font-family: var(--font-heading, var(--font-family-base, system-ui));
}
```

### Responsive Design Tokens

#### **Method 1: Media Query Overrides**
```css
:root {
  --spacing-section: 2rem;
  --font-size-h1: 2rem;
}

@media (min-width: 768px) {
  :root {
    --spacing-section: 4rem;
    --font-size-h1: 3rem;
  }
}

@media (min-width: 1024px) {
  :root {
    --spacing-section: 6rem;
    --font-size-h1: 4rem;
  }
}

/* Usage */
.section {
  padding: var(--spacing-section);
}

h1 {
  font-size: var(--font-size-h1);
}
```

#### **Method 2: Container Queries** (Modern Approach)
```css
:root {
  --grid-columns: 1;
}

@container (min-width: 768px) {
  :root {
    --grid-columns: 2;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
}
```

### Theming Strategy

#### **Multi-Theme Implementation**
```css
/* Default/Light Theme */
:root,
[data-theme="light"] {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  --color-primary: #007bff;

  color-scheme: light;
}

/* Dark Theme */
[data-theme="dark"] {
  --color-background: #1a1a1a;
  --color-text: #f5f5f5;
  --color-primary: #4dabf7;

  color-scheme: dark;
}

/* Auto Theme (respects system preference) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --color-background: #1a1a1a;
    --color-text: #f5f5f5;
    --color-primary: #4dabf7;

    color-scheme: dark;
  }
}
```

#### **Theme Switching JavaScript**
```javascript
// Set theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Initialize theme
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const defaultTheme = savedTheme || (prefersDark ? 'dark' : 'light');

setTheme(defaultTheme);
```

### Performance Optimization

#### **1. Minimize Inheritance Complexity**
```css
/* Good - Direct reference */
.button {
  background: var(--button-background);
}

/* Bad - Too many layers */
.button {
  background: var(--component-interactive-primary-background-default-state);
  /* Deeply nested names are hard to maintain */
}
```

#### **2. Group Related Tokens**
```css
/* Group by feature for better compression */
:root {
  /* Typography */
  --font-family-base: 'Inter', sans-serif;
  --font-size-base: 1rem;
  --line-height-base: 1.5;

  /* Colors */
  --color-primary: #007bff;
  --color-secondary: #6c757d;
}
```

#### **3. Use calc() for Derived Values**
```css
:root {
  --spacing-unit: 0.25rem; /* 4px */
}

.element {
  /* Compute derived values on the fly */
  padding: calc(var(--spacing-unit) * 4); /* 16px */
  margin: calc(var(--spacing-unit) * 8);  /* 32px */
}
```

### Accessibility Considerations

#### **WCAG Compliant Color Tokens**
```css
:root {
  /* Ensure minimum 4.5:1 contrast ratio */
  --color-text-on-primary: #ffffff;     /* For use on primary backgrounds */
  --color-text-on-secondary: #000000;   /* For use on secondary backgrounds */

  /* Store contrast ratios as documentation */
  /* --color-primary + --color-text-on-primary = 5.2:1 ratio */
}
```

#### **Forced Colors Mode Support**
```css
@media (forced-colors: active) {
  :root {
    --color-primary: CanvasText;
    --color-background: Canvas;
    --color-border: CanvasText;
  }
}
```

#### **Reduced Motion**
```css
:root {
  --transition-duration: 200ms;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --transition-duration: 0ms;
  }
}

.animated {
  transition-duration: var(--transition-duration);
}
```

---

## <a name="validation-methods"></a>Accuracy Validation Methods

### Visual Validation

#### **1. Side-by-Side Comparison**
```
Process:
1. Screenshot original website
2. Build with extracted tokens
3. Overlay screenshots at 50% opacity
4. Identify mismatches visually
```

**Tools:**
- Browser DevTools device emulation
- Screenshot comparison tools (Percy, Chromatic)
- Image diff tools (PixelMatch, ResembleJS)

#### **2. Browser Overlay Technique**
```javascript
// Inject overlay of original screenshot
const overlay = document.createElement('img');
overlay.src = 'original-screenshot.png';
overlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.5;
  pointer-events: none;
  z-index: 999999;
  mix-blend-mode: difference;
`;
document.body.appendChild(overlay);
```

### Color Validation

#### **1. Hex/RGB Value Comparison**
```javascript
// Extract computed color values
function getComputedColor(element, property = 'color') {
  const computed = getComputedStyle(element);
  const color = computed.getPropertyValue(property);

  // Convert RGB to HEX for comparison
  const rgb = color.match(/\d+/g);
  const hex = '#' + rgb.map(x => {
    const hex = parseInt(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');

  return { rgb: color, hex: hex };
}

// Usage
const headerBg = getComputedColor(document.querySelector('header'), 'background-color');
console.log('Header background:', headerBg.hex);
// Expected: #007bff
```

#### **2. WCAG Contrast Validation**
According to the W3C Design Tokens Color Module (October 2025), validation should include:

```javascript
// Use established contrast checking libraries
import { contrast } from 'wcag-contrast';

function validateContrast(bgColor, textColor) {
  const ratio = contrast.ratio(bgColor, textColor);

  return {
    ratio: ratio,
    passAA: ratio >= 4.5,      // WCAG AA
    passAAA: ratio >= 7,        // WCAG AAA
    passLargeAA: ratio >= 3,    // WCAG AA for large text
    passLargeAAA: ratio >= 4.5  // WCAG AAA for large text
  };
}

// Usage
const result = validateContrast('#007bff', '#ffffff');
console.log(`Contrast ratio: ${result.ratio.toFixed(2)}:1`);
console.log(`WCAG AA: ${result.passAA ? 'PASS' : 'FAIL'}`);
```

**Tools:**
- Chrome DevTools Color Picker (shows contrast ratio)
- WebAIM Contrast Checker
- Colorize.design (automatic WCAG analysis)
- ExtractColorPalettes.com (WCAG compliance checking)

#### **3. Color Space Validation**
The W3C 2025 specification emphasizes:

> "If colors need to be transformed between color spaces, it's important to validate the output of the translation tool to ensure that the colors are represented accurately and consistently."

```css
/* Modern color spaces (2025 spec includes) */
:root {
  /* sRGB (traditional) */
  --color-primary-srgb: #007bff;

  /* Display P3 (wider gamut) */
  --color-primary-p3: color(display-p3 0 0.482 1);

  /* Oklch (perceptually uniform) */
  --color-primary-oklch: oklch(0.628 0.257 263.3);
}

/* Fallback for browsers without support */
.element {
  background: var(--color-primary-srgb);
  background: var(--color-primary-oklch);
}
```

### Typography Validation

#### **1. Font Metrics Comparison**
```javascript
function getTypographyMetrics(element) {
  const computed = getComputedStyle(element);

  return {
    fontFamily: computed.fontFamily,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    fontStyle: computed.fontStyle,
    lineHeight: computed.lineHeight,
    letterSpacing: computed.letterSpacing,
    textTransform: computed.textTransform,
    // Computed values
    actualFontSize: parseFloat(computed.fontSize),
    actualLineHeight: parseFloat(computed.lineHeight),
  };
}

// Compare original vs recreation
const original = getTypographyMetrics(originalElement);
const recreation = getTypographyMetrics(recreatedElement);

const matches = {
  fontFamily: original.fontFamily === recreation.fontFamily,
  fontSize: Math.abs(original.actualFontSize - recreation.actualFontSize) < 0.5,
  fontWeight: original.fontWeight === recreation.fontWeight,
  lineHeight: Math.abs(original.actualLineHeight - recreation.actualLineHeight) < 1,
};

console.table(matches);
```

#### **2. Font Loading Validation**
```javascript
// Check if fonts loaded correctly
document.fonts.ready.then(() => {
  document.fonts.forEach(font => {
    console.log(`Font loaded: ${font.family} ${font.weight} ${font.style}`);
  });

  // Check specific font
  const interFont = new FontFace('Inter', 'url(/fonts/inter.woff2)');
  document.fonts.check('16px Inter')
    ? console.log('Inter is loaded')
    : console.warn('Inter failed to load');
});
```

#### **3. Rendering Comparison**
```javascript
// Measure text rendering dimensions
function measureText(element) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const rect = range.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
    characterWidth: rect.width / element.textContent.length
  };
}
```

### Spacing and Layout Validation

#### **1. Box Model Comparison**
```javascript
function compareBoxModel(original, recreation) {
  const origBox = original.getBoundingClientRect();
  const recBox = recreation.getBoundingClientRect();

  const origComputed = getComputedStyle(original);
  const recComputed = getComputedStyle(recreation);

  const tolerance = 2; // Allow 2px difference

  return {
    dimensions: {
      width: Math.abs(origBox.width - recBox.width) < tolerance,
      height: Math.abs(origBox.height - recBox.height) < tolerance,
    },
    padding: {
      top: origComputed.paddingTop === recComputed.paddingTop,
      right: origComputed.paddingRight === recComputed.paddingRight,
      bottom: origComputed.paddingBottom === recComputed.paddingBottom,
      left: origComputed.paddingLeft === recComputed.paddingLeft,
    },
    margin: {
      top: origComputed.marginTop === recComputed.marginTop,
      right: origComputed.marginRight === recComputed.marginRight,
      bottom: origComputed.marginBottom === recComputed.marginBottom,
      left: origComputed.marginLeft === recComputed.marginLeft,
    }
  };
}
```

#### **2. Computed Spacing Extraction**
```javascript
function extractSpacing(element) {
  const computed = getComputedStyle(element);

  return {
    padding: {
      top: computed.paddingTop,
      right: computed.paddingRight,
      bottom: computed.paddingBottom,
      left: computed.paddingLeft,
    },
    margin: {
      top: computed.marginTop,
      right: computed.marginRight,
      bottom: computed.marginBottom,
      left: computed.marginLeft,
    },
    gap: computed.gap,
  };
}
```

### Shadow and Effects Validation

#### **1. Shadow Property Extraction**
```javascript
function extractShadow(element) {
  const computed = getComputedStyle(element);
  const boxShadow = computed.boxShadow;

  // Parse shadow values
  // Example: "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px"
  const shadowRegex = /([^)]+\)) ([-\d.]+)px ([-\d.]+)px ([-\d.]+)px ([-\d.]+)px/;
  const matches = boxShadow.match(shadowRegex);

  if (matches) {
    return {
      color: matches[1],
      offsetX: matches[2] + 'px',
      offsetY: matches[3] + 'px',
      blur: matches[4] + 'px',
      spread: matches[5] + 'px',
      original: boxShadow
    };
  }

  return { original: boxShadow };
}
```

#### **2. Filter Effects Extraction**
```javascript
function extractFilters(element) {
  const computed = getComputedStyle(element);

  return {
    filter: computed.filter,
    backdropFilter: computed.backdropFilter,
    opacity: computed.opacity,
    mixBlendMode: computed.mixBlendMode,
  };
}
```

### Automated Testing

#### **1. Visual Regression Testing**
```javascript
// Using Percy or Chromatic
import percySnapshot from '@percy/puppeteer';

describe('Design Token Validation', () => {
  it('matches original design', async () => {
    await page.goto('http://localhost:3000');
    await percySnapshot(page, 'Homepage');
    // Percy compares against baseline screenshot
  });
});
```

#### **2. CSS Token Validation Script**
```javascript
// validate-tokens.js
const expectedTokens = {
  '--color-primary': '#007bff',
  '--font-size-base': '16px',
  '--spacing-4': '16px',
};

const rootStyles = getComputedStyle(document.documentElement);
const errors = [];

Object.entries(expectedTokens).forEach(([token, expectedValue]) => {
  const actualValue = rootStyles.getPropertyValue(token).trim();

  if (actualValue !== expectedValue) {
    errors.push({
      token,
      expected: expectedValue,
      actual: actualValue
    });
  }
});

if (errors.length > 0) {
  console.error('Token validation failed:');
  console.table(errors);
} else {
  console.log('All tokens validated successfully!');
}
```

#### **3. Accessibility Testing**
```javascript
// Using axe-core
import { axe } from 'axe-core';

async function validateAccessibility() {
  const results = await axe.run();

  const colorContrastIssues = results.violations.filter(
    violation => violation.id === 'color-contrast'
  );

  if (colorContrastIssues.length > 0) {
    console.error('Color contrast violations:');
    colorContrastIssues.forEach(issue => {
      console.log(`- ${issue.description}`);
      issue.nodes.forEach(node => {
        console.log(`  Element: ${node.html}`);
        console.log(`  Contrast: ${node.any[0].data.contrastRatio}:1`);
      });
    });
  }

  return results;
}
```

### Cross-Browser Validation

#### **1. Computed Style Differences**
```javascript
// Test across browsers
const browserTests = {
  chrome: getComputedStyle(element),
  firefox: getComputedStyle(element),
  safari: getComputedStyle(element),
};

// Compare specific properties
['color', 'fontSize', 'padding'].forEach(prop => {
  const values = Object.values(browserTests).map(style => style[prop]);
  const allMatch = values.every(v => v === values[0]);

  if (!allMatch) {
    console.warn(`Inconsistent ${prop} across browsers:`, values);
  }
});
```

#### **2. CSS Custom Property Support**
```javascript
// Check browser support
function supportsCustomProperties() {
  const testElement = document.createElement('div');
  testElement.style.setProperty('--test', 'value');
  return testElement.style.getPropertyValue('--test') === 'value';
}

if (!supportsCustomProperties()) {
  console.warn('Browser does not support CSS custom properties');
  // Implement fallback strategy
}
```

### Documentation and Reporting

#### **Token Validation Report Template**
```markdown
# Design Token Validation Report

## Summary
- Total tokens extracted: 150
- Validated: 148
- Failed validation: 2
- Accuracy: 98.7%

## Color Validation
✅ Primary palette: 10/10 colors match
✅ Secondary palette: 8/8 colors match
❌ Accent color mismatch: Expected #ff6b6b, Got #ff5b5b
✅ All WCAG AA contrast ratios pass

## Typography Validation
✅ Font families loaded correctly
✅ Font sizes match within 0.5px tolerance
✅ Line heights match within 1px tolerance
⚠️  Letter spacing differs on Firefox (-0.01em)

## Spacing Validation
✅ All spacing tokens match
✅ Component padding validated
✅ Margin values accurate

## Shadow Validation
✅ Elevation shadows match
❌ Button focus shadow blur radius off by 1px

## Recommendations
1. Adjust accent color to #ff6b6b
2. Add browser-specific letter-spacing adjustments
3. Review button focus shadow implementation
```

---

## Additional Resources

### Official Specifications
- W3C Design Tokens Specification (October 2025)
- CSS Color Module Level 4
- WCAG 2.1 Accessibility Guidelines

### Recommended Reading
- Smashing Magazine: "Best Practices For Naming Design Tokens"
- CSS-Tricks: "What Are Design Tokens?"
- Design Tokens Community Group documentation

### Tool Collections
- Chrome Web Store: Design & development extensions
- GitHub: Open-source design token libraries
- Design system examples: Carbon, Material, Tailwind

---

## Quick Reference Checklist

### Pre-Extraction
- [ ] Identify target website sections to analyze
- [ ] Set up browser DevTools
- [ ] Install necessary extensions (WhatFont, Extract Colors, etc.)
- [ ] Take reference screenshots

### During Extraction
- [ ] Document all colors with context
- [ ] Record font families, sizes, and weights
- [ ] Extract spacing patterns
- [ ] Capture shadow and border styles
- [ ] Note state variations (hover, active, disabled)
- [ ] Record breakpoints and responsive values

### Post-Extraction
- [ ] Organize tokens in three-tier system
- [ ] Create CSS custom properties
- [ ] Validate against original
- [ ] Test across browsers
- [ ] Check WCAG compliance
- [ ] Document naming conventions
- [ ] Set up version control

### Quality Assurance
- [ ] Visual comparison (screenshot overlay)
- [ ] Automated contrast checking
- [ ] Cross-browser testing
- [ ] Responsive design validation
- [ ] Accessibility audit
- [ ] Performance check
- [ ] Documentation review

---

**Last Updated:** November 23, 2025
**Next Review:** Quarterly (with W3C spec updates)
