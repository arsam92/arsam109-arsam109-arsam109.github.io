from dataclasses import dataclass, field

@dataclass
class Material:
    name: str = "default"
    shader: str = "lit"
    properties: dict = field(default_factory=dict)

@dataclass
class RenderObject:
    id: str
    shape: str = "cube"
    material: Material = field(default_factory=Material)
    visible: bool = True

@dataclass
class Renderer:
    objects: dict = field(default_factory=dict)
    clear_color: tuple = (0.08, 0.08, 0.10)

    def create(self, object_id, shape="cube", material=None):
        obj = RenderObject(object_id, shape, material or Material())
        self.objects[object_id] = obj
        return obj

    def destroy(self, object_id):
        self.objects.pop(object_id, None)

    def set_material(self, object_id, material):
        self.objects[object_id].material = material

    def visible_objects(self):
        return [o for o in self.objects.values() if o.visible]
