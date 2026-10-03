from dataclasses import dataclass, field

@dataclass
class Camera:
    mode: str = "third_person"
    position: list[float] = field(default_factory=lambda: [0.0, 2.0, 6.0])
    rotation: list[float] = field(default_factory=lambda: [0.0, 0.0, 0.0])
    fov: float = 70.0
    near: float = 0.1
    far: float = 1000.0
    target: str | None = None

    def first_person(self, target):
        self.mode = "first_person"
        self.target = target
        return self

    def third_person(self, target):
        self.mode = "third_person"
        self.target = target
        return self
