import unittest
from language.ir import compile_to_ir

class IRTests(unittest.TestCase):
    def test_assignment_and_print(self):
        code = compile_to_ir("number x =>> 10\nprint x")
        ops = [item.op for item in code]
        self.assertEqual(ops, ["const", "store", "load", "print"])

if __name__ == "__main__":
    unittest.main()
