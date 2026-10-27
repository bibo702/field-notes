---
title: "A useful note starts with one good question"
description: "A simple structure for turning a half-formed idea into something clear, concrete, and worth returning to."
date: 2026-01-15
tags: [writing, learning]
draft: false
starter: true
---

A learning note does not need to be a complete guide. It needs to give one idea enough shape that a reader—including your future self—can use it.

This is an instructional example. The outline below is a writing technique, not a report of personal work.

## Start with the question

Choose a question small enough to answer in a few paragraphs. “How does caching work?” is probably too broad. “When should a cached value expire?” gives the note a useful boundary.

Write the question at the top of a draft, then try answering it without introducing a second topic.

> A good constraint: one question, one concrete example, one thing to try next.

## Make the idea concrete

An example gives an abstract explanation something to stand on. Prefer a tiny, invented demonstration over a copied work artifact.

For instance, this function illustrates how an expiration check might work:

```typescript
type Entry<T> = {
  value: T;
  expiresAt: number;
};

function isFresh<T>(entry: Entry<T>, now: number): boolean {
  return now < entry.expiresAt;
}

const example = { value: "demo", expiresAt: 2_000 };
console.log(isFresh(example, 1_000)); // true
console.log(isFresh(example, 2_000)); // false
```

The explicit `now` parameter makes the boundary easy to test. This is a demonstration of one check, not a production caching system.

## Leave a useful ending

Close with the limit of your explanation or a next step:

- What does this example leave out?
- What should a reader check before applying it?
- Which question would make a useful follow-up?

A note becomes more trustworthy when it says where its certainty ends.

## Try the structure

Open a new Markdown file and write four headings: **Question**, **Explanation**, **Example**, and **Next step**. Add one or two sentences under each.

If the idea still feels too large, narrow the question. You can always write another note.
