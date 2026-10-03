from dataclasses import dataclass
from .parser import Assign,Print,Literal,Name,Member,EntityDecl,Binary,Unary,Call
@dataclass(frozen=True)
class Type: name:str
NUMBER=Type("number"); TEXT=Type("text"); YESNO=Type("yesno"); ENTITY=Type("entity"); UNKNOWN=Type("unknown")
def infer(v,env):
    if isinstance(v,Literal):
        if isinstance(v.value,bool): return YESNO
        if isinstance(v.value,(int,float)): return NUMBER
        if isinstance(v.value,str): return TEXT
    if isinstance(v,Name): return env.get(v.value,UNKNOWN)
    if isinstance(v,Member): return UNKNOWN
    if isinstance(v,Unary): return YESNO if v.op=="!" else infer(v.value,env)
    if isinstance(v,Binary):
        if v.op in ("==","!=","<","<=",">",">="): return YESNO
        return NUMBER if infer(v.left,env) is NUMBER and infer(v.right,env) is NUMBER else UNKNOWN
    if isinstance(v,Call): return UNKNOWN
    return UNKNOWN
def check(program):
    env={}; errors=[]
    for n in program:
        if isinstance(n,EntityDecl): env[n.name]=ENTITY
        elif isinstance(n,Assign):
            if isinstance(n.target,Name):
                t=infer(n.value,env)
                if t is UNKNOWN and isinstance(n.value,Name): errors.append(f"Reference Error: unknown variable '{n.value.value}'")
                env[n.target.value]=t
            elif isinstance(n.target,Member) and infer(n.target.target,env) is UNKNOWN:
                errors.append("Reference Error: unknown entity in property assignment")
        elif isinstance(n,Print) and infer(n.value,env) is UNKNOWN and not isinstance(n.value,Member):
            errors.append("Type Error: cannot determine printable value")
    return env,errors
