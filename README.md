# ARlun

**ARlun** is a game-focused programming language and runtime being built around one idea: gameplay code should stay readable while the engine handles serious systems such as 3D rendering, physics, AI, animation, scenes, networking, assets, and debugging.

## 🚀 Try the browser runtime

Once GitHub Pages is enabled for the `main` branch, open:

**https://arsam92.github.io/arsam109-arsam109-arsam109.github.io/**

The current web runtime is already GPU-backed through **WebGL2**. Click the scene to capture the mouse.

### Controls

| Key | Action |
|---|---|
| W A S D | Move |
| Mouse | Look |
| Space | Jump |
| R | Reset camera |

## 🎮 What exists now

### Language
ARlun currently has a working lexer → parser → type-checker → IR pipeline and runtime support for variables, entities, properties, functions, events, expressions, printing, and return values.

Example:

```arlun
entity player
player.gra =>> 9.8
player.vel =>> 10
print player.vel
```

### 3D engine foundation

The Python engine currently contains:

- Scene and SceneManager
- Input
- Transforms
- Physics bodies and AABB collision
- Renderer and materials
- First-person / third-person camera
- 12 primitive shape types
- Directional, point, and spot lights
- Shadow-map configuration
- Mesh and asset management

### 🌐 WebGL2 renderer

The browser side now contains a native WebGL2 renderer with:

- GPU vertex + fragment shaders
- Depth buffering
- Back-face culling
- Perspective camera
- Directional diffuse + specular lighting
- Real GPU mesh buffers
- Texture2D handling
- Material parameters: base color, metallic, roughness
- `.gltf` / `.glb` loading
- Embedded/external asset data support
- A bundled textured glTF demo model
- WASD movement, mouse look, jump, and reset

There is no Three.js dependency in the current renderer.

## 📁 Repository layout

```text
language/    ARlun language, parser, type checking, IR and runtime
engine/      Engine-side scene, physics, rendering, lighting and assets
web/         Browser WebGL2 runtime and asset loader
assets/      Demo and future game assets
ai/          AI architecture and systems
docs/        Technical documentation
examples/    ARlun example programs
```

## 🧠 AI direction

ARlun's AI architecture is goal-driven rather than “know everything and react.” The planned flow is:

```text
Perception
   ↓
Memory
   ↓
Think
   ↓
Goal
   ↓
Plan
   ↓
Vote / Team
   ↓
Execute
   ↓
Check
   ↓
Learn
   ↓
Rethink
```

The intended model supports limited knowledge, communication, team plans, voting, replanning and learning from previous outcomes.

## 🛠️ Local development

Run the browser runtime from the repository root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

For the Python test suite:

```bash
python -m pytest
```

## 🗺️ Roadmap

The next major engine milestones are:

1. Real shadow rendering with depth shadow passes.
2. More complete glTF scene/node transforms.
3. PBR materials, normal maps and multiple lights.
4. A proper 3D editor / viewport.
5. Frame-by-frame animation and rigging.
6. Goal-driven multi-agent AI.
7. Multiplayer networking and server authority.
8. Packaging ARlun games for browser and desktop.

## 📜 License

MIT
