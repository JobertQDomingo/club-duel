# Playbook — one task per session

Run `/next` in a fresh context window (or `/next T07` to pick a task). Do **one task**, then stop.

## 1. Orient (keep context small)
1. Open `docs/tasks.md`. Pick the requested task, or the first `[ ]` task whose dependencies are all `[x]`.
2. Read the **Notes** section at the bottom of `docs/tasks.md` (decisions from earlier sessions).
3. Read **only** the doc sections the task lists under *Read*. Do not read whole docs, and do not explore the codebase broadly. Open the files you will touch and their direct imports.
4. If the task is tagged **[USER]**, give the user the exact steps, wait until they confirm, verify what you can, then continue at step 4 below.

## 2. Plan
- State in 3–6 bullets what you will change (files, functions). No separate plan file.
- If something in the task conflicts with the docs, or with code from earlier tasks, ask the user once (AskUserQuestion). Don't guess.

## 3. Build
- Ponytail rules: smallest complete change, no speculative code.
- Logic tasks (domain functions, server actions, SQL functions): write the test first (superpowers TDD), then the code.
- UI tasks: follow `DESIGN.md` once it exists (created in T08). Use Impeccable for UI work.
- Every mutation: check the caller (admin session or captain token) on the server, validate the input, then end with `changed(tournamentId)` from `@/lib/realtime` after a successful write (it broadcasts and refreshes; resolves to undefined = no error).
- Never send hidden pair names to audience or opponent views. Always go through `viewFor()`.

## 4. Verify
- `npm run lint`, `npm test`, `npm run build` must pass. Paste the failing output if any fails, and fix it before moving on.
- For tasks marked **(browser)**: run `npm run dev` in the background and check the page with Playwright MCP (navigate, snapshot, click the flow in the task's *Done when*).
- Check every *Done when* bullet. If one cannot be met, say so and leave the task unchecked.

## 5. Record and commit
1. In `docs/tasks.md`, tick the task `[x]`. Add at most 3 lines under **Notes** only if a later task needs to know something (a decision, a gotcha, a file to reuse).
2. If you changed a spec decision, update the relevant doc line too.
3. Commit on `main`: `git add -A && git commit -m "T07: <short summary>"`, then `git push`. Never commit `.env*` files.

## 6. Hand off
End the session with exactly:
```
Done: T07 <title>
Next: T08 <title>   (run /clear then /next)
Needs you: <manual step or "nothing">
```
