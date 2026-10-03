from .parser import Parser, Literal, Name, Assign, Print
from .typecheck import check

def run(source: str):
    program = Parser(source).parse()
    env, errors = check(program)
    if errors:
        raise TypeError("\n".join(errors))
    values = {}
    for node in program:
        if isinstance(node, Assign):
            values[node.name] = node.value.value if isinstance(node.value, Literal) else values[node.value.value]
        elif isinstance(node, Print):
            value = node.value.value if isinstance(node.value, Literal) else values[node.value.value]
            print(value)
    return values

if __name__ == "__main__":
    import sys
    run(open(sys.argv[1], encoding="utf-8").read())
