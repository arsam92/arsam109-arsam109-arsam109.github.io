from dataclasses import dataclass,field
@dataclass
class InputState:
    down:set[str]=field(default_factory=set); _pressed:set[str]=field(default_factory=set); _released:set[str]=field(default_factory=set)
    def press(self,key):
        if key not in self.down: self._pressed.add(key)
        self.down.add(key)
    def release(self,key):
        if key in self.down: self._released.add(key)
        self.down.discard(key)
    def is_down(self,key): return key in self.down
    def was_pressed(self,key): return key in self._pressed
    def was_released(self,key): return key in self._released
    def end_frame(self): self._pressed.clear(); self._released.clear()
