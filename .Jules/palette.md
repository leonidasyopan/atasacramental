## 2026-10-12 - ARIA Labels on Composite Lookup Components

**Learning:** Composite UI inputs (like `HymnLookup`, which pairs a number input with a read-only title preview) are often missing accessible names for screen readers because placeholders or visually adjacent context aren't implicitly associated with `<input>` elements. Screen readers announce unlabelled inputs as generic text/number boxes without context.

**Action:** Always provide explicit default `aria-label` attributes for each input in composite components, and allow parent components to pass contextual label overrides (e.g., `ariaLabel="Hino de abertura"`) so screen reader users hear both the input purpose and the resulting lookup title.
