import unittest
from engine import Renderer, Camera, Material, create_primitive

class RenderTests(unittest.TestCase):
    def test_renderer_and_material(self):
        r = Renderer()
        obj = r.create("ball", "sphere", Material("metal"))
        self.assertEqual(obj.shape, "sphere")
        self.assertEqual(obj.material.name, "metal")

    def test_camera_modes(self):
        c = Camera().first_person("player")
        self.assertEqual(c.mode, "first_person")
        self.assertEqual(c.target, "player")

    def test_primitive(self):
        r = Renderer()
        self.assertEqual(create_primitive(r, "ball", "sphere").shape, "sphere")

if __name__ == "__main__":
    unittest.main()
