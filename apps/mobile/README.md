# UHV Mobile Ticket Scanner App 📱

Dedicated Android & iOS Ticket Scanner App for the **Universal Human Values (UHV) Cell, TKM College of Engineering**.

Connects directly over secure HTTPS to the **NestJS Backend API on Render** (`https://uhv-cell-api.onrender.com`).

---

## Features

- ⚡ **60 FPS Hardware Camera QR Scanning** (Instant <100ms detection using `expo-camera`).
- 🔦 **Flashlight / Torch toggle** for dark venue entrances and auditoriums.
- 📳 **Haptic Feedback (Device Vibration) + Sound** on QR scan.
- 💳 **Gate Spot Payment**: Collect cash / UPI spot fee and verify attendee with 1 tap.
- 🔍 **Payment Status Alerting**:
  - Green `PAYMENT VERIFIED`: Pre-checked by admin -> Check In.
  - Red `PAYMENT DUE`: Shows amount due and claimed UTR reference.
- 👥 **Group Pass Support**: Shows team name and full attendee roster.
- 🔄 **Front / Back camera switch**.
- ⌨️ **Manual Registration ID Entry fallback**.
- 📋 **Session Scan History log**.

---

## How to Run Live on Your Phone (Zero Build Required)

1. **Install Expo Go on your phone**:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Start the development server**:
   ```bash
   cd apps/mobile
   npx expo start
   ```

3. **Scan the QR code**:
   - Open Expo Go on your Android phone (or Camera app on iPhone) and scan the QR code displayed in your terminal.
   - The app opens directly on your phone with full hardware camera access!

---

## How to Build a Standalone Android APK

You can build a production `.apk` file directly in the cloud (no Android Studio required) using Expo Application Services:

```bash
# 1. Install EAS CLI globally if you haven't already
npm install -g eas-cli

# 2. Log in to your free Expo account
eas login

# 3. Build standalone APK
eas build -p android --profile preview
```

Expo will compile the APK in the cloud and give you a direct download link (e.g. `https://expo.dev/artifacts/...apk`) that your gate volunteers can install directly onto their Android devices!
