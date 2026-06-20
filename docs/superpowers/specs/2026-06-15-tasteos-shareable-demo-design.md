# TasteOS Shareable Demo Design

## Goal

Make TasteOS reliable enough to send to another person as a local demo: the app should show readable Chinese text, explain how to run it, distinguish demo analysis from real API analysis, and degrade clearly when API configuration is missing or fails.

## Scope

This version keeps the current zero-dependency static app architecture. It does not migrate to React, add accounts, add cloud storage, or deploy a hosted backend. The work is limited to documentation, UI copy, startup guidance, API diagnostics, and regression tests.

## User Experience

The first screen remains the reference-image library and upload workbench. All visible Chinese copy should be valid UTF-8 Chinese. The upload form should make the two analysis modes explicit:

- Offline demo analysis: works immediately and uses deterministic local rules.
- Real model analysis: calls `/api/analyze-reference`, then falls back to offline demo analysis with a clear notice if configuration or the remote call fails.

Empty states should tell the user what to do next. Copy and export actions should provide visible success feedback. API errors should be understandable to a non-engineer, while still containing enough detail for setup troubleshooting.

## Architecture

Keep `index.html` as the shell and `src/app.js` as the UI composition layer. Keep deterministic local analysis in `src/tasteEngine.js`. Add a small client-side diagnostics boundary in `src/apiClient.js` if needed, and improve `scripts/static-server.js` responses for missing provider, API key, model, and malformed API results.

## Files

- `README.md`: rewrite as readable Chinese setup and sharing documentation.
- `index.html`: fix title and metadata encoding.
- `src/app.js`: replace mojibake UI strings with Chinese, improve mode notices, empty states, and copy feedback.
- `src/tasteEngine.js`: replace mojibake analysis output with readable Chinese while preserving current deterministic behavior.
- `src/apiClient.js`: normalize failed API response messages for the UI.
- `scripts/openai-analysis.mjs`: verify provider configuration and return actionable errors.
- `scripts/*.test.mjs`: add focused tests for payload generation, fallback diagnostics, and deterministic analysis text.

## Validation

Run syntax checks and the existing Node test scripts with the bundled Node executable. Start `scripts/static-server.js` and open `http://127.0.0.1:4173/` to verify the page renders with readable Chinese and the demo mode still works.

## Constraints

No external package installation is required. Secrets must stay in `.env.local` and must not be committed into front-end code or documentation examples except as placeholders.
