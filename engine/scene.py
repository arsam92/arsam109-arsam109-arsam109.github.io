from dataclasses import dataclass,field
@dataclass
class Entity:
    id:str; name:str; components:dict=field(default_factory=dict); active:bool=True
    def add(self,component,value): self.components[component]=value; return self
    def get(self,component,default=None): return self.components.get(component,default)
@dataclass
class Scene:
    name:str; entities:dict=field(default_factory=dict)
    def spawn(self,entity_id,name):
        e=Entity(entity_id,name); self.entities[entity_id]=e; return e
    def despawn(self,entity_id): self.entities.pop(entity_id,None)
    def find(self,entity_id): return self.entities.get(entity_id)
