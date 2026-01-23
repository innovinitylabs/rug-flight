# Rug Flight - Clean 3D Game Engine

A **modern, clean 3D game engine** built with Three.js, featuring **Entity-Component-System (ECS) architecture**, **lane-based movement systems**, and **modular design**. Includes a complete endless runner example game.

**🎮 Example Game:**
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
├── index.html                    # Main entry point
├── README.md                     # This file
├── core/                         # Game engine core (8 files)
│   ├── config/
│   │   └── DebugConfig.js       # Debug configuration
│   ├── entities/
│   │   ├── PlayerEntity.js      # Player entity with airplane
│   │   └── ObstacleEntity.js    # Obstacle entity
│   ├── factories/
│   │   └── AirplaneFactory.js   # Airplane model factory
│   ├── controllers/
│   │   └── PlayerController.js  # Player input controller
│   ├── systems/                 # ECS systems
│   │   ├── PlayerMovementPipelineSystem.js
│   │   ├── LaneDebugVisualSystem.js
│   │   └── SingleObstacleSpawnerSystem.js
│   └── MovementModel.js         # Movement utilities
├── games/                       # Example games
│   └── top-rug/                 # Endless runner example
│       ├── js/game.js           # Modern ECS game implementation
│       ├── css/styles.css       # Game-specific styles
│       └── assets/              # Game assets (audio, images)
├── shared/                      # Engine utilities (5 files)
│   ├── js/
│   │   ├── logger.js            # Structured logging system
│   │   ├── utils.js             # Utility functions
│   │   ├── game-mode-controller.js # Game loading controller
│   │   ├── three.min.js         # Three.js 3D engine
│   │   └── TweenMax.min.js      # Animation library
│   ├── css/
│   │   └── ui.css               # UI styles
│   └── assets/
│       └── icons/               # Essential icons (favicon)
└── reference/                   # Legacy code reference
    └── top-rug-maverick/        # Original combat game (preserved)
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/innovinitylabs/rug-flight.git
   cd rug-flight
   ```

2. **Start the development server**
   ```bash
   python3 -m http.server 8080
   ```

3. **Open in browser**
   ```
   http://localhost:8080
   ```

4. **Play the endless runner game**

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

## 📊 Engine Status

### ✅ **Engine Features**
- **Entity-Component-System (ECS)** - Clean separation of data, logic, and presentation
- **Lane-Based Movement System** - 3-lane discrete positioning with smooth transitions
- **Modular Architecture** - Easy to extend and modify
- **Structured Logging** - Clean console output with configurable levels
- **Global Variable System** - Compatible with simple HTTP servers
- **Airplane Model Factory** - 3D airplane with animations from legacy game
- **Observer Pattern** - Domain events for system communication

### 🎮 **Example Game (Top Rug)**
- **Procedural Obstacles** - Distance-based spawning in random lanes
- **Coin Collection** - Collectible entities with scoring
- **Collision Detection** - Player vs obstacle interactions
- **Camera Following** - Smooth camera with vertical constraints
- **Audio System** - Sound effects and background music

### 🚀 **Ready for Development**
The engine is clean and ready for building new games:
- Create new game folders in `/games/`
- Extend the ECS systems for new mechanics
- Use the AirplaneFactory or create new entity factories
- Add new assets and modify existing systems
- Simple deployment with Python HTTP server

## 📄 License

Built on Karim Maaloul's "The Aviator" tutorial foundation.

Integrate or build upon it for free in your personal or commercial projects. Don't republish, redistribute or sell "as-is".

Read more: [Codrops Licensing](http://tympanus.net/codrops/licensing/)

## 🙏 Credits

- **Original "The Aviator"**: Karim Maaloul ([@yakudoo](https://twitter.com/yakudoo))
- **Codrops Tutorial**: [Article](http://tympanus.net/codrops/?p=26501)
- **Modern Engine Architecture**: Clean ECS implementation with modular systems
- **Libraries**:
  - [Three.js](http://threejs.org/) - 3D WebGL engine
  - [TweenMax](http://greensock.com) - Animation library
- **AI Assistance**: Claude for architecture design and implementation guidance
- **Legacy Code Preservation**: Original combat game saved in `/reference/`

## 🎮 Development

**Ready to build new games with this clean engine!**

The ECS architecture makes it easy to:
- Add new entity types and systems
- Create different game mechanics
- Extend the airplane or create new vehicles
- Add multiplayer support
- Implement mobile controls

*Local development server required - see Getting Started above*

---

**🛩️ Top Rug - Switch Lanes, Stay Alive!** 🚀





