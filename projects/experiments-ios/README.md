# Experiments iOS App

A production-ready iOS 17+ app for tracking life experiments using the **Tiny Experiments Framework** by Anne-Laure Le Cunff.

![iOS 17+](https://img.shields.io/badge/iOS-17%2B-blue)
![SwiftUI](https://img.shields.io/badge/SwiftUI-5.0-orange)
![SwiftData](https://img.shields.io/badge/SwiftData-1.0-green)

## Features

### Core (PACT/ACT/REACT Framework)
- **PACT**: Create experiments with Purpose, Action, Continuous frequency, and Trackable criteria
- **ACT**: Daily/weekly check-ins with notes and photos
- **REACT**: Structured reflection with Plus-Minus-Next format

### Technical
- 🔄 **iCloud Sync**: SwiftData + CloudKit automatic sync
- 📊 **Widgets**: Progress and Streak widgets for home screen
- 🔔 **Reminders**: Local notifications with deep linking
- 📤 **Export/Import**: JSON-based sharing
- 💎 **Pro Tier**: StoreKit 2 in-app purchase

## Requirements

- Xcode 15.0+
- iOS 17.0+
- Swift 5.9+

## Setup

1. Clone the repository
2. Open `Experiments.xcodeproj` in Xcode
3. Configure signing with your Apple Developer account
4. Build and run

### CloudKit Setup (Optional)
1. Enable iCloud in Signing & Capabilities
2. Add CloudKit container: `iCloud.com.yourteam.experiments`
3. Enable Background Modes: Remote notifications

### Widget Setup
1. Add the `ExperimentsWidget` target to your scheme
2. Configure App Group: `group.com.experiments.app`

## Architecture

```
Experiments/
├── App/                    # Entry points
├── Models/                 # SwiftData models
│   ├── Lab, Experiment, Entry, Reminder, Reflection
│   └── Enums/             # ExperimentFrequency, ExperimentStatus, ReflectionDecision
├── Views/                  # SwiftUI views
│   ├── Experiments/       # List, Detail, Edit, Components
│   ├── Entries/           # CheckIn, Detail, Edit
│   ├── Gallery/           # Template browsing
│   └── Settings/          # Settings, Labs, Pro, Import
├── Services/              # Business logic
│   ├── NotificationManager
│   ├── ImportExportService
│   └── StoreKitManager
├── Utilities/             # Helpers (StreakCalculator)
└── Resources/             # templates.json, Assets
```

### Design Pattern
- **MVVM** with `@Observable` macro (iOS 17+)
- **SwiftData** for persistence with CloudKit sync
- **Deep Linking** via URL scheme `experiments://`

## Streak Algorithm

Streaks count consecutive scheduled periods with completed entries:
- Stored dates as `YYYY-MM-DD` strings (timezone-safe)
- Today being incomplete doesn't break yesterday's streak
- Supports daily, weekly, and custom frequencies

## Tests

Run tests via Xcode or command line:
```bash
xcodebuild test -scheme Experiments -destination 'platform=iOS Simulator,name=iPhone 15'
```

Test coverage:
- `StreakCalculatorTests`: Streak edge cases
- `ImportExportTests`: JSON validation and round-trips

## Known Limitations

1. **Xcode Required**: Project must be opened in Xcode on macOS
2. **CloudKit Testing**: Requires Apple Developer account and physical devices
3. **Photo Storage**: Photos not synced via CloudKit in current implementation
4. **iPad Layouts**: Not optimized for larger screens (v2)
5. **Apple Watch**: Companion app planned for v2

## Future Improvements

- [ ] Apple Watch companion app
- [ ] iPad multi-column layouts
- [ ] Siri Shortcuts integration
- [ ] Charts framework for advanced insights
- [ ] Share experiments directly with friends
- [ ] Export to PDF/image
- [ ] Haptic feedback refinements

## Credits

- **Tiny Experiments Framework** by [Anne-Laure Le Cunff](https://nesslabs.com)
- Design inspired by Apple Human Interface Guidelines

## License

MIT License - See LICENSE file for details.
