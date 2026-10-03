from dataclasses import dataclass, field

@dataclass
class PhysicsBody:
    velocity: list[float] = field(default_factory=lambda: [0.0, 0.0, 0.0])
    acceleration: list[float] = field(default_factory=lambda: [0.0, 0.0, 0.0])
    gravity: float = 9.8
    mass: float = 1.0
    use_gravity: bool = True
    grounded: bool = False

    def step(self, dt: float, position: list[float]):
        ax, ay, az = self.acceleration
        if self.use_gravity and not self.grounded:
            ay -= self.gravity
        self.velocity[0] += ax * dt
        self.velocity[1] += ay * dt
        self.velocity[2] += az * dt
        position[0] += self.velocity[0] * dt
        position[1] += self.velocity[1] * dt
        position[2] += self.velocity[2] * dt
        return position

def aabb_overlap(a_min, a_max, b_min, b_max):
    return all(a_min[i] <= b_max[i] and a_max[i] >= b_min[i] for i in range(3))
