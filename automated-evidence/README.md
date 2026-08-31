# Automated evidence archive

[简体中文](README.zh.md) | English

This directory archives reviewed, exact-revision machine evidence. It is intentionally separate from [`evidence/`](../evidence/README.md), which is reserved for consented, de-identified human records.

`core-browser/` contains `dsh-core-browser-non-at` records validated by [`CORE-BROWSER-EVIDENCE.schema.json`](../CORE-BROWSER-EVIDENCE.schema.json) and the repository test suite. A `pass` proves only the recorded headless browser checks on the exact DSH revision and environment. It is not assistive-technology, real zoom, Windows High Contrast, WCAG conformance, or disabled-user evidence.

Do not edit a generated record to make it pass. Regenerate it from a clean DSH commit, review its limitations, copy it byte-for-byte, and keep prior failures or partial records when they explain a barrier.
