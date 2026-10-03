import unittest
from language.lexer import lex
from language.parser import Parser, Assign
from language.typecheck import check

class CoreTests(unittest.TestCase):
    def test_lexer(self):
        tokens = lex("number x =>> 10")
        self.assertEqual(tokens[0].value, "number")
        self.assertEqual(tokens[3].value, "10")

    def test_parser(self):
        program = Parser("x =>> 10").parse()
        self.assertIsInstance(program[0], Assign)

    def test_types(self):
        env, errors = check(Parser("x =>> 10\nprint x").parse())
        self.assertEqual(env["x"].name, "number")
        self.assertEqual(errors, [])

if __name__ == "__main__":
    unittest.main()
