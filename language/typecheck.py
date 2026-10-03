from dataclasses import dataclass
from .parser import Assign, Print, Literal, Name

@dataclass(frozen=True)
class Type:
    name: str

NUMBER = Type("number")
TEXT = Type("text")
YESNO = Type("yesno")
UNKNOWN = Type("unknown")

def infer(value, env):
    if isinstance(value, Literal):
        if isinstance(value.value, bool): return YESNO
        if isinstance(value.value, (int, float)): return NUMBER
        if isinstance(value.value, str): return TEXT
    if isinstance(value, Name): return env.get(value.value, UNKNOWN)
    return UNKNOWN

def check(program):
    env, errors = {}, []
    for node in program:
        if isinstance(node, Assign):
            t = infer(node.value, env)
            if t is UNKNOWN and isinstance(node.value, Name):
                errors.append(f"Reference Error: unknown variable '{node.value.value}'")
            env[node.name] = t
        elif isinstance(node, Print):
            t = infer(node.value, env)
            if t is UNKNOWN:
                errors.append("Type Error: cannot determine printable value")
    return env, errors
