# Assets

Put game assets in this directory.

## Supported by the browser runtime

- `.gltf` with external or embedded buffers
- `.glb` with an embedded binary buffer
- PNG/JPEG images used by glTF base-color textures
- glTF PBR base-color factor
- glTF metallic and roughness factors

The browser loader is in `web/arlun-assets.js`.

The bundled `scene.gltf` is a small self-contained test asset. It contains its geometry and a tiny embedded PNG texture, so the browser can load it without another download.

## Adding your own model

Copy your model into this folder and change the URL in `web/arlun-webgl.js`, for example:

```js
loadGLTF(gl, "assets/player.glb")
```

For production game assets, prefer optimized GLB files and keep texture dimensions reasonable.
