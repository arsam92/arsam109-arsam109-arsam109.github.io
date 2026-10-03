# Language Core

Implemented:
- Lexer/tokenizer
- Minimal parser and AST nodes
- Initial type inference/checking
- Minimal interpreter
- Unit tests

Example:

    text greeting =>> "Hello from ARlun"
    number speed =>> 10
    print greeting
    print speed

Run:

    python -m language.run examples/hello.arlun

Next: expressions/operators, functions, events, modules, and a real IR.
