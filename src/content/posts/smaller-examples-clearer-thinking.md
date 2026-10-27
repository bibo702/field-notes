---
title: "Smaller examples, clearer thinking"
description: "Reduce the moving parts. A short, repeatable example makes a technical explanation easier to test and easier to trust."
date: 2026-01-12
tags: [learning, practice]
draft: false
starter: true
---

A reproducible example is a small experiment. It makes a claim visible and gives someone else a way to check it.

This starter note demonstrates a general technique. It does not describe a real incident or an employer’s systems.

## Name the behavior

Before writing code, state what the example should show. Use a sentence that has an observable outcome:

> Given a list with repeated values, return each distinct value once, preserving its first position.

That is more testable than “clean up the list.”

## Keep only the moving parts

Remove network access, accounts, databases, and unrelated application code. Use harmless demonstration values.

```typescript
function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

const input = ["oak", "elm", "oak", "ash"];
const expected = ["oak", "elm", "ash"];
const actual = unique(input);

console.assert(
  JSON.stringify(actual) === JSON.stringify(expected),
  "Distinct values should preserve their first position",
);
```

For this example, strings are enough. Object equality, normalization, and large inputs are separate questions. Say so rather than silently implying that the example solves them.

## Include the edges

A useful explanation also shows what happens with an empty list and a list that is already unique.

| Input | Expected output |
| --- | --- |
| `[]` | `[]` |
| `["oak"]` | `["oak"]` |
| `["oak", "oak"]` | `["oak"]` |

If an edge case changes the explanation, that is a reason to include it—not to hide it.

## Make it easy to repeat

State the language, any prerequisites, and the expected output. If a reader has to guess how to run an example, the explanation is not quite finished.

The goal is not the shortest possible code. It is the smallest example that preserves the behavior you want to understand.
