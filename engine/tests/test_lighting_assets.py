import pytest
from engine.lighting import DirectionalLight, PointLight, SpotLight, LightingSystem, ShadowMap
from engine.assets import AssetManager, Mesh

def test_lighting_types_and_shadow_map():
    lights = LightingSystem()
    sun = lights.add(DirectionalLight("sun", intensity=2.0, casts_shadows=True))
    lights.add(PointLight("lamp", position=(1, 2, 3)))
    lights.add(SpotLight("flashlight"))
    assert sun.kind == "directional"
    assert len(lights.enabled_lights()) == 3
    shadow = ShadowMap("sun").allocate()
    assert shadow.allocated is True
    shadow.release()
    assert shadow.allocated is False

def test_invalid_shadow_settings():
    shadow = ShadowMap("sun")
    shadow.settings.resolution = 0
    with pytest.raises(ValueError):
        shadow.allocate()

def test_asset_manager_mesh_lifecycle():
    assets = AssetManager()
    mesh = assets.register_mesh(Mesh("player", vertices=[(0, 0, 0)], indices=[0]))
    assert assets.get_mesh("player") is mesh
    assets.unload_mesh("player")
    assert assets.get_mesh("player") is None
