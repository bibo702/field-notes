---
title: "Before a note goes public"
description: "A short editorial checklist for sharing a useful lesson without sharing what should stay private."
date: 2026-01-08
tags: [writing, practice]
draft: false
starter: true
---

Publishing a learning note is not the same as exporting a work notebook. A public explanation should stand on its own, without exposing the context that made it possible.

This is an instructional checklist, not legal advice or a substitute for an organization’s policies.

## Separate the idea from its source

Ask what the reader actually needs. Usually the useful part is a pattern or a question—not the real customer name, internal URL, or original dataset.

Build a new demonstration with synthetic values. Removing a name from a screenshot is not enough if the surrounding information is still sensitive.

## Check the details

Before marking a post as published:

- Remove credentials, tokens, private links, and identifying records.
- Confirm you have permission to share any code, image, or quotation.
- Replace operational details with a fresh, permission-safe example.
- Attribute sources and link to public documentation.
- Distinguish observed facts from assumptions and open questions.
- Check whether an employer or client requires review.

If permission is uncertain, leave the note as a draft.

## Read it as a newcomer

Explain abbreviations on first use. Check that the title matches the promise of the note. Run any code that readers are expected to run.

A final pass should answer three questions:

1. Is this clear?
2. Is this accurate within its stated limits?
3. Is this mine to share?

## Publish deliberately

In this site, a Markdown post with `draft: true` is left out of public pages and the RSS feed. Change it to `false` only after review.

**Draft filtering does not make repository files private.** Anyone with repository access can read the source, and a public repository exposes drafts too. Never put confidential material or secrets in a draft.
