# ARlun Web Runtime

The repository now has a browser-facing ARlun runtime at `index.html`.

## What the browser renders

The runtime uses native WebGL2. There is no Three.js dependency.

The current pipeline is:

```text
index.html
   ↓
web/arlun-webgl.js
   ↓
WebGL2 shaders + GPU buffers
   ↓
web/arlun-assets.js
   ↓
GLTF / GLB → Mesh + Material + Texture2D
   ↓
GPU draw calls
```

The renderer includes a depth buffer, perspective camera, directional lighting, diffuse/specular response, textured materials, metallic/roughness controls, and back-face culling.

## Asset loading

`web/arlun-assets.js` contains:

- `Texture2D` — uploads image data to a WebGL texture and configures filtering/wrapping.
- `Material` — stores base color, metallic, roughness, texture and double-sided state.
- `GPUMesh` — creates VAO/VBO/EBO resources and issues indexed triangle draws.
- `loadGLTF()` — loads `.gltf` or `.glb`, reads accessors/buffer views, decodes images and creates GPU meshes/materials.

The bundled `assets/scene.gltf` is a self-contained textured cube test asset. Its geometry and PNG texture are embedded as data URIs, so it works without an additional asset server.

## Add a real model

Place a model in `assets/` and change the URL in `web/arlun-webgl.js`:

```js
loadGLTF(gl, "assets/player.glb")
```

GLB is recommended for shipping because it can package the scene data into one file.

The current loader focuses on triangle primitives and the common PBR fields:
`baseColorTexture`, `baseColorFactor`, `metallicFactor`, and `roughnessFactor`.

## GitHub Pages

Enable Pages for the `main` branch and repository root. The project-site URL for this repository is:

```text
https://arsam92.github.io/arsam109-arsam109-arsam109.github.io/
```

## Local development

From the repository root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

A browser with WebGL2 support is required.

## Next renderer milestones

The next major steps are node hierarchy transforms, normal/metallic-roughness maps, multiple light types, real shadow-map passes, skinning/animation, and an in-browser 3D editor.
