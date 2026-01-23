# Reference Folder - Historical Code Archives

This folder contains **reference implementations** of previous game versions and the original base game. These are preserved for historical context and code comparison but are **NOT part of the active development**.

## 📁 Contents

### `top-rug-maverick/`
**Legacy Combat Mode Implementation**
- Original combat game with free-flight mechanics
- Complex airplane model with custom geometry
- Shooting system with multiple weapon types
- Legacy codebase (~1976 lines in main game.js)
- **Status:** Preserved for reference, not maintained

### `the-aviator-base/`
**Original Base Game (TheAviator2)**
- Fork of [Badestrand/TheAviator2](https://github.com/Badestrand/TheAviator2)
- Original game by Karim Maaloul with improvements
- Classic free-flight airplane game
- **Status:** Original foundation, read-only reference

## ⚠️ Important Notes

### Reference Only
- **DO NOT modify** files in this folder
- **DO NOT use** this code in active development
- **DO NOT deploy** from this folder
- These exist solely for historical comparison

### Development Guidelines
- Active development happens in `/core/`, `/games/`, and `/shared/`
- New games should be built using the clean ECS architecture
- Reference this folder only when comparing implementations

### Why We Keep This
1. **Historical Context** - Shows evolution from base game to clean engine
2. **Code Comparison** - Compare old vs new implementations
3. **Asset Reference** - Original assets and models
4. **Learning Resource** - Study different architectural approaches

## 🚀 Active Development

For building new games, use the clean engine in the root directory:
- **Engine Core:** `/core/` (ECS architecture)
- **Example Game:** `/games/top-rug/` (Endless runner)
- **Shared Utils:** `/shared/` (Libraries and utilities)

---

## 🔍 Code Evolution Timeline

1. **the-aviator-base/** - Original game foundation
2. **top-rug-maverick/** - Our first implementation (combat mode)
3. **../ (root)** - Clean ECS engine architecture

This shows the progression from the original tutorial game → our enhanced version → clean, maintainable engine.

---

**Remember:** This reference folder is like a museum - look but don't touch! 🏛️