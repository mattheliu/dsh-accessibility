# Accessible authoring example

This synthetic example demonstrates the evidence boundary; it is not a claim about a production page.

1. Enable `a11y_check` with this directory in `authoring.allowedRoots` and keep the default `approval` access mode.
2. Check `before.html`. The deterministic report identifies defects, exact engine/config versions, standards references, and checks that still require people.
3. Ask DSH to explain each result and propose a repair. Explanation and remediation are model output, separate from deterministic detection.
4. Review the proposal. Use DSH's normal edit/write tool and its approval policy only if you choose to change the file; `a11y_check` cannot write.
5. Check `after.html`. A static pass means only that this pinned automated ruleset found no issue in the source supplied to it.
6. Render the real page and run the versioned keyboard, browser/assistive-technology, and disabled-user task protocols before making broader support claims.

Never upload private source as “evidence.” Record a redacted or synthetic fixture, engine identity, configuration version, command/tool input, outcome, and the evidence class that was actually run.
