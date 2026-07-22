# 🏍️ IntelliBike

IntelliBike is a modern, responsive vehicle management and fuel tracking web/mobile application. Built with Next.js and React, and wrapped with Capacitor, it provides real-time logs, mileage estimations, expense analysis, and a sleek design tailored for mobile devices.

---

## 👨‍💻 Developer Information
* **Developer:** Sabari Vasan
* **Email:** [sabarivasan1512@gmail.com](mailto:sabarivasan1512@gmail.com)
* **GitHub Repository:** [Sabari-sankar/IntelliBike](https://github.com/Sabari-sankar/IntelliBike.git)

---

## 🛠️ Technology Stack
* **Framework:** Next.js (App Router, static site export)
* **Library:** React (React 19)
* **Styling:** Vanilla CSS Variables & Custom Animations (Framer Motion)
* **Mobile Wrapper:** Capacitor 8 (Android)
* **Icons:** Lucide React

---

## 📋 Prerequisites
Before you begin, ensure you have the following installed on your machine:
* **Node.js:** version `22.x` or higher
* **Java Development Kit (JDK):** version `21` (required for Capacitor Android builds)
* **Android SDK:** with platform-tools and command line tools configured

---

## 🚀 Getting Started & Local Development

### 1. Clone & Setup
```bash
# Clone the repository
git clone https://github.com/Sabari-sankar/IntelliBike.git
cd IntelliBike

# Install dependencies
npm install
```

### 2. Run the Development Server
Run the local Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📱 Mobile App Build & Compilation

The project uses Capacitor to package the Next.js static output into a native Android application.

### Local Android Build (Windows)
Run the automated build script to compile the debug APK:
```bash
.\build-android.bat
```
This script will:
1. Export the Next.js site to static HTML/CSS/JS (`out/` directory).
2. Sync the static assets with the Android native project.
3. Compile the debug APK using Gradle wrapper.
4. Output the compiled package to the project root as `FuelBook-debug.apk` (or `IntelliBike-debug.apk`).

---

## 🤖 CI/CD (GitHub Actions)
The project includes a GitHub Actions workflow that automatically builds the Android APK on every push or pull request to the `main` and `master` branches:
* **Workflow Configuration:** Located at [build-apk.yml](file:///.github/workflows/build-apk.yml).
* **Artifacts:** On successful completion, you can download the compiled debug APK directly from the GitHub Actions run summary under the name `IntelliBike-debug-apk`.

---

## 📂 Project Structure
```text
├── .github/workflows/   # GitHub CI/CD Actions (Android APK compilation)
├── public/              # Static assets, icons, and logos
├── src/                 # Application source code
│   ├── app/             # Next.js App Router pages and layouts
│   ├── components/      # UI components (Header, BottomNav, Forms, Charts)
│   └── lib/             # Utility modules and Capacitor local storage wrapper
├── build-android.bat    # Windows batch script for automated APK building
├── capacitor.config.ts  # Capacitor wrapper configuration file
├── package.json         # Node.js dependencies and run scripts
└── README.md            # Project documentation (this file)
```
