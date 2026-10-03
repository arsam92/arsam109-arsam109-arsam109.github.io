# ARlun AI

ARlun AI is designed around incomplete information and decision making rather than omniscient scripts.

## Goals
The goal primitive is `gvola`.

Example:
`gvola survive`
`.prio 0.8`

Goal concepts include survive, attack, protect, escape, search, patrol, help, and capture.

## Planning
Plans can contain roles and can be reconsidered when conditions change.

`plan flank_left`
`enemy1 -> distract`
`enemy2 -> flank`
`enemy3 -> cover`

## Communication
Message types include say, warn, report, ask, answer, vote, agree, and reject.

## Learning
Learning can use experience, patterns, strategies, and memory. Developers control learning rate and persistence.

## Team brain
An external language model can optionally act as a high-level tactical tie-breaker or planner. It receives only observations and messages available to the team and is not called every frame.
