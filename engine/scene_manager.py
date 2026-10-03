class SceneManager:
    def __init__(self): self.scenes={}; self.current=None; self.previous=None
    def add(self,scene): self.scenes[scene.name]=scene; return scene
    def load(self,name):
        if name not in self.scenes: raise KeyError(f"Scene Error: unknown scene '{name}'")
        self.previous=self.current; self.current=self.scenes[name]; return self.current
    def back(self):
        if self.previous is None: return None
        self.current,self.previous=self.previous,self.current; return self.current
    def get(self,name): return self.scenes.get(name)
