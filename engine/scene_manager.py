class SceneManager:
    def __init__(self):
        self.scenes = {}
        self.current = None
        self.previous = []

    def add(self, scene):
        self.scenes[scene.name] = scene
        return scene

    def load(self, name):
        if name not in self.scenes:
            raise KeyError(f"Scene '{name}' not found")
        if self.current is not None:
            self.previous.append(self.current.name)
        self.current = self.scenes[name]
        return self.current

    def back(self):
        if not self.previous:
            return self.current
        self.current = self.scenes[self.previous.pop()]
        return self.current

    def get(self, name):
        return self.scenes.get(name)
