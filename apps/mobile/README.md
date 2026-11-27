# TrueShift — Construction Attendance & Shift Management App

> **Real hours. Real shifts.**  
> A high-reliability construction attendance mobile application built with **Flutter** and **Material Design 3**, featuring live selfie verification, precision geofenced GPS boundaries, multi-punch timeline tracking, and trilingual support.

---

## 🏗️ Overview

TrueShift is designed specifically for construction site workers, engineers, safety supervisors, and office personnel operating in demanding outdoor environments.

### Key Capabilities
- **Geo-fenced Punching:** Precision GPS boundary validation ($100\,\text{m}$–$250\,\text{m}$ radius for job sites, $50\,\text{m}$–$100\,\text{m}$ for corporate offices) with mock-location spoofing detection.
- **Selfie Verification:** Front-camera verification flow with lighting checks, face framing, and simulated face-match validation.
- **Dynamic Shift Accounting:** Full Day ($\ge 8\,\text{h}$), Half Day ($4\,\text{h}$–$7\,\text{h} 59\,\text{m}$), and Absent ($<4\,\text{h}$) with 15-minute grace period tracking.
- **Multi-Punch Timeline:** Real-time tracking of sequential In/Out punches, worked time meters, and break sessions.
- **Monthly Attendance History:** Interactive calendar view with attendance status indicators, worked hour summaries, and regularization requests.
- **Outdoor Sunlight Readability:** WCAG AAA high-contrast palette (`#17365D` navy, `#F5A524` safety amber, `#157F3D` emerald verified green).
- **Zero-Overflow Scalability:** Tested and verified on budget $360\,\text{dp} \times 800\,\text{dp}$ viewports at $1.3\times$ system font scale.
- **Jitter-Free Tabular Figures:** OpenType `tnum` font features for rock-solid live digital clocks.
- **Trilingual Localization:** Instant runtime switching between English, Marathi (मराठी), and Hindi (हिन्दी).

---

## 📁 Project Architecture

```
trueshift/
├── android/               # Android native configuration & Gradle scripts
├── assets/                # App icons, vectors, and mock data assets
├── ios/                   # iOS native project runner
├── lib/
│   ├── core/              # Design tokens (colors, typography, spacing) & themes
│   ├── l10n/              # Localization files & translation dictionaries
│   ├── models/            # Freezed/JSON serializable data models
│   ├── providers/         # Riverpod state notifiers & logic providers
│   ├── screens/           # Feature UI screens (Onboarding, Home, Punch, Today, History, Profile)
│   ├── services/          # Geofence, mock camera, and local persistence services
│   ├── widgets/           # Reusable UI component library (PunchButton, StatusChip, etc.)
│   └── main.dart          # Application entry point & router setup
├── test/                  # Automated test suite (unit, provider, and widget tests)
├── DESIGN.md              # Complete design system & UI/UX engineering specification
└── pubspec.yaml           # Flutter dependencies & metadata
```

---

## 🚀 Getting Started

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (`^3.14.0` or higher)
- [Android SDK / Studio](https://developer.android.com/studio) (for Android deployment)
- Dart SDK bundled with Flutter

### Installation & Run

1. **Extract and navigate to the project directory:**
   ```bash
   cd trueshift
   ```

2. **Fetch dependencies:**
   ```bash
   flutter pub get
   ```

3. **Run static analysis:**
   ```bash
   flutter analyze
   ```

4. **Run automated test suite:**
   ```bash
   flutter test
   ```

5. **Run the app on a connected device / emulator:**
   ```bash
   flutter run
   ```

6. **Build release APK:**
   ```bash
   flutter build apk --release
   ```
   The compiled APK will be output to:
   `build/app/outputs/flutter-apk/app-release.apk`

---

## 🧪 Testing

The repository includes a comprehensive 26-test suite covering:
- Attendance calculation and grace period classification
- Riverpod state transitions and punch flow
- Geofence toggle and mock location edge cases
- Small viewport ($360\,\text{dp}$) and $1.3\times$ font scale layout resilience
- Monthly history navigation and day details
- Profile settings and localization switching

Run all tests:
```bash
flutter test --reporter expanded
```

---

## 🎨 Design System

For in-depth specifications of colors, contrast ratios, component dimensions, typography scales, touch target rules, and error recovery protocols, consult:
👉 **[`DESIGN.md`](./DESIGN.md)**

---

## 📄 License
Internal proprietary software for construction workforce shift verification.
