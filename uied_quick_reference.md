# UIED & CV for Website Cloning - Quick Reference Guide

## Quick Decision Tree

```
Need to clone a website?
│
├─ Simple/Moderate complexity + Fast turnaround?
│  └─ Use: GPT-4V or Claude 3.5 Sonnet (Direct screenshot-to-code)
│
├─ Complex UI + Need interpretability?
│  └─ Use: UIED + LLM Hybrid Pipeline
│
├─ Building automated testing pipeline?
│  └─ Use: YOLO (speed) or Detectron2 (accuracy)
│
└─ Research/Dataset creation?
   └─ Use: UIED for diverse method comparison
```

## Performance Comparison (F1 Scores)

| Method | F1 Score | Speed | Best For |
|--------|----------|-------|----------|
| **UIED** | **0.524** | Medium | General UI detection |
| CenterNet | 0.282 | Medium | Balanced approach |
| Faster-RCNN | 0.271 | Slow | High accuracy needs |
| YOLOv3 | 0.249 | Fast | Real-time processing |

## UIED Quick Start

### Installation
```bash
git clone https://github.com/MulongXie/UIED.git
cd UIED
pip install -r requirements.txt
# Configure Google OCR key in detect_text/ocr.py line 28
```

### Usage
```bash
# Single image
python run_single.py  # Edit input_path_img first

# Batch processing
python run_batch.py   # Edit input_img_root first
```

### Output Format
```json
{
  "elements": [
    {
      "id": "elem_001",
      "type": "button",
      "bbox": [x_min, y_min, x_max, y_max],
      "text": "Click Me",
      "confidence": 0.95
    }
  ]
}
```

## Vision-LLM Approaches (2024 SOTA)

### GPT-4 Vision
```python
import openai

response = openai.ChatCompletion.create(
    model="gpt-4-vision-preview",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Convert to HTML/Tailwind"},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img}"}}
        ]
    }]
)
```

### Claude 3.5 Sonnet
- Best for: Clean React with semantic structure
- Strengths: Responsive behavior, component composition
- Output: Professional-quality code with proper accessibility

### Comparison
- **Claude 3.5 Sonnet**: Best semantic HTML, clean components
- **GPT-4o**: Most idiomatic framework-specific code (SwiftUI, React)
- **Gemini 1.5 Pro**: Good balance, free tier available

## Bounding Box Formats

### COCO Format (most common)
```json
[x_min, y_min, width, height]
```

### YOLO Format
```json
[x_center, y_center, width, height]  // Normalized 0-1
```

### Min-Max (UIED default)
```json
[x_min, y_min, x_max, y_max]
```

## Conversion to CSS

```javascript
// Absolute positioning
function bboxToCSS(bbox) {
  const [x_min, y_min, x_max, y_max] = bbox;
  return {
    position: 'absolute',
    left: `${x_min}px`,
    top: `${y_min}px`,
    width: `${x_max - x_min}px`,
    height: `${y_max - y_min}px`
  };
}

// Responsive (percentage)
function bboxToResponsiveCSS(bbox, imgWidth, imgHeight) {
  const [x_min, y_min, x_max, y_max] = bbox;
  return {
    left: `${(x_min / imgWidth) * 100}%`,
    top: `${(y_min / imgHeight) * 100}%`,
    width: `${((x_max - x_min) / imgWidth) * 100}%`,
    height: `${((y_max - y_min) / imgHeight) * 100}%`
  };
}
```

## Recommended Workflow for Website Cloning

### 1. Capture Screenshots
```javascript
// Using Puppeteer
const puppeteer = require('puppeteer');

async function capture(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Remove popups/overlays
  await page.evaluate(() => {
    document.querySelectorAll('.popup, .modal').forEach(el => el.remove());
  });

  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  await browser.close();
}
```

### 2. Direct Vision-LLM (Fastest)
```
Screenshot → GPT-4V/Claude → Code → Validate → Done
```

### 3. Hybrid Approach (Most Accurate)
```
Screenshot → UIED Detection → Extract Design Tokens →
Vision-LLM (with structure + screenshot) → Validate → Refine → Done
```

## Critical Accuracy Requirements

- **UI Detection IoU**: > 0.9 (vs. 0.5 for general object detection)
- **Confidence Threshold**: > 0.9 for production use
- **Visual Similarity**: CLIP score > 0.85 for acceptable quality
- **Accessibility**: WCAG AA minimum

## Key Limitations to Know

1. **Crowded Screens**: Accuracy degrades with >32 elements
2. **Dynamic Content**: JavaScript-rendered elements challenging
3. **Responsive Design**: Need multiple viewport captures
4. **Semantic Gap**: Visual correctness ≠ semantic HTML
5. **Color/Font Accuracy**: Exact matching difficult
6. **Processing Time**: 15-40 seconds per page (full pipeline)

## Essential Validation Checks

