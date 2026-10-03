# ARlun Runtime

The runtime layer sits between ARlun language features and game-engine systems.

Current responsibilities:
- Execute language values and expressions
- Manage variables and functions
- Prepare IR execution
- Provide the bridge for future entities, scenes, input, physics, audio, and networking

The runtime is intentionally separated from the game engine so ARlun can also be used for tools and non-game logic.
