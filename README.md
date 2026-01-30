# AI-WalkingPad 🐻

A premium, cozy web-based controller for the **Kingsmith WalkingPad** treadmill using the **Web Bluetooth API**. This application features a unique **Bear Aesthetic** with a widget-style layout, English localization, and robust auto-reconnection.

## ✨ Features

- **🐾 Bear Aesthetic** - A cozy, widget-based UI with soft tones and cute bear illustrations
- **🔗 Web Bluetooth Connection** - Connect to your WalkingPad R1 Pro directly from your browser
- **🔄 Persistent Auto-Reconnect** - Automatically watches for your device and reconnects when it wakes up
- **📊 Widget-Style Stats** - Beautiful widgets for speed, time, distance, and step count
- **🎚️ Precision Speed Control** - Set speed in 0.1 km/h increments with a modern bear-themed slider
- **🔄 Mode Switching** - Easy switching between Sleep, Manual, and Auto modes
- **⚙️ Device Settings** - Configure sensitivity, auto-start, max speed, and units
- **📱 Mobile-First Design** - Fully responsive bottom-navigation layout designed for phones
- **🖥️ Desktop Optimization** - Adaptive side-by-side widget layout for larger screens

## 🚀 Quick Start

### Online Version
Visit the hosted version at: [Coming Soon]

### Local Development

```bash
# Clone the repository
git clone https://github.com/pixellos/AI-WalkingPad.git
cd AI-WalkingPad

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in Chrome, Edge, or Opera.

## 🔧 Building for Production

```bash
# Build the production bundle
npm run build

# Preview the production build
npm run preview
```

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome (Desktop/Android) | ✅ Full support |
| Edge | ✅ Full support |
| Opera | ✅ Full support |
| Firefox | ❌ No Web Bluetooth |
| Safari (macOS/iOS) | ❌ No Web Bluetooth |

> **Note:** Web Bluetooth requires a secure context (HTTPS or localhost).

## 🎮 Usage

1. **Connect** - Click "Connect via Bluetooth" and select your WalkingPad device
2. **Control Speed** - Use the slider or +/- buttons to adjust speed
3. **Start/Stop** - Use the Start/Stop button to control the belt
4. **Change Mode** - Switch between Sleep, Manual, and Auto modes
5. **Configure** - Adjust settings like sensitivity and max speed

### Auto-Reconnect

The app includes automatic reconnection functionality:
- Toggle auto-reconnect on/off from the connection screen or header
- When enabled, the app will attempt to reconnect up to 5 times if connection is lost
- Uses exponential backoff between reconnection attempts
- Settings are persisted in localStorage

## 🔌 WalkingPad Protocol

This app implements the WalkingPad BLE (Bluetooth Low Energy) protocol:

**Service UUID:** `0xFE00`
- **Read Characteristic (`0xFE01`):** Status notifications from the device
- **Write Characteristic (`0xFE02`):** Commands to the device

**Protocol Details:**
- Status polling every 750ms
- Binary message format with checksum validation
- Supports speed, mode, and parameter configuration

For detailed protocol documentation, see the [protocol.js](src/utils/protocol.js) source file.

## 📁 Project Structure

```
src/
├── components/
│   ├── ConnectionScreen/    # Landing page with Bluetooth connect
│   ├── Header/              # Navigation bar with disconnect
│   ├── StatusDisplay/       # Real-time stats display
│   ├── SpeedControl/        # Speed slider and buttons
│   ├── ModeSelector/        # Sleep/Manual/Auto toggle
│   └── Settings/            # Device configuration
├── hooks/
│   └── useWalkingPad.js     # Custom hook for BLE connection
├── utils/
│   └── protocol.js          # WalkingPad BLE protocol
├── App.jsx                  # Main application
├── App.css                  # App layout styles
├── index.css                # Global design system
└── main.jsx                 # React entry point
```

## 🛠️ Technologies

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Web Bluetooth API** - Device communication
- **CSS Variables** - Theming and design tokens
- **LocalStorage** - Persisting user preferences

## 🙏 Credits

- Original [QWalkingPad](https://github.com/DorianRudolph/QWalkingPad) by Dorian Rudolph
- Protocol research from [ph4-walkingpad](https://github.com/ph4r05/ph4-walkingpad)
- This React rewrite was created with AI assistance

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
