from dataclasses import dataclass, field
from typing import Tuple
Vec3 = Tuple[float, float, float]

@dataclass
class Light:
    id: str
    kind: str = "point"
    color: Vec3 = (1.0, 1.0, 1.0)
    intensity: float = 1.0
    casts_shadows: bool = False
    enabled: bool = True

@dataclass
class DirectionalLight(Light):
    direction: Vec3 = (0.0, -1.0, 0.0)
    kind: str = "directional"

@dataclass
class PointLight(Light):
    position: Vec3 = (0.0, 0.0, 0.0)
    range: float = 10.0
    kind: str = "point"

@dataclass
class SpotLight(Light):
    position: Vec3 = (0.0, 0.0, 0.0)
    direction: Vec3 = (0.0, -1.0, 0.0)
    inner_angle: float = 20.0
    outer_angle: float = 35.0
    range: float = 20.0
    kind: str = "spot"

@dataclass
class LightingSystem:
    ambient_color: Vec3 = (0.1, 0.1, 0.1)
    ambient_intensity: float = 1.0
    lights: dict = field(default_factory=dict)
    def add(self, light):
        if light.kind not in {"directional", "point", "spot"}:
            raise ValueError(f"unsupported light type: {light.kind}")
        self.lights[light.id] = light
        return light
    def remove(self, light_id):
        self.lights.pop(light_id, None)
    def enabled_lights(self):
        return [light for light in self.lights.values() if light.enabled]

@dataclass
class ShadowSettings:
    enabled: bool = True
    resolution: int = 2048
    bias: float = 0.001
    cascades: int = 4

@dataclass
class ShadowMap:
    light_id: str
    settings: ShadowSettings = field(default_factory=ShadowSettings)
    allocated: bool = False
    def allocate(self):
        if self.settings.resolution <= 0:
            raise ValueError("shadow resolution must be positive")
        if self.settings.cascades <= 0:
            raise ValueError("shadow cascades must be positive")
        self.allocated = True
        return self
    def release(self):
        self.allocated = False
