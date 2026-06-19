# 🚀 Open Prompt Library

![Prompts](https://img.shields.io/badge/prompts-2106-6366f1?style=flat-square)
![Categories](https://img.shields.io/badge/categories-19-22c55e?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-f59e0b?style=flat-square)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ec4899?style=flat-square)
![Built with Node](https://img.shields.io/badge/built%20with-Node.js-339933?style=flat-square&logo=node.js&logoColor=white)

> **2,106 battle-tested AI prompts** across 19 categories — ready to copy, fork, and extend.  
> Built for developers, writers, marketers, and anyone who uses LLMs daily.  
> All prompts are sourced from real community usage, deduplicated, and organized for instant browsing.

---

## 📋 Contents

[⚡ Quick Start](#-quick-start) · [⭐ Featured Prompts](#-featured-prompts) · [📚 Categories](#-categories) · [📦 Data Exports](#-data-exports) · [🛠️ Building Locally](#️-building-the-repo-locally) · [🤝 Contributing](#-contributing) · [📄 License](#-license)

---

## ⚡ Quick Start

No setup needed — this is a plain markdown library.

1. **Browse** a category in the table below, or press `Ctrl+F` / `Cmd+F` to search this page
2. **Open** any `.md` file — the prompt lives inside the blockquote
3. **Copy** it into ChatGPT, Claude, Gemini, Copilot, or any LLM
4. **Tweak** the prompt for your use case and go

> 💡 **Power user tip:** Clone the repo and use `grep -r "keyword" prompts/` to full-text search across all 2,106 prompts locally.

---

## ⭐ Featured Prompts

A hand-picked selection across categories to get you started:

| Prompt | Category | What it does |
|--------|----------|--------------|
| [Accessibility Expert](prompts/coding-development/accessibility-expert.md) | 💻 Coding | Reviews UI for WCAG compliance and suggests fixes |
| [Debugging Oncall Tickets](prompts/ai-automation/debugging-oncall-tickets.md) | 🤖 AI & Automation | Triages complex deployment incidents with a structured runbook |
| [Accountant](prompts/business-career/accountant.md) | 💼 Business | Acts as a financial expert for bookkeeping and tax questions |
| [AI Writing Tutor](prompts/education-learning/ai-writing-tutor.md) | 🎓 Education | Gives structured feedback on writing like a personal coach |
| [Analyze Security Scan Results](prompts/security/analyze-security-scan-results.md) | 🔒 Security | Interprets vulnerability scanner output into actionable steps |
| [Beginner's Guide to Building and Deploying LLMs](prompts/education-learning/beginner-s-guide-to-building-and-deploying-llms.md) | 🎓 Education | Step-by-step walkthrough for shipping your first LLM project |

---

## 📚 Categories

**Total prompts: 2106**

- 💻 [Coding & Development](prompts/coding-development/README.md) — 770 prompts
- 🎨 [Image & Design](prompts/image-design/README.md) — 390 prompts
- ✍️ [Writing & Content](prompts/writing-content/README.md) — 253 prompts
- 📊 [Data & Analytics](prompts/data-analytics/README.md) — 138 prompts
- 📣 [Marketing & Social](prompts/marketing-social/README.md) — 104 prompts
- 🧩 [General](prompts/general/README.md) — 71 prompts
- 🎓 [Education & Learning](prompts/education-learning/README.md) — 70 prompts
- 🤖 [AI & Automation](prompts/ai-automation/README.md) — 62 prompts
- 💼 [Business & Career](prompts/business-career/README.md) — 52 prompts
- 📄 [Documentation](prompts/documentation/README.md) — 52 prompts
- 🔒 [Security](prompts/security/README.md) — 41 prompts
- 🩺 [Health & Wellness](prompts/health-wellness/README.md) — 27 prompts
- 🔬 [Research & Analysis](prompts/research-analysis/README.md) — 23 prompts
- 💰 [Sales & Business](prompts/sales-business/README.md) — 19 prompts
- 🎮 [Games & Fun](prompts/games-fun/README.md) — 13 prompts
- 🧭 [Product & Strategy](prompts/product-strategy/README.md) — 11 prompts
- 🌍 [Travel & Places](prompts/travel-places/README.md) — 5 prompts
- 🍳 [Food & Recipes](prompts/food-recipes/README.md) — 3 prompts
- 📜 [Philosophy & Humanities](prompts/philosophy-humanities/README.md) — 2 prompts

## 🛠️ Building the repo locally

Clone the repo and regenerate the full `prompts/` tree with a single command — no dependencies required:

```bash
git clone https://github.com/your-org/prompts-repo.git
cd prompts-repo
node scripts/generate-tree.js
```

This deletes and fully recreates every `prompts/<category>/*.md` file and rebuilds all README indexes (root + per-category) from `data/prompts.json`. It's idempotent — safe to re-run anytime.

**How the automation pipeline works:**

```
prompts.xlsx  ──(one-time)──▶  data/prompts.json + data/prompts.csv
                                        │
                              push to main branch
                                        │
                              GitHub Action triggers
                                        │
                              node scripts/generate-tree.js
                                        │
                              prompts/ tree regenerated & committed
```

The n8n workflow appends new entries directly to `data/prompts.json` and `data/prompts.csv`. The GitHub Action (see [`.github/workflows/rebuild-index.yml`](.github/workflows/rebuild-index.yml)) then runs the same script automatically to keep the markdown files in sync.

---

## 📦 Data Exports

The full dataset is available in machine-readable formats for programmatic use:

| File | Format | Records | Use case |
|------|--------|---------|----------|
| [`data/prompts.json`](data/prompts.json) | JSON array | 2,106 | Build apps, query with `jq`, feed into vector DBs |
| [`data/prompts.csv`](data/prompts.csv) | CSV (UTF-8, RFC 4180) | 2,106 | Excel, pandas, Sheets, SQL imports |

**JSON schema per record:**
```json
{
  "act": "Prompt title",
  "category": "Category name",
  "prompt": "Full prompt text",
  "source": "Original source",
  "type": "TEXT",
  "slug": "url-friendly-slug",
  "folder": "category-folder-name",
  "path": "prompts/folder/slug.md"
}
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to add or improve a prompt.

Want to add a batch of prompts? Open an issue first so we can coordinate to avoid duplicates.

---

## 📄 License

MIT — see [LICENSE](LICENSE). Individual prompt sources are credited inline in each file.
