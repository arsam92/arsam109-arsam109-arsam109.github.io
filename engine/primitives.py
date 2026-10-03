SUPPORTED_SHAPES = (
    "cube", "sphere", "plane", "capsule", "cylinder", "cone",
    "torus", "quad", "circle", "line", "mesh", "terrain"
)

def create_primitive(renderer, object_id, shape):
    if shape not in SUPPORTED_SHAPES:
        raise ValueError(f"Asset Error: unsupported primitive '{shape}'")
    return renderer.create(object_id, shape)
