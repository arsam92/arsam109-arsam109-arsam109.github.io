# ARlun Architecture

## Compiler pipeline
1. Lexer -> tokens
2. Parser -> AST
3. Semantic checker -> validation
4. IR -> execution representation
5. Runtime -> language execution
6. Game Engine -> rendering, physics, audio, scenes, input, assets, networking

## AI pipeline
Perception -> Memory -> Think -> Goal -> Plan -> Vote/Team -> Execute -> Check -> Learn -> Rethink

AI agents only use information available through their perception and received communication. Hidden game state must not be silently injected into reasoning.

## Layout
- language/ compiler and language core
- runtime/ language runtime
- engine/ game systems
- ai/ agent architecture
- editor/ development tools
- examples/ sample programs