```python
def validate(original_screenshot, generated_code):
    return {
        'html_valid': validate_html(generated_code),
        'css_valid': validate_css(generated_code),
        'visual_similarity': clip_score(original, rendered),
        'accessibility': wcag_audit(generated_code),
        'responsive': test_breakpoints(generated_code),
        'performance': lighthouse_score(generated_code)
    }
```

## Prompt Template for LLM

```
Convert this UI to [Framework] code.

Technical Stack:
- Framework: React
- CSS: Tailwind CSS
- Components: Functional components

Requirements:
- Semantic HTML5
- WCAG AA accessibility
- Mobile-first responsive
- Exact visual match
- Production-ready code

[Attach screenshot]

Detected Structure (optional):
{JSON from UIED/YOLO if using hybrid approach}
```

## Tools & Resources

### Open Source
- **UIED**: https://github.com/MulongXie/UIED
- **Screenshot-to-Code**: https://github.com/abi/screenshot-to-code
- **Layout-Parser**: https://github.com/Layout-Parser/layout-parser

### Online Services
- **screenshottocode.com**: Free, GPT-4V powered
- **ui2code.ai**: Professional conversion service
- **v0.dev (Vercel)**: AI-powered UI generation

### Pre-trained Models
- **Roboflow Universe**: UI element detection models
- **HuggingFace**: WebSight, Design2Code models

## Cost Considerations

### API Costs (per page)
- **GPT-4 Vision**: ~$0.01-0.05 per screenshot
- **Claude 3.5 Sonnet**: ~$0.01-0.03 per screenshot
- **Gemini 1.5 Pro**: Free tier available

### Self-Hosted
- **UIED**: Free, requires Google OCR API
- **YOLO**: Free, GPU recommended
- **Detectron2**: Free, GPU required

## When to Use What

### Use Vision-LLM Directly When:
- Prototyping
- Simple to moderate complexity
- Need fast turnaround
- Have API budget
- Don't need intermediate data

### Use UIED/CV + LLM When:
- Complex, crowded UIs
- Need interpretability
- Building automation pipeline
- Want element-level metadata
- Debugging required

### Use Pure CV (no LLM) When:
- Automated testing only
- Building training datasets
- No code generation needed
- Offline processing required
- Privacy constraints

## Typical Timeline

**Simple Page (Landing page, portfolio):**
- Vision-LLM: 5-10 minutes
- Hybrid: 15-20 minutes
- Manual coding: 1-2 hours

**Complex Page (Dashboard, e-commerce):**
- Vision-LLM: 20-30 minutes + refinement
- Hybrid: 30-45 minutes + refinement
- Manual coding: 4-8 hours

**Production-Ready:**
Add 50-100% time for QA, accessibility, responsiveness testing

## Success Metrics

### Acceptable Quality
- Visual Similarity: > 0.85
- HTML/CSS Valid: 100%
- Accessibility Score: > 90/100
- Performance Score: > 80/100

### Excellent Quality
- Visual Similarity: > 0.92
- Accessibility Score: > 95/100
- Performance Score: > 90/100
- Responsive: All breakpoints working
- Semantic HTML: Proper tags throughout

## Common Pitfalls to Avoid

1. ❌ Using low-resolution screenshots (< 1920px)
2. ❌ Not capturing multiple viewports
3. ❌ Ignoring accessibility in generated code
4. ❌ Accepting first generation without validation
5. ❌ Not testing responsive breakpoints
6. ❌ Using absolute positioning for everything
7. ❌ Forgetting to extract actual images from screenshots
8. ❌ Not documenting prompts and iterations
9. ❌ Skipping manual QA
10. ❌ Ignoring performance optimization

## Best Practices Checklist

- ✅ Capture high-res screenshots (1920x1080+)
- ✅ Remove popups/overlays before capture
- ✅ Capture multiple viewport sizes
- ✅ Use vision-LLM for initial generation
- ✅ Validate HTML/CSS/Accessibility
- ✅ Test responsive behavior
- ✅ Extract design tokens (colors, fonts, spacing)
- ✅ Use semantic HTML tags
- ✅ Implement proper ARIA labels
- ✅ Optimize images and assets
- ✅ Document generation process
- ✅ Version control iterations
- ✅ Budget time for manual refinement
- ✅ Test across browsers
- ✅ Measure performance metrics

## Next Steps

1. **Experiment**: Try screenshottocode.com with sample screenshots
2. **Install UIED**: Clone repo and run on test images
3. **Test Vision-LLM**: Try GPT-4V or Claude 3.5 Sonnet
4. **Build Pipeline**: Create automated capture → detect → generate workflow
5. **Validate**: Implement comprehensive validation checks
6. **Iterate**: Refine prompts and process based on results
7. **Scale**: Build reusable components and templates
8. **Monitor**: Track quality metrics over time

---

**Last Updated**: November 23, 2025
**Primary Research Document**: `/home/user/portfolio/research_uied_cv_ui_detection.md`
