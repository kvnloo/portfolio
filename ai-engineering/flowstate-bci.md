# FlowState BCI
## Brain-Computer Interface for Attention-Based Video Control

**Repository:** [github.com/kvnloo/FlowState](https://github.com/kvnloo/FlowState)
**Documentation:** [kvnloo.github.io/FlowState](https://kvnloo.github.io/FlowState/)
**Status:** Active (Fork with Contributions)
**Primary Language:** Python

---

## The Concept

Your brain controls the video speed. Stay focused, content speeds up. Lose attention, it slows down.

**Problem Solved:** Traditional learning relies on subjective self-assessment of attention. FlowState provides objective, real-time biofeedback based on actual brain activity, enabling data-driven focus training.

---

## How It Works

### EEG Signal Processing

```
EEG Headset → Alpha Band Detection (8-12 Hz) →
Attention Score → Video Speed Control → Real-time Feedback
```

**Alpha Waves (8-12 Hz):**
- Dominant frequency during relaxed, focused attention
- Higher alpha = better focus and engagement
- Lower alpha = distraction or mind-wandering

**Video Playback Modulation:**
```python
if alpha_power > HIGH_THRESHOLD:
    video_speed = 1.5x  # High attention → faster playback
elif alpha_power < LOW_THRESHOLD:
    video_speed = 0.5x  # Low attention → slower playback
else:
    video_speed = 1.0x  # Normal attention → normal speed
```

---

## Interdisciplinary Engineering

### Rare Skill Combination
**Neuroscience + Signal Processing + Real-time Systems + UX Design**

This project bridges four distinct domains:
- **Neuroscience:** Understanding EEG alpha band correlates of attention
- **Signal Processing:** Fast Fourier Transform, noise filtering, artifact removal
- **Real-time Systems:** <100ms latency for immediate biofeedback
- **UX Design:** Intuitive feedback that doesn't distract from content

---

## Technical Implementation

### Core Technologies

**Brain Signal Processing:**
- EEG data acquisition and preprocessing
- Fast Fourier Transform (FFT) for frequency analysis
- Alpha band (8-12 Hz) extraction
- Real-time signal processing (<100ms latency)

**Video Control:**
- Python video playback integration
- Dynamic speed adjustment
- Smooth transition algorithms

**Key Challenges Solved:**
1. **Real-time Processing** - Low-latency signal processing for immediate feedback
2. **Noise Filtering** - Separating signal from artifacts (eye blinks, muscle tension)
3. **Individual Calibration** - Alpha band characteristics vary per person
4. **Smooth Transitions** - Avoiding jarring speed changes

---

## Application: Ultralearning

This project directly relates to systematic skill acquisition and accelerated learning:

### Ultralearning Principles Applied

1. **Meta-learning** - Understanding how you learn by measuring actual brain activity
2. **Focus** - Objective feedback on attention quality during study sessions
3. **Directness** - Real-time biofeedback creates immediate learning loops
4. **Feedback** - Quantified attention data enables optimization

### Use Cases

**Focused Study:**
- Monitor attention degradation during long sessions
- Identify optimal break times based on brain state
- Track focus improvement over time

**Flow State Training:**
- Recognize the neural signature of flow states
- Practice entering flow more reliably
- Quantify flow state duration and depth

---

## Skills Demonstrated

### Neuroscience + Software
- EEG signal processing and frequency analysis
- Real-time biofeedback systems
- Understanding brain wave patterns and their behavioral correlates

### Python Development
- Scientific computing (NumPy, SciPy)
- Real-time data visualization
- Video processing integration

### Research & Innovation
- Interdisciplinary problem-solving
- Experimental design
- Quantified self methodology

---

## Why This Matters

**Unique Value Proposition:**
Bridges subjective experience (attention) with objective measurement (EEG), enabling closed-loop learning optimization. Demonstrates rare combination of neuroscience domain knowledge with software engineering execution.

**Differentiator:**
While many portfolios show software projects, this demonstrates ability to work at the intersection of neuroscience, signal processing, and user experience—solving problems that require deep interdisciplinary expertise.

**Impact:**
Enables data-driven attention training, making focus improvement quantifiable and systematic rather than subjective and ad-hoc.

---

## Technical Stack

**Languages:** Python 3.x
**Signal Processing:** NumPy, SciPy (FFT, filtering)
**Hardware:** EEG headset (various compatible)
**Visualization:** Real-time plotting libraries
**Video:** Python video playback framework

---

## Links

**Repository:** [github.com/kvnloo/FlowState](https://github.com/kvnloo/FlowState)
**Documentation:** [kvnloo.github.io/FlowState](https://kvnloo.github.io/FlowState/)

**Related Reading:**
- *Ultralearning* by Scott H. Young
- EEG alpha band research papers
- Flow state neuroscience literature

---

[← Back to AI Engineering](README.md) | [Back to Portfolio](../README.md)
