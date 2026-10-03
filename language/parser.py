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

@dataclass
class Binary:
    left: object
    op: str
    right: object

@dataclass
class Unary:
    op: str
    value: object

@dataclass
class Call:
    name: str
    args: list

@dataclass
class Function:
    name: str
    params: list
    body: list

@dataclass
class Event:
    name: str
    body: list

@dataclass
class Return:
    value: object

class Parser:
    def __init__(self, source: str):
        self.tokens = lex(source)
        self.i = 0

    @property
    def current(self):
        return self.tokens[self.i]

    def eat(self, kind=None, value=None):
        t = self.current
        if kind and t.kind != kind:
            raise SyntaxError(f"Expected {kind}, got {t.kind} at {t.line}:{t.column}")
        if value and t.value != value:
            raise SyntaxError(f"Expected {value!r}, got {t.value!r} at {t.line}:{t.column}")
        self.i += 1
        return t

    def parse(self):
        nodes = []
        while self.current.kind != "EOF":
            if self.current.kind == "PUNC" and self.current.value == ";":
                self.eat()
                continue
            nodes.append(self.statement())
        return nodes

    def block(self):
        self.eat("PUNC", "{")
        nodes = []
        while not (self.current.kind == "PUNC" and self.current.value == "}"):
            nodes.append(self.statement())
        self.eat("PUNC", "}")
        return nodes

    def statement(self):
        if self.current.value == "print":
            self.eat("KEYWORD")
            return Print(self.expression())
        if self.current.value == "return":
            self.eat("KEYWORD")
            return Return(self.expression())
        if self.current.value == "function":
            self.eat("KEYWORD")
            name = self.eat("ID").value
            self.eat("PUNC", "(")
            params = []
            if self.current.value != ")":
                while True:
                    params.append(self.eat("ID").value)
                    if self.current.value != ",":
                        break
                    self.eat("PUNC", ",")
            self.eat("PUNC", ")")
            return Function(name, params, self.block())
        if self.current.value == "event":
            self.eat("KEYWORD")
            name = self.eat("ID").value
            return Event(name, self.block())
        if self.current.kind == "KEYWORD" and self.current.value in ("number", "text", "yesno"):
            self.eat("KEYWORD")
        name = self.eat("ID").value
        self.eat("ARROW")
        return Assign(name, self.expression())

    def expression(self):
        return self.comparison()

    def comparison(self):
        node = self.term()
        while self.current.value in ("==", "!=", "<", "<=", ">", ">="):
            op = self.eat().value
            node = Binary(node, op, self.term())
        return node

    def term(self):
        node = self.factor()
        while self.current.value in ("+", "-"):
            op = self.eat().value
            node = Binary(node, op, self.factor())
        return node

    def factor(self):
        node = self.unary()
        while self.current.value in ("*", "/", "%"):
            op = self.eat().value
            node = Binary(node, op, self.unary())
        return node

    def unary(self):
        if self.current.value in ("-", "!"):
            op = self.eat().value
            return Unary(op, self.unary())
        return self.primary()

    def primary(self):
        t = self.current
        if t.kind == "PUNC" and t.value == "(":
            self.eat()
            node = self.expression()
            self.eat("PUNC", ")")
            return node
        if t.kind == "STRING":
            self.eat()
            return Literal(bytes(t.value[1:-1], "utf-8").decode("unicode_escape"))
        if t.kind == "NUMBER":
            self.eat()
            return Literal(float(t.value) if "." in t.value else int(t.value))
        if t.value in ("true", "false"):
            self.eat()
            return Literal(t.value == "true")
        if t.kind == "ID":
            name = self.eat().value
            if self.current.value == "(":
                self.eat("PUNC", "(")
                args = []
                if self.current.value != ")":
                    while True:
                        args.append(self.expression())
                        if self.current.value != ",":
                            break
                        self.eat("PUNC", ",")
                self.eat("PUNC", ")")
                return Call(name, args)
            return Name(name)
        raise SyntaxError(f"Expected expression at {t.line}:{t.column}")
