# FlowState BCI
## Brain-Computer Interface for Attention-Based Video Control

**Repository:** [github.com/kvnloo/FlowState](https://github.com/kvnloo/FlowState)
**Status:** Active (Fork with Contributions)
**Primary Language:** Python
**Last Updated:** November 2025

---

## Overview

A Brain-Computer Interface (BCI) application that computes the alpha band of brain activity to speed up or slow down video playback based on your conscious attention levels.

**Problem Solved:** Traditional learning and focus training rely on subjective self-assessment. FlowState provides objective, real-time biofeedback based on actual brain activity, enabling data-driven attention training and flow state optimization.

---

## How It Works

### EEG Signal Processing Pipeline

```
EEG Headset → Raw Signal Acquisition → Alpha Band Extraction →
Attention Score Calculation → Video Speed Modulation → Real-time Feedback
```

### Alpha Band Detection

**Alpha Waves (8-12 Hz):**
- Dominant frequency during relaxed, focused attention
- Higher alpha = better focus and engagement
- Lower alpha = distraction or mind-wandering

The application continuously monitors alpha band power and uses it as a proxy for attention level.

### Video Playback Modulation

```python
# Pseudocode representation
if alpha_power > HIGH_THRESHOLD:
    video_speed = 1.5x  # High attention → faster playback
elif alpha_power < LOW_THRESHOLD:
    video_speed = 0.5x  # Low attention → slower playback
else:
    video_speed = 1.0x  # Normal attention → normal speed
```

---

## Connection to Ultralearning

This project is directly related to systematic skill acquisition and accelerated learning methodologies:

### Ultralearning Principles Applied

1. **Meta-learning** - Understanding how you learn by measuring actual brain activity
2. **Focus** - Objective feedback on attention quality during study sessions
3. **Directness** - Real-time biofeedback creates immediate learning loops
4. **Feedback** - Quantified attention data enables optimization

### Use Cases

**Focused Study Sessions:**
- Monitor attention degradation during long learning sessions
- Identify optimal break times based on brain state
- Track focus improvement over time

**Flow State Training:**
- Recognize the neural signature of flow states
- Practice entering flow more reliably
- Quantify flow state duration and depth

**Attention Training:**
- Gamify focus improvement
- Build sustained attention capacity
- Measure progress objectively

---

## Technical Implementation

### Core Technologies

**Brain Signal Processing:**
- EEG data acquisition and preprocessing
- Fast Fourier Transform (FFT) for frequency analysis
- Alpha band (8-12 Hz) extraction
- Real-time signal processing

**Video Control:**
- Python video playback integration
- Dynamic speed adjustment
- Smooth transition algorithms

**Data Analysis:**
- Time-series analysis of brain activity
- Statistical correlation with attention tasks
- Pattern recognition for flow states

### Technical Challenges Solved

1. **Real-time Processing** - Low-latency signal processing for immediate feedback
2. **Noise Filtering** - Separating signal from artifacts (eye blinks, muscle tension)
3. **Individual Calibration** - Alpha band characteristics vary per person
4. **Smooth Transitions** - Avoiding jarring speed changes in video playback

---

## Skills Demonstrated

### Neuroscience + Software Engineering
- **EEG Signal Processing** - Understanding brain wave frequencies and their meaning
- **Real-time Data Analysis** - Low-latency processing for immediate feedback
- **Biofeedback Systems** - Closing the loop between brain state and external stimulus

### Python Development
- **Scientific Computing** - NumPy, SciPy for signal processing
- **Data Visualization** - Real-time plotting of brain activity
- **Video Processing** - Integration with media playback libraries

### Research & Innovation
- **Interdisciplinary Work** - Combining neuroscience, psychology, and software
- **Experimental Design** - Testing attention measurement methodologies
- **Quantified Self** - Data-driven personal optimization

---

## Contributions & Extensions

As a fork of the original project, my contributions include:

### Enhancements
- Improved alpha band detection algorithms
- Video speed modulation implementation
- Real-time feedback visualization
- Calibration procedures for individual users

### Future Directions
- [ ] Machine learning for personalized attention models
- [ ] Multi-band analysis (theta, beta, gamma)
- [ ] Mobile app integration
- [ ] Long-term progress tracking dashboard
- [ ] Integration with spaced repetition systems (Anki)

---

## Applications

### Education & Learning
- **Students** - Optimize study sessions with objective attention monitoring
- **Online Courses** - Adaptive video speed based on comprehension
- **Language Learning** - Focus tracking during immersion practice

### Professional Development
- **Deep Work** - Quantify focus quality during complex tasks
- **Reading** - Adjust reading speed based on comprehension signals
- **Coding** - Monitor flow state during programming sessions

### Research
- **Attention Science** - Study attention patterns in different contexts
- **Flow State Research** - Quantify neural correlates of flow
- **Learning Science** - Measure learning efficiency variations

---

## Unique Value Proposition

**Rare Skill Combination:**
- Neuroscience domain knowledge
- Signal processing expertise
- Real-time systems development
- UX design for biofeedback

**Innovation:**
- Bridges subjective experience (attention) with objective measurement (EEG)
- Enables closed-loop learning optimization
- Demonstrates interdisciplinary problem-solving

---

## Role Alignment

### ✅ AI/ML Engineer
- Real-time signal processing
- Pattern recognition in brain data
- Predictive modeling of attention states

### ✅ Research Engineer
- Experimental methodology
- Novel application of BCI technology
- Scientific rigor in attention measurement

### ✅ Full-Stack Developer
- End-to-end system (hardware → software → UX)
- Real-time data processing
- User feedback integration

### ✅ Neuroscience Engineer
- EEG signal processing
- Brain-computer interface design
- Biofeedback system architecture

---

## Related Technologies

**Similar BCI Applications:**
- Muse headband - Meditation feedback
- Neurable - Focus-tracking for productivity
- Neurosity Crown - BCI development platform

**Differentiator:**
This project focuses specifically on attention-based video control for learning optimization, connecting neuroscience research to practical ultralearning applications.

---

## Documentation & Resources

**Repository:** [github.com/kvnloo/FlowState](https://github.com/kvnloo/FlowState)

**Related Reading:**
- *Ultralearning* by Scott H. Young
- EEG alpha band research papers
- Flow state neuroscience literature

**Dependencies:**
- Python 3.x
- NumPy, SciPy (signal processing)
- EEG hardware interface libraries
- Video playback framework

---

## Impact

**Personal Learning Enhancement:**
- Quantified attention during study sessions
- Identified optimal learning times based on brain state
- Improved focus sustainability through training

**Technical Demonstration:**
- Interdisciplinary engineering capability
- Real-time system design expertise
- Research-to-product translation

**Future Potential:**
- Adaptive learning platforms
- Personalized education technology
- Attention training applications

---

[← Back to AI Engineering](README.md) | [Back to Portfolio](../README.md)
