# Release Notes — docgen-template
**Last Updated:** 2026-03-09

## [2026-03-09] — fix: disable thinking mode, increase num_predict to 8192
**Author:** Kaycha DocGen Bot
**Branch:** main

### Changes
- Disabled thinking mode in `docgen/index.ts` to optimize generation latency.
- Increased `num_predict` parameter in `docgen/ollama-client.ts` to 8192 tokens for improved context handling.
- Removed legacy configuration from `docgen/.run-log.jsonl`.

### Files Changed
- `docgen/.run-log.jsonl`
- `docgen/index.ts`
- `docgen/ollama-client.ts`
- `docs/docgen-template__ARCHITECTURE.md`
- `docs/docgen-template__ENGINEERING.md`
- `docs/docgen-template__OPERATIONS.md`
- `docs/docgen-template__PRODUCT.md`
- `docs/docgen-template__README.md`
- `docs/docgen-template__SECURITY.md`

---