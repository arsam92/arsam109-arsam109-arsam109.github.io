# ARlun Rendering

The engine now has the first renderer abstraction.

## Renderer
Creates and manages renderable objects.

## Primitives
12 built-in primitive shape identifiers are defined:
cube, sphere, plane, capsule, cylinder, cone, torus, quad, circle, line, mesh and terrain.

## Materials
Materials have a name, shader type and arbitrary properties. The default shader is `lit`.

## Camera
Camera supports first-person and third-person modes, a target, FOV and clipping planes.

This is an engine-side foundation; a real GPU backend will be added separately so rendering remains independent from language semantics.
