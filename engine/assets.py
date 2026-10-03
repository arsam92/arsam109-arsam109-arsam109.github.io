from dataclasses import dataclass, field

@dataclass
class Mesh:
    name: str
    vertices: list = field(default_factory=list)
    indices: list = field(default_factory=list)
    material_id: str | None = None

@dataclass
class AssetManager:
    meshes: dict = field(default_factory=dict)
    materials: dict = field(default_factory=dict)
    def register_mesh(self, mesh):
        self.meshes[mesh.name] = mesh
        return mesh
    def get_mesh(self, name):
        return self.meshes.get(name)
    def unload_mesh(self, name):
        self.meshes.pop(name, None)
    def register_material(self, material):
        self.materials[material.name] = material
        return material
    def get_material(self, name):
        return self.materials.get(name)
    def unload_material(self, name):
        self.materials.pop(name, None)
    def clear(self):
        self.meshes.clear()
        self.materials.clear()
