# AGENTS.md — Build Instructions for Open Prompt Library

You are building/maintaining this repository. Read this entire file before doing anything. Do not ask the user clarifying questions unless something below is genuinely ambiguous — execute the task list directly.

## 1. Project goal

This is an open-source, browsable library of AI prompts. The source data already exists at the repo root: **`prompts.xlsx`** (columns: `Act`, `Category`, `Prompt`, `Source` — 1,328 rows, already cleaned and deduplicated). Your job is to turn that spreadsheet into a well-organized markdown repo, plus machine-readable exports, plus the tooling to keep it in sync going forward.

## 2. Folder structure to create

```
prompts-repo/
├── README.md                  (already exists — you will REGENERATE the category list + totals section in place, keep everything else)
├── LICENSE                    (already exists — do not touch)
├── CONTRIBUTING.md            (create — see template below)
├── .gitignore                 (create — see template below)
├── prompts.xlsx                (already exists — source of truth, read-only, do not modify or delete)
├── data/
│   ├── prompts.json            (generate — full dataset as JSON array, schema below)
│   └── prompts.csv             (generate — same data as CSV, UTF-8, header row)
├── scripts/
│   └── generate-tree.js        (create — Node.js script, see spec below; this is what regenerates prompts/ from prompts.xlsx or data/prompts.json)
├── .github/
│   └── workflows/
│       └── rebuild-index.yml   (create — GitHub Action, see template below)
└── prompts/
    └── <category-folder>/
        ├── README.md            (one per category — index/TOC of that category's prompts)
        └── <slug>.md            (one file per prompt)
```

## 3. Category → folder/emoji mapping

Use this exact mapping. Do not invent new folder names or slugify the category string yourself — use this table verbatim:

| Category (from xlsx)        | Folder                  | Emoji |
|------------------------------|--------------------------|-------|
| Coding & Development          | coding-development        | 💻 |
| Writing & Content              | writing-content            | ✍️ |
| Image & Design                 | image-design               | 🎨 |
| Data & Analytics               | data-analytics             | 📊 |
| Marketing & Social              | marketing-social           | 📣 |
| Education & Learning            | education-learning         | 🎓 |
| AI & Automation                 | ai-automation              | 🤖 |
| General                         | general                    | 🧩 |
| Business & Career               | business-career            | 💼 |
| Health & Wellness               | health-wellness            | 🩺 |
| Documentation                    | documentation              | 📄 |
| Research & Analysis              | research-analysis          | 🔬 |
| Security                         | security                   | 🔒 |
| Sales & Business                 | sales-business             | 💰 |
| Product & Strategy               | product-strategy           | 🧭 |
| Games & Fun                      | games-fun                  | 🎮 |
| Philosophy & Humanities          | philosophy-humanities      | 📜 |
| Travel & Places                  | travel-places              | 🌍 |
| Food & Recipes                   | food-recipes               | 🍳 |

If a row's `Category` value doesn't match this table exactly (typo, casing, etc.), fall back to `General` / `general` / 🧩 — do not crash, do not invent a new folder.

## 4. Slug generation rule

For each prompt's `Act` field, generate a slug:
1. Lowercase
2. Replace any run of non-alphanumeric characters with a single `-`
3. Trim leading/trailing `-`
4. Truncate to 60 characters
5. If empty after the above, use `untitled`
6. If the resulting slug already exists within that category folder, append `-2`, `-3`, etc. until unique

## 5. Individual prompt file template (`prompts/<folder>/<slug>.md`)

```markdown
# {Act}

**Category:** {Category}  
**Source:** {Source}

## Prompt

> {Prompt text, with every newline inside the prompt prefixed by "> " so it renders as a blockquote}

---
[← Back to {Category}](README.md) · [Main index](../../README.md)
```

## 6. Category README template (`prompts/<folder>/README.md`)

```markdown
# {emoji} {Category}

[← Back to main index](../../README.md)

**{count} prompts in this category**

## Table of Contents

- [{Act 1}]({slug-1}.md)
- [{Act 2}]({slug-2}.md)
... (one line per prompt, alphabetical by Act)
```

## 7. Root README.md — section to regenerate

In the existing `README.md`, find the section between `## 📚 Categories` and `## 🛠️ Building the repo locally`. Replace only that section's content with an up-to-date list using this format, sorted descending by prompt count:

