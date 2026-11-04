linkedin profile: https://www.linkedin.com/in/manuel-g-118a947a/
github link: https://github.com/manu-gt-hub
malt profile: https://www.malt.com/es-es/profile/manuelgutierreztorrero

1. Portfolio público
experiencia
hitos conseguidos
cifras de volumen se datos, KPIs
Diagrama de arquitectura y tecnologías.
Descripción de los proyectos y decisiones técnicas.
Capturas o vídeos cortos de las demos.
Métricas de evaluación y resultados del backtest, con sus limitaciones.
Repositorios de GitHub y documentación técnica.

---

# Agent guide

Context and rules for AI agents working on this repo. The README covers structure, local preview, tests and deployment.

## What this is

A static, trilingual (EN/ES/IT) portfolio, English by default, in `public/`, deployed by Cloudflare Workers Builds on every merge to `main`. It has no build step and no dependencies; keep it that way unless asked.

## Positioning

- **Target roles:** Staff Data Engineer – AI Engineering, Data & AI Architect. The site shows focus areas (data engineering, data architecture, solutions architecture, AI engineering) rather than an explicit "open to" list of titles, so it does not box him in or signal a job search to his current employer. Frame achievements around architecture, data platforms, governance, technical leadership and generative AI.
- **Do not position him as an ML engineer.** Leave out model-training and ML-engineering framing.
- **Team leadership:** technical and methodological coordination of teams of approximately 8 people.
- **Tone:** professional and specific. Avoid slogans and jokes in headings and stats.

## Sources of truth

These live in `resources/`, which is git-ignored and never published. In order of freshness:

1. `linkedin Profile.pdf`: most up to date for titles, dates and volumes.
2. `MGT_CV-1.pdf`: the CV.
3. `Panel TOP@Expert.pptx`: use only for a few milestones (training, onboardings, interviews) and personal info. It is not a source for current roles.

**Data volumes:**
- ~8M records/day: batch processing for Carrefour.
- ~5M records/month: Mercedes-Benz after-sales lakehouse.
- 30–50K leads/month: multi-market campaigns.

**Confirmed by Manuel, not in the PDFs (2026-11-04):**
- His AI agents are in production and serve engineering teams. Say "teams", not "business teams".
- The agents run with human review, an audit trail and access control through Unity Catalog.

Never invent figures, technologies or claims that aren't in these sources. If something is missing, ask.

## Content rules

- **Companies and clients may be named. Internal project names may not**, for example SHERPA, MPRS, NeTAMPS or Geoban. `tests/content.test.mjs` enforces this.
- **Older technology** (Hadoop, Cloudera, Kafka, Kudu, Sqoop, .NET…) appears only inside the collapsed *Earlier career* rows, never in the main stack.
- **No phone number anywhere.** The only email shown is the public contact address.
- **Translations:** every visible string needs its Spanish and Italian versions in `data-es` and `data-it` attributes on the same element. Update the three languages together.
- **Projects:** the carousel lists Trading Advisor (live, runs daily), RAG System (live demo on Cloudflare's free tier at https://rag-catalog.mgutierrezt.workers.dev) and LLMOps Platform (live demo on a Cloudflare Worker on the free tier; the card links to its live demo at https://llmops-platform.mgutierrezt.workers.dev and to the repo). Trading Advisor stays first in the carousel. A card with a single destination is a link to its repo; a card with a live demo is a `div` with two links (demo + repository). Describe only what the repos actually contain; read their README before writing a card.

## Working on the repo

- **Branches:** `main` is protected (CODEOWNERS). Work on a branch and open a PR.
- **Tests:** run `npm test` before pushing. CI runs it too, plus a Cloudflare dry run; both must pass to merge. Fix the cause, not the test, unless the rule itself changed. When you add a content rule here, add a check for it in `tests/rules.test.mjs`.
- **Visual changes:** check them at 1366px and 390px, in both themes and all three languages.
- **Replacing the CV:** follow the redaction steps in the README and update `CV_SHA256`.
