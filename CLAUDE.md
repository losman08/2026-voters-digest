# Voter's Digest — build guide for Claude Code

This file loads automatically at the start of every Claude Code session. It
carries the standard this project is built to. Follow it.

## What this is
A **non-partisan, plain-language voter guide** for family & friends. Each
ballot measure and candidate is explained clearly so people can vote
informed. Multi-state; California, Nevada, Oklahoma, Colorado, Virginia,
Arizona, Oregon, and Texas are live (all measures and statewide races
complete; Texas's seven statewide court races are linked, not profiled).
Washington was dropped from the queue by the maintainer. **It never tells
anyone how to vote — educational and informational only.** Strictly
non-partisan throughout.

## The app
- A single self-contained **`index.html`** (static site). **All content lives
  in JS arrays/objects near the bottom of the file.** Suffrage violet + gold
  theme, light/dark.
- **Deploy:** push to `main` → Vercel auto-redeploys (no-cache headers, so
  visitors always get the latest). In a cloud session, work on a branch and
  open a PR for the maintainer to review and merge.
- There is a serverless request form under `/api/` plus a request pipeline.
  **Do not modify `/api/*`, `vercel.json`, or `package.json` unless
  explicitly asked** — content work only touches `index.html`.
- **`/api/ask.js`** powers each measure card's "Ask how this affects your
  situation" box. It calls the Claude API with plain `fetch` (no npm
  dependency) and needs the `ANTHROPIC_API_KEY` environment variable in
  Vercel; without it the box shows "not switched on yet." The system prompt
  grounds answers only in the card text the page sends and forbids vote
  recommendations; it has a best-effort per-IP rate limit. Keep those
  guardrails if you edit it.
- Keep the UI tight: the masthead + tabs are the only sticky elements; no
  horizontal scroll at phone width. The `<meta name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover">` and
  `<meta charset="utf-8">` at the top of `<head>` are **required** (mobile
  depends on them; the CSS uses `env(safe-area-inset-*)`) — never remove them.

## Languages (Spanish / Portuguese)
- `LANG_BY_STATE` in index.html lists which states offer which languages
  (currently `OK: es + pt`; CA, TX, AZ, NV get Spanish as each is finished).
  The EN/ES/PT picker appears only on those states; elsewhere the page is
  English.
- Translations live in `i18n/es.js` and `i18n/pt.js` (loaded only when a
  visitor picks that language). Each is a map from the **exact English text**
  to its translation, looked up through `T()`. If you edit English text in
  a translated state, update the matching entry — otherwise that spot quietly
  shows English (never a stale translation).
- Portuguese is **European Portuguese (Portugal, pt-PT)**: e.g. *sondagem,
  boletim de voto, contacto, registo*, 24-hour times. Spanish uses formal
  *usted*. Names of people, organizations and official titles stay in English.
- The AI "Ask" box answers in the visitor's language (`lang` sent to
  `/api/ask`).

## Data model (in index.html)
- `PROPS` — full measure cards · `PENDING` — stub measures (title + link
  only) · `RACES` — candidate races · `STATES` — per-state `{name, abbr,
  available, status, flag SVG, symbol}` · `VOTE_LINKS` — official voter
  tools · `SITUATIONS` — the impact-lens keys · `ISSUES` — the 7 default
  "Where they stand" topics (Governor). · `POLLS` — independent polls keyed
  `'ST|num'` (measures) or `'ST|office'` (races); every card's header shows a
  "Latest poll" badge from the first item, or "No public poll yet" when there
  is none. Independent polls only (no campaign/party sponsors), 300+
  respondents. If a release gives only a margin, use `res:[]` plus a
  `summary`/`note` quoting it — never invent shares.

### Measure card schema (`PROPS`)
`{num, cat, title, placed, summary, pass, fail, fiscal, support:[],
supportMedia:[], oppose:[], opposeMedia:[], impacts:{most, renter,
homeowner, parent, senior, business, wealthy}, links:[{label, url}]}`
- `summary` = plain-English what it does · `pass`/`fail` = what a Yes/No
  actually does · `fiscal` = the cost · `impacts` = how it affects each
  situation · `support`/`oppose` = **named** backers/opponents ·
  `supportMedia`/`opposeMedia` = editorial endorsements (leave `[]` when none
  — the card hides that line automatically).
