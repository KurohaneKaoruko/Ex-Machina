# Gemini Tool Mapping

- Default to Chinese when the user writes in Chinese; otherwise use English.
- The ExMachina bootstrap is already loaded through `GEMINI.md`; do not reload it redundantly.
- When a referenced tool name differs, use Gemini CLI's native equivalents for shell, file, search, and edit actions.
- Preserve ExMachina's evidence discipline: keep unknowns explicit and close the verification loop before declaring completion.