from dataclasses import dataclass

@dataclass
class Transform:
    position: list[float] | None = None
    rotation: list[float] | None = None
    scale: list[float] | None = None

    def __post_init__(self):
        self.position = list(self.position or [0.0, 0.0, 0.0])
        self.rotation = list(self.rotation or [0.0, 0.0, 0.0])
        self.scale = list(self.scale or [1.0, 1.0, 1.0])
