# ARlun Web Runtime

Open `index.html` through GitHub Pages to launch the first browser-based ARlun 3D scene.

The page uses a native WebGL2 context without an external rendering library. The first renderer currently provides:

- GPU vertex and fragment shaders.
- Depth buffering and back-face culling.
- Perspective camera.
- Directional diffuse and specular lighting.
- A 3D ground plane and three animated cube entities.
- WASD movement, mouse look, jump, and camera reset.
- Responsive canvas resolution with a device-pixel-ratio cap.

## GitHub Pages

In the repository settings, enable **Pages** for the `main` branch and the repository root. GitHub will publish `index.html` as the site entry point.

The generated URL follows the normal GitHub Pages project-site pattern:

    https://<owner>.github.io/<repository>/

For this repository that is:

    https://arsam92.github.io/arsam109-arsam109-arsam109.github.io/

## Local development

Run a local HTTP server from the repository root:

    python -m http.server 8000

Then open:

    http://localhost:8000/

A browser with WebGL2 support is required.