- Keep `PROPS` in **numeric order**. For CA, each card auto-builds its
  official-guide + full-text-PDF links from `num`.

### Candidate race schema (`RACES`)
`{office, meta, issues?, candidates:[{name, party, pcls, bio,
stand:{<topic>:text}, endorse, clean, record:[{tag, t}], noScandal,
links:[]}]}`
- `pcls` = `'dem'` | `'rep'` | `''` (empty = neutral/uncolored dot, for a
  nonpartisan office).
- **`issues` is optional per race.** If present, the card shows those topics
  (down-ballot offices use job-relevant ones — e.g. Insurance Commissioner →
  home/wildfire insurance); if absent it falls back to the 7 global `ISSUES`
  (Governor only). `stand` is keyed to whichever topics apply.
- `record[].tag` = `'doc'` (Documented: an official finding, ruling, fine,
  lawsuit or fact-check) | `'rep2'` (Reported: credible reporting, not
  adjudicated) | `'rec'` (Record: neutral fact about the candidate's public
  record, e.g. "Public legislative record since 2019") | `'note'` (Note: e.g.
  "Independent coverage of this candidate is limited") | anything else
  (Unsubstantiated). Never use `'doc'` for a neutral note. `clean:true` + `noScandal` shows the "no scandal
  documented" checkmark.

## Sourcing & non-partisan standard (non-negotiable)
- **Sources, in order:** the state's **official Secretary of State voter
  guide** + the non-partisan **CalMatters** per-measure / per-office pages
  (where they exist) + **Ballotpedia**. Verify final candidate matchups
  against the SoS **certified candidate list**. (Colorado has an official
  non-partisan **Blue Book** bundling analysis + fiscal + pro/con.)
- **Only verifiable, publicly-available facts.** Never invent a position.
  Where a source is thin, say so ("CalMatters does not detail…") rather than
  filling the gap.
- **Evenhandedness:** hold every candidate and party to the same bar. Label
  every controversy **Documented / Reported / Unsubstantiated**; say plainly
  when nothing is verified. Give each side's strongest argument; don't let one
  side get more or better airtime than the other.
- **Neutral titles:** if an official ballot title is slanted, use a plain,
  neutral title and optionally note the official one — never adopt the slant.
- Keep the educational-and-informational-only disclaimer intact (foreword +
  footer).

## District races (U.S. House, legislature, local)
**Do not** list these in-app — they are by-address, do not map to counties,
and number in the hundreds. Link the state's **non-partisan by-address ballot
tool** instead (California uses **Vote411**, `https://www.vote411.org/lwvc`).

## Adding a new state
1. Write statewide **measures** → `PROPS` (same card schema).
2. Write marquee + statewide **races** (Governor, U.S. Senate if applicable,
   and down-ballot statewide offices) → `RACES`.
3. Add the state's **official voter-tool links** and a by-address tool link.
4. Add the state's **flag SVG** and flip its `status` to live in `STATES`.

## Quality gate — run EVERY time before pushing
1. **Syntax-check the JS.** Extract the `<script>` block and run it through
   `new Function(code)` in Node — catches quote/comma breakage.
2. **Render-test in headless Chromium** (Playwright): load `index.html`,
   confirm the new cards actually appear **and** that unrelated arrays (e.g.
   the `#voteGrid .vcard` count) are unaffected. **A syntax check alone is not
   enough** — a prior scripted insert into `RACES` parsed fine but silently
   landed in the `VOTE_LINKS` array, so only the first card rendered. Only a
   render test caught it.
3. **Insertion-anchor gotcha:** the `RACES` array closes with `  ]\n}];` (or
   `  ]\n}\n];` after earlier inserts) — the leading `  ]` is the
   candidates-array close and is what makes the anchor unique to `RACES`. A
   bare `\n];` first matches **`VOTE_LINKS`**, not `RACES`. Anchor on the
   `  ]`-prefixed close and assert exactly one match.
4. **Commit and push incrementally** — per state, or per office/measure — so
   finished work is safe even if the session ends.

## Scope guardrail
Content lives in `index.html` only. Don't touch the backend, build config, or
deploy settings unless the task explicitly asks. When in doubt about a fact,
leave it out and note the gap rather than guessing.
