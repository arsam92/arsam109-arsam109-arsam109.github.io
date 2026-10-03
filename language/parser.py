from dataclasses import dataclass
from .lexer import lex

@dataclass
class Assign:
    name: str
    value: object

@dataclass
class Print:
    value: object

@dataclass
class Literal:
    value: object

@dataclass
class Name:
    value: str

class Parser:
    def __init__(self, source: str):
        self.tokens = lex(source)
        self.i = 0

    @property
    def current(self):
        return self.tokens[self.i]

    def eat(self, kind=None, value=None):
        t = self.current
        if kind and t.kind != kind: raise SyntaxError(f"Expected {kind}, got {t.kind} at {t.line}:{t.column}")
        if value and t.value != value: raise SyntaxError(f"Expected {value!r}, got {t.value!r} at {t.line}:{t.column}")
        self.i += 1
        return t

    def parse(self):
        nodes = []
        while self.current.kind != "EOF":
            nodes.append(self.statement())
        return nodes

    def statement(self):
        if self.current.value == "print":
            self.eat("KEYWORD")
            return Print(self.expression())
        if self.current.kind == "KEYWORD" and self.current.value in ("number", "text", "yesno"):
            self.eat("KEYWORD")
        name = self.eat("ID").value
        self.eat("ARROW")
        return Assign(name, self.expression())

    def expression(self):
        t = self.current
        if t.kind == "STRING":
            self.eat(); return Literal(bytes(t.value[1:-1], "utf-8").decode("unicode_escape"))
        if t.kind == "NUMBER":
            self.eat(); return Literal(float(t.value) if "." in t.value else int(t.value))
        if t.value in ("true", "false"):
            self.eat(); return Literal(t.value == "true")
        if t.kind == "ID":
            self.eat(); return Name(t.value)
        raise SyntaxError(f"Expected expression at {t.line}:{t.column}")
