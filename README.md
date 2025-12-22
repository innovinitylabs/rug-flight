# Top Rug - Lane-Based Endless Runner

A **complete rewrite** of the classic flight game featuring a **modern, clean architecture** with **lane-based movement**, **procedural obstacles**, and **modular systems design**. Experience the evolution from free-flight to structured endless runner gameplay!

**🎮 Game Mode:**
- **Top Rug** - Lane-based endless runner with procedural obstacles, collectible coins, and strategic lane switching

## 🎮 Game Mode

### Top Rug - Lane-Based Endless Runner
- **Strategic lane switching** - Choose between 3 lanes to avoid obstacles
- **Procedural obstacle spawning** - Distance-based difficulty scaling
- **Collectible coins** - Gold spheres scattered across lanes
- **Health system** - Survive collisions with damage and recovery
- **Smooth camera following** - Stable framing with vertical constraints
- **Modular architecture** - Clean separation of systems and responsibilities

## 🏗️ Project Architecture

```
rug-flight/
├── index.html                    # Main entry point with game mode selector
├── README.md                     # This file
├── core/                         # Core game engine components
│   └── MovementModel.js         # Movement utilities and models
├── games/                        # Game-specific implementations
│   └── top-rug/                 # Top Rug - Lane-Based Endless Runner
│       ├── js/
│       │   └── game.js          # Complete modular game architecture
│       ├── css/
│       │   └── styles.css       # Game-specific styles
│       └── assets/              # Game assets (audio, images, models)
├── shared/                       # Shared resources across games
│   ├── js/
│   │   ├── game-mode-controller.js  # Mode selection & loading
│   │   ├── three.min.js         # Three.js 3D engine
│   │   ├── TweenMax.min.js      # Animation library
│   │   └── utils.js             # Shared utility functions
│   ├── css/
│   │   └── ui.css              # Shared UI styles
│   └── assets/                  # Shared assets
│       ├── fonts/              # Web fonts
│       └── icons/              # Icons and branding
└── docs/                        # Technical documentation
    ├── AUDIO_LOOPING_RCA.md           # Audio system analysis
    ├── AUDIO_COMPARISON_ANALYSIS.md   # Technical comparisons
    └── CRITICAL_AUDIO_DIFFERENCE_REPORT.md
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/innovinitylabs/rug-flight.git
   cd rug-flight
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

## 🔧 Key Features & Architecture

### 🏗️ Clean Modular Architecture
- **Entity-Component-System (ECS) Pattern** - Clean separation of data, logic, and presentation
- **PlayerEntity** - Lane-based player with mutable position state
- **Multiple Specialized Systems** - Each system has a single responsibility
- **Observer Pattern** - Systems communicate through domain events
- **Presentation-Logic Separation** - Rendering systems never mutate game state

### 🎮 Game Systems Implemented
- **PlayerIntentSystem** - Converts mouse input to semantic game intents
- **PlayerActionStateSystem** - Manages cooldowns, stun states, and action gating
- **LaneSystem** - Defines discrete lateral gameplay space (3 lanes)
- **LaneController** - Processes intents into target lane changes
- **PlayerVisualMovementSystem** - Smoothly animates player between lanes
- **PlayerVerticalConstraintSystem** - Enforces camera framing constraints
- **ObstacleSpawnSystem** - Procedural obstacle generation with difficulty scaling
- **Collision Systems** - Intent detection, consumption, and consequence handling
- **Audio & VFX Systems** - Observer-only presentation feedback

### 🎯 Lane-Based Gameplay
- **Discrete Lane Movement** - No free-floating horizontal drift
- **Strategic Lane Switching** - Mouse-based intent with cooldown mechanics
- **Procedural Obstacles** - Brown boxes spawning in lanes at increasing frequency
- **Collision Consequences** - Health system with damage and stun mechanics
- **Progressive Difficulty** - Distance-based scaling of spawn rates and patterns

### 🎨 Visual & Audio Systems
- **Stable Camera Framing** - Vertical constraints ensure consistent viewing
- **Smooth Lane Transitions** - Lerped movement between discrete positions
- **Presentation-Only Feedback** - Audio and VFX respond to domain events
- **Performance Optimized** - No per-frame console spam, efficient rendering

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

## 🎯 Technical Achievements

- **Complete Architecture Rewrite** - From legacy flight game to modern ECS endless runner
- **Clean System Separation** - Presentation, gameplay, and data layers properly isolated
- **Lane-Based Movement System** - Discrete positioning with smooth transitions
- **Procedural Content Generation** - Distance-based obstacle spawning with difficulty scaling
- **Domain Event Architecture** - Observer pattern for system communication
- **Performance Optimization** - Zero console spam, efficient 3D rendering
- **Modular Game Systems** - Each system has single responsibility and clean interfaces
- **Progressive Game Design** - From free-flight prototype to structured endless runner

## 📊 Current Development Status

### ✅ **Completed Features**
- **Lane-Based Player Movement** - 3-lane discrete positioning with smooth transitions
- **Player Intent System** - Mouse input to semantic game intents (MOVE_LEFT/RIGHT/HOLD)
- **Action State Management** - Cooldowns, stun states, and intent gating
- **Procedural Obstacles** - Distance-based spawning in random lanes
- **Collision Detection** - Player vs obstacle collision intents
- **Health & Damage System** - Player survival with lives and damage mechanics
- **Coin Collection** - Collectible entities with scoring and audio feedback
- **Camera Stability** - Vertical constraints and smooth following
- **Clean Console** - Zero per-frame spam, useful debug logging only

### 🚧 **Architecture Foundation**
- **Entity-Component-System Pattern** - Clean data/logic/presentation separation
- **Observer Pattern Implementation** - Domain events for system communication
- **Modular System Design** - Single responsibility per system
- **Performance Monitoring** - Efficient 3D rendering and game loops
- **Extensible Framework** - Easy to add new game modes and features

### 🎯 **Ready for Next Phase**
The core endless runner mechanics are complete and stable. Ready for:
- Advanced obstacle patterns and enemy AI
- Power-ups and special abilities
- Enhanced visual effects and particle systems
- Multiplayer considerations
- Mobile/touch controls

## 📄 License

Based on Karim Maaloul's original "The Aviator" tutorial.

Integrate or build upon it for free in your personal or commercial projects. Don't republish, redistribute or sell "as-is".

Read more: [Codrops Licensing](http://tympanus.net/codrops/licensing/)

## 🙏 Credits

- **Original "The Aviator"**: Karim Maaloul ([@yakudoo](https://twitter.com/yakudoo))
- **Codrops Tutorial**: [Article](http://tympanus.net/codrops/?p=26501)
- **Complete Architecture Rewrite**: Modern ECS endless runner implementation
- **Libraries**:
  - [Three.js](http://threejs.org/) - 3D WebGL engine
  - [TweenMax](http://greensock.com) - Animation library
- **AI Assistance**: Claude for architecture design and implementation guidance
- **Audio Analysis**: Technical analysis and seamless propeller looping implementation

## 🎮 Play Online

**Top Rug - Lane-Based Endless Runner** - Experience the evolution from free-flight to structured endless runner gameplay!

*Local development server required - see Getting Started above*

---

**🛩️ Top Rug - Switch Lanes, Stay Alive!** 🚀





