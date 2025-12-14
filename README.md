# Top Rug - NFT Flight Game

A modernized flight game featuring **two distinct game modes** with a clean, organized codebase. Collect coins, avoid obstacles, and showcase your NFTs while flying through beautiful skies!

**🎮 Choose Your Adventure:**
- **Top Rug** - Classic coin-collecting flight action
- **Top Rug: Maverick** - Enhanced combat with weapons and enemies

## 🎮 Game Modes

### Top Rug
- **Classic flight game** with NFT banner support
- **Seamless propeller audio looping**
- Collect coins, avoid obstacles, showcase NFTs
- Perfect for casual NFT gaming

### Top Rug: Maverick
- **Enhanced combat version** with weapons and enemies
- Full combat system with shooting mechanics
- Health system and enemy AI
- Advanced 3D graphics and challenging gameplay

## 🏗️ Project Structure

```
TheAviator/
├── index.html                 # Main entry point with game mode selector
├── README.md                  # This file
├── games/                     # Game-specific code and assets
│   ├── aviator-classic/       # Top Rug (Classic)
│   │   ├── js/
│   │   │   └── game.js       # Main game logic
│   │   ├── css/
│   │   │   └── styles.css    # Game-specific styles
│   │   └── assets/           # Game-specific assets
│   │       ├── audio/        # Sound effects
│   │       ├── models/       # 3D models (.obj, .mtl)
│   │       └── images/       # UI images
│   └── aviator-2/            # Top Rug: Maverick
│       ├── js/
│       │   └── game.js       # Enhanced game logic
│       ├── css/
│       │   └── styles.css    # Enhanced styles
│       └── assets/           # Enhanced assets
│           ├── audio/
│           ├── models/
│           └── images/
├── shared/                    # Shared resources
│   ├── js/
│   │   ├── game-mode-controller.js  # Mode selection & loading
│   │   ├── three.min.js      # Three.js library
│   │   └── TweenMax.min.js   # Animation library
│   ├── css/
│   │   └── ui.css           # Shared UI styles
│   └── assets/               # Shared assets
│       ├── fonts/           # Web fonts
│       └── icons/           # Icons and favicons
└── docs/                     # Documentation
    ├── AUDIO_LOOPING_RCA.md           # Audio fix analysis
    ├── AUDIO_COMPARISON_ANALYSIS.md   # Technical comparisons
    └── CRITICAL_AUDIO_DIFFERENCE_REPORT.md
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/TheAviator.git
   cd TheAviator
   ```

2. **Start a local server**
   ```bash
   python3 -m http.server 8080
   # or use any static file server
   ```

3. **Open in browser**
   ```
   http://localhost:8080
   ```

4. **Select your game mode** from the main menu

## 🔧 Key Features & Improvements

### Audio System Overhaul
- **Seamless propeller looping** - Fixed the original audio gaps
- **Persistent AudioBufferSourceNode** - Single source that never stops
- **Smart volume management** - Changes volume instead of restarting audio
- **Web Audio API integration** - Precise loop point control

### Code Organization
- **Modular architecture** - Clean separation of game modes
- **Descriptive file names** - No more generic `game.js`
- **Shared resources** - Common assets in dedicated folders
- **Maintainable structure** - Easy to add new game modes

### Game Mode Controller
- **Dynamic loading** - Loads game-specific scripts on demand
- **State management** - Handles switching between games
- **Resource optimization** - Only loads what's needed

## 🛠️ Development

### Adding a New Game Mode

1. Create new folder: `games/your-game-name/`
2. Add the required structure:
   ```
   games/your-game-name/
   ├── js/game.js
   ├── css/styles.css
   └── assets/
       ├── audio/
       ├── models/
       └── images/
   ```
3. Update `shared/js/game-mode-controller.js` to handle the new mode
4. Add UI button in `index.html`

### Building & Deployment

The project uses vanilla JavaScript with no build process required. Simply serve the static files.

## 📚 Documentation

- **[Audio Looping RCA](docs/AUDIO_LOOPING_RCA.md)** - Technical analysis of the audio fix
- **[Audio Comparison](docs/AUDIO_COMPARISON_ANALYSIS.md)** - Before/after audio analysis
- **[Critical Differences](docs/CRITICAL_AUDIO_DIFFERENCE_REPORT.md)** - Implementation details

## 🎯 Technical Highlights

- **Web Audio API mastery** - Seamless propeller audio looping
- **Three.js optimization** - Efficient 3D rendering and game modes
- **Modular JavaScript** - Clean separation between game versions
- **Cross-browser compatibility** - Works on modern browsers
- **Performance optimized** - Smooth 60fps gameplay

## 📄 License

Based on Karim Maaloul's original "The Aviator" tutorial.

Integrate or build upon it for free in your personal or commercial projects. Don't republish, redistribute or sell "as-is".

Read more: [Codrops Licensing](http://tympanus.net/codrops/licensing/)

## 🙏 Credits

- **Original "The Aviator"**: Karim Maaloul ([@yakudoo](https://twitter.com/yakudoo))
- **Codrops Tutorial**: [Article](http://tympanus.net/codrops/?p=26501)
- **Libraries**:
  - [Three.js](http://threejs.org/)
  - [TweenMax](http://greensock.com)
- **Audio Analysis**: GPT-4 for propeller looping fix

## 🎮 Play Online

[Demo](http://tympanus.net/Tutorials/TheAviator/) (Original Aviator Classic)

---

**🛩️ Top Rug - Fly High, Collect Big!** 🚀





