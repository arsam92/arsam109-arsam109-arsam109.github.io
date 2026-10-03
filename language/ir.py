from dataclasses import dataclass
from .parser import Parser,Assign,Print,Literal,Name,Member,Binary,Unary,Call,Function,Event,EntityDecl,Return
@dataclass
class IRInstruction:
    op:str; args:tuple
class IRBuilder:
    def __init__(self): self.instructions=[]
    def emit(self,op,*args): self.instructions.append(IRInstruction(op,args))
    def expr(self,n):
        if isinstance(n,Literal): self.emit("const",n.value)
        elif isinstance(n,Name): self.emit("load",n.value)
        elif isinstance(n,Member): self.expr(n.target); self.emit("get_member",n.name)
        elif isinstance(n,Unary): self.expr(n.value); self.emit("unary",n.op)
        elif isinstance(n,Binary): self.expr(n.left); self.expr(n.right); self.emit("binary",n.op)
        elif isinstance(n,Call):
            for a in n.args: self.expr(a)
            self.emit("call",n.name,len(n.args))
    def build(self,p):
        for n in p:
            if isinstance(n,EntityDecl): self.emit("entity",n.name)
            elif isinstance(n,Assign): self.expr(n.value); self.emit("store",n.target.value) if isinstance(n.target,Name) else self.emit("set_member",n.target.name)
            elif isinstance(n,Print): self.expr(n.value); self.emit("print")
            elif isinstance(n,Return): self.expr(n.value); self.emit("return")
            elif isinstance(n,Function): self.emit("function",n.name,tuple(n.params)); self.build(n.body); self.emit("end_function")
            elif isinstance(n,Event): self.emit("event",n.name); self.build(n.body); self.emit("end_event")
        return self.instructions
def compile_to_ir(source): return IRBuilder().build(Parser(source).parse())
