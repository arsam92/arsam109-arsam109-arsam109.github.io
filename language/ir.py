from dataclasses import dataclass
from .parser import Assign, Print, Literal, Name, Binary, Unary, Call, Function, Event, Return

@dataclass(frozen=True)
class IRInstruction:
    op: str
    args: tuple

class IRBuilder:
    def __init__(self):
        self.code=[]
        self.temp=0

    def new_temp(self):
        name=f"%{self.temp}"
        self.temp+=1
        return name

    def emit(self,op,*args):
        self.code.append(IRInstruction(op,args))

    def expr(self,node):
        if isinstance(node,Literal):
            t=self.new_temp(); self.emit("const",t,node.value); return t
        if isinstance(node,Name):
            t=self.new_temp(); self.emit("load",t,node.value); return t
        if isinstance(node,Unary):
            x=self.expr(node.value); t=self.new_temp(); self.emit("unary",t,node.op,x); return t
        if isinstance(node,Binary):
            a=self.expr(node.left); b=self.expr(node.right); t=self.new_temp(); self.emit("binary",t,node.op,a,b); return t
        if isinstance(node,Call):
            args=tuple(self.expr(x) for x in node.args); t=self.new_temp(); self.emit("call",t,node.name,args); return t
        raise TypeError(f"Unsupported AST expression: {type(node).__name__}")

    def build(self,program):
        for node in program:
            if isinstance(node,Assign):
                x=self.expr(node.value); self.emit("store",node.name,x)
            elif isinstance(node,Print):
                x=self.expr(node.value); self.emit("print",x)
            elif isinstance(node,Return):
                x=self.expr(node.value); self.emit("return",x)
            elif isinstance(node,Function):
                self.emit("function",node.name,tuple(node.params))
                for child in node.body:
                    if isinstance(child,Return):
                        x=self.expr(child.value); self.emit("return",x)
                self.emit("end_function",node.name)
            elif isinstance(node,Event):
                self.emit("event",node.name)
                for child in node.body:
                    if isinstance(child,Print):
                        x=self.expr(child.value); self.emit("print",x)
                self.emit("end_event",node.name)
        return self.code

def compile_to_ir(source):
    from .parser import Parser
    return IRBuilder().build(Parser(source).parse())
