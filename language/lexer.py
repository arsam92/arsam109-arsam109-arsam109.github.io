from dataclasses import dataclass
import re

KEYWORDS = {"number", "text", "yesno", "list", "entity", "function", "print", "gvola", "true", "false"}

@dataclass(frozen=True)
class Token:
    kind: str
    value: str
    line: int
    column: int

TOKEN_RE = re.compile(
    r'(?P<WS>[ \\t]+)|(?P<NL>\\n)|(?P<COMMENT>//[^\\n]*)|'
    r'(?P<STRING>"(?:\\\\.|[^"\\\\])*")|(?P<NUMBER>\\d+(?:\\.\\d+)?)|'
    r'(?P<ARROW>=>>)|(?P<EQ>==)|(?P<OP>[+\\-*/=><])|'
    r'(?P<ID>[A-Za-z_][A-Za-z0-9_]*)|(?P<PUNC>[(){}\\[\\],.;:])'
)

def lex(source: str):
    tokens, pos, line, col = [], 0, 1, 1
    while pos < len(source):
        m = TOKEN_RE.match(source, pos)
        if not m:
            raise SyntaxError(f"Unexpected character {source[pos]!r} at {line}:{col}")
        kind, value = m.lastgroup, m.group()
        if kind == "NL":
            line += 1; col = 1
        elif kind not in ("WS", "COMMENT"):
            token_kind = "KEYWORD" if kind == "ID" and value in KEYWORDS else kind
            tokens.append(Token(token_kind, value, line, col))
            col += len(value)
        else:
            col += len(value)
        pos = m.end()
    tokens.append(Token("EOF", "", line, col))
    return tokens
