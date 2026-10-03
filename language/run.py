from .parser import Parser,Literal,Name,Member,Assign,Print,EntityDecl,Binary,Unary,Function,Return,Call
class ARlunEntity:
    def __init__(self,name): self.name=name; self.properties={}
    def __repr__(self): return f"<entity {self.name}>"
class ReturnSignal(Exception):
    def __init__(self,value): self.value=value
def eval_expr(n,env,functions):
    if isinstance(n,Literal): return n.value
    if isinstance(n,Name):
        if n.value not in env: raise NameError(f"Reference Error: unknown variable '{n.value}'")
        return env[n.value]
    if isinstance(n,Member):
        obj=eval_expr(n.target,env,functions)
        return obj.properties.get(n.name) if isinstance(obj,ARlunEntity) else getattr(obj,n.name)
    if isinstance(n,Unary):
        v=eval_expr(n.value,env,functions); return -v if n.op=="-" else not v
    if isinstance(n,Binary):
        a=eval_expr(n.left,env,functions); b=eval_expr(n.right,env,functions)
        return {"+":lambda:a+b,"-":lambda:a-b,"*":lambda:a*b,"/":lambda:a/b,"%":lambda:a%b,"==":lambda:a==b,"!=":lambda:a!=b,"<":lambda:a<b,"<=":lambda:a<=b,">":lambda:a>b,">=":lambda:a>=b}[n.op]()
    if isinstance(n,Call):
        fn=functions[n.name]; local=dict(env); local.update(zip(fn.params,[eval_expr(a,env,functions) for a in n.args]))
        try: execute(fn.body,local,functions)
        except ReturnSignal as r: return r.value
        return None
def assign(t,v,env):
    if isinstance(t,Name): env[t.value]=v
    else:
        obj=eval_expr(t.target,env,{})
        if not isinstance(obj,ARlunEntity): raise TypeError("Runtime Error: property target is not an entity")
        obj.properties[t.name]=v
def execute(program,env,functions):
    for n in program:
        if isinstance(n,EntityDecl): env[n.name]=ARlunEntity(n.name)
        elif isinstance(n,Function): functions[n.name]=n
        elif isinstance(n,Assign): assign(n.target,eval_expr(n.value,env,functions),env)
        elif isinstance(n,Print): print(eval_expr(n.value,env,functions))
        elif isinstance(n,Return): raise ReturnSignal(eval_expr(n.value,env,functions))
        elif hasattr(n,"body"): execute(n.body,env,functions)
def run(source):
    env={}; functions={}; execute(Parser(source).parse(),env,functions); return env
if __name__=="__main__":
    import sys; run(open(sys.argv[1],encoding="utf-8").read())
