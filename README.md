# 🌊 River Studio

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Project Status: Active](https://img.shields.io/badge/Project%20Status-Active-brightgreen.svg)]()
[![Electron](https://img.shields.io/badge/Electron-33.4-informational)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff)](https://vitejs.dev/)

**River Studio** is a powerful, modern, and open-source streaming and recording software built with Electron, React, and FFmpeg. Designed for creators, it provides a seamless experience for broadcasting to multiple platforms and recording high-quality screen content.

---

## ✨ Key Features

- 🎙️ **Streaming**: Broadcast to Twitch, YouTube, and other platforms using the RTMP protocol.
- 🎥 **Screen Recording**: Capture your entire screen or specific windows with high fidelity.
- 🔊 **Audio Control**: Advanced mixer for managing audio from microphones, system sounds, and media files.
- 🎨 **Scene Editor**: Build complex scenes with images, videos, webcams, and screen captures.
- 🛠️ **Customizable Settings**: Fine-tune your recording and streaming preferences for optimal performance.
- 🔐 **Token Management**: Securely manage stream keys and platform credentials.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rabiann/river-studio.git
   cd river-studio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the application in development mode:
```bash
npm run dev
```

### Build

Create production-ready distributions for Mac, Windows, or Linux:
```bash
npm run dist
```

---

## 🏗️ Technology Stack

- **Core**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Media Processing**: [FFmpeg](https://ffmpeg.org/) via [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- **Styling**: Vanilla CSS (Modern Aesthetics)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 🧪 Testing

We use Vitest for both unit and UI testing.

- **Run all tests**: `npm test`
- **Main process tests**: `npm run test:main`
- **UI tests**: `npm run test:ui`
- **Coverage report**: `npm run test:coverage`

---

<p align="center">Made with ❤️ for the streaming community.</p>

