# Lighting, Shadows, and Assets

ARlun's rendering foundation now has explicit lighting and shadow data instead of fake projected shadows.

## Lights

Supported light types:
- directional — sun-like light with a direction.
- point — local light with position and range.
- spot — cone-shaped local light with inner and outer angles.

Each light has color, intensity, enabled state, and an explicit casts_shadows flag.

## Shadows

ShadowSettings describes a renderer-independent shadow-map configuration. ShadowMap represents the GPU shadow resource that a future backend will allocate and render.

Directional lights expose cascaded-shadow configuration through cascades. This is a real shadow pipeline foundation; it does not draw a fake dark shape on the floor.

The current Python layer deliberately does not pretend to be a GPU renderer. A backend can later turn ShadowMap.allocate() into actual depth-texture allocation and shadow-pass rendering.

## Assets and meshes

AssetManager owns registered meshes and materials. Mesh stores vertex/index data and an optional material reference.

The next backend stage can add GLB/GLTF/OBJ importers without changing scene or gameplay code.