```markdown
## 📚 Categories

**Total prompts: {total}**

- {emoji} [{Category}](prompts/{folder}/README.md) — {count} prompts
... (one line per category that has at least 1 prompt)
```

Leave every other part of `README.md` untouched.

## 8. `data/prompts.json` schema

```json
[
  {
    "act": "string",
    "category": "string",
    "prompt": "string",
    "source": "string",
    "type": "TEXT",
    "slug": "string",
    "folder": "string",
    "path": "prompts/{folder}/{slug}.md"
  }
]
```
Generate one object per row in `prompts.xlsx`, in the same order the slugs were assigned (so de-duplicated slugs match what's on disk).

## 9. `data/prompts.csv`

Same fields as above, comma-separated, UTF-8, header row: `act,category,prompt,source,type,slug,folder,path`. Quote-escape any field containing a comma, quote, or newline (standard RFC 4180 CSV escaping).

## 10. `CONTRIBUTING.md` template

```markdown
# Contributing

Thanks for wanting to add a prompt!

## Adding a new prompt

1. Fork this repo.
2. Pick (or create) the right category folder under `prompts/`.
3. Add a new file `prompts/<category>/<your-slug>.md` following the format of any existing file in that folder.
4. Add a line for it in that category's `README.md` table of contents.
5. Add a row to `data/prompts.json` and `data/prompts.csv` with the same info.
6. Open a pull request. Please keep one prompt per PR when possible.

## Guidelines

- No prompts that facilitate illegal activity, hate speech, or harm to others.
- Prefer prompts that are genuinely useful and tested, not joke/meme prompts.
- Always credit the original source if the prompt isn't your own creation.
- Keep titles short and descriptive (under ~60 characters).

## Reporting issues

Open a GitHub issue if you spot a broken link, duplicate, or miscategorized prompt.
```

## 11. `.gitignore` template

```
node_modules/
.DS_Store
*.log
.env
```

## 12. `scripts/generate-tree.js` — behavior spec

A Node.js script (no external dependencies — use only Node built-ins: `fs`, `path`) that:
1. Reads `data/prompts.json` (this is the canonical source once it exists; the script does NOT re-read the xlsx — that's a one-time import done by you, the agent, during initial setup).
2. Deletes and recreates the entire `prompts/` directory tree (full regeneration, idempotent).
3. For each entry, writes the individual prompt file (template in section 5).
4. Writes each category's `README.md` (template in section 6), sorted alphabetically by `act`.
5. Updates the root `README.md`'s category section (template in section 7) by reading the existing file, replacing only the marked section, and writing it back.
6. Logs a summary to stdout: total files written, total categories, any slug collisions resolved.

This script is what both local devs and the GitHub Action run to keep the markdown tree in sync with `data/prompts.json` whenever that file changes (e.g. when the n8n automation appends a new entry to it).

## 13. `.github/workflows/rebuild-index.yml` — behavior spec

A GitHub Action that:
- Triggers on: `push` to `main` when `data/prompts.json` changes
- Runs `node scripts/generate-tree.js`
- Commits and pushes the regenerated `prompts/` tree and root `README.md` back to `main` if anything changed (use a bot commit, e.g. `github-actions[bot]`)

## 14. Execution order (do this now, in this order)

1. Read `prompts.xlsx` from the repo root (columns: Act, Category, Prompt, Source).
2. Generate `data/prompts.json` and `data/prompts.csv` per sections 8–9 (this is the one-time conversion from xlsx → JSON; assign slugs now, per section 4).
3. Write `scripts/generate-tree.js` per section 12.
4. Run `node scripts/generate-tree.js` to materialize the full `prompts/` tree and update the root README.
5. Write `CONTRIBUTING.md`, `.gitignore`, `.github/workflows/rebuild-index.yml` per sections 10, 11, 13.
6. Report back: total prompt files created, total categories, and confirm `README.md`'s category section now shows correct counts.

## 15. Constraints

- Do not modify `prompts.xlsx` or `LICENSE`.
- Do not invent prompts — every file must trace back to a row in `prompts.xlsx`.
- Do not collapse or merge categories beyond the mapping table in section 3.
- Keep the script dependency-free (no npm install required) so the GitHub Action runs without a build step.
