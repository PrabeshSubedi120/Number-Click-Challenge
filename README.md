# 🎯 Number Click Challenge

A fast-paced reaction game where players tap numbers in sequential order to test reflexes. Features daily challenges, difficulty levels, high scores, and streak tracking. The modern UI adapts to both light and dark modes for an engaging experience that helps improve cognitive speed.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

## 🎮 Features

- **🎯 Fast-Paced Gameplay**: Tap numbers in sequential order as quickly as possible
- **📱 Fully Responsive**: Optimized for phones, tablets, and all screen sizes
- **🏆 Daily Challenges**: New challenges every day with streak tracking
- **⚡ Multiple Difficulty Levels**: Easy, Medium, Hard, and Daily modes
- **📊 Score Tracking**: Personal high scores and leaderboards
- **🎨 Modern UI**: Beautiful gradient design with light/dark mode support
- **🔊 Haptic Feedback**: Enhanced user experience with tactile responses
- **🏅 Achievement System**: Unlock badges for various accomplishments
- **📤 Score Sharing**: Share your achievements with friends

## 🚀 Quick Start

### Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** (optional but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd number-click-challenge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

## 📱 Running on Mobile Devices

### Option 1: Using Expo Go (Recommended for Testing)

1. **Install Expo Go on your mobile device:**
   - **iOS**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
   - **Android**: [Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Connect to the same Wi-Fi network** as your development computer

3. **Scan the QR code:**
   - **iOS**: Open the Camera app and point it at the QR code displayed in your terminal
   - **Android**: Open Expo Go app and tap "Scan QR Code"

4. **The app will load automatically** on your mobile device

### Option 2: Using Device Simulators

#### iOS Simulator (macOS only)
```bash
# Install Xcode from Mac App Store first
npx expo start --ios
```

#### Android Emulator
```bash
# Install Android Studio first
npx expo start --android
```

## 💻 Running on PC/Web

### Web Browser
```bash
npx expo start --web
```
Then open your browser and navigate to `http://localhost:19006`

### Desktop Development
```bash
# For development with hot reload
npx expo start

# Then press 'w' in the terminal to open in web browser
```

## 🛠️ Development Setup

### Project Structure
```
number-click-challenge/
├── app/                    # Main application code
│   ├── (tabs)/            # Tab navigation screens
│   ├── index.tsx          # Main game screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── assets/               # Images, fonts, and other assets
└── constants/            # App constants and configurations
```

### Key Technologies
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based navigation
- **AsyncStorage**: Local data persistence
- **Linear Gradient**: Beautiful UI effects
- **Haptic Feedback**: Enhanced user experience

## 🎯 Game Rules

1. **Objective**: Tap numbers in sequential order (1, 2, 3, ...)
2. **Speed**: Complete the sequence as quickly as possible
3. **Accuracy**: Tapping wrong numbers won't advance the sequence
4. **Difficulty Levels**:
   - **Easy**: 10 numbers
   - **Medium**: 20 numbers  
   - **Hard**: 30 numbers
   - **Daily**: Variable (15-30 numbers)

## 🏆 Scoring System

- **Time-based scoring**: Lower time = better score
- **High score tracking**: Personal best for each difficulty
- **Leaderboard**: Top 5 scores per difficulty level
- **Daily streaks**: Consecutive days of completing daily challenges
- **Badges**: Unlock achievements for various milestones

## 🔧 Troubleshooting

### Common Issues

**1. Metro bundler issues:**
```bash
npx expo start --clear
```

**2. Dependencies not installing:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**3. Expo Go not connecting:**
- Ensure both devices are on the same Wi-Fi network
- Try restarting the Expo development server
- Check firewall settings

**4. Web version not loading:**
```bash
npx expo install @expo/webpack-config
npx expo start --web
```

### Platform-Specific Notes

- **iOS**: Requires macOS for iOS Simulator
- **Android**: Requires Android Studio for emulator
- **Web**: Works on all modern browsers
- **Mobile**: Best experience with Expo Go app

## 📦 Building for Production

### Create Production Build
```bash
# For all platforms
npx expo build

# For specific platforms
npx expo build:android
npx expo build:ios
npx expo build:web
```

### Publishing to App Stores
```bash
# Publish to Expo
npx expo publish

# Build for app stores
npx expo build:android --type app-bundle
npx expo build:ios --type archive
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- UI inspired by modern mobile game design
- Icons from [Expo Vector Icons](https://icons.expo.fyi/)


**Happy Gaming! 🎮** Test your reflexes and see how fast you can click through the numbers!
