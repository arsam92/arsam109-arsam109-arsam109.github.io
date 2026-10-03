# ARlun IR

ARlun now has an intermediate representation layer.

The pipeline is:

ARlun source -> Lexer -> Parser -> AST -> Type Checker -> IR -> Runtime

IR instructions are deliberately small and engine-independent. Examples include:

- const
- load
- store
- unary
- binary
- call
- print
- return
- function
- event

This makes it possible to add an optimized runtime or native compiler later without changing the language syntax.
