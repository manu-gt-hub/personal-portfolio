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
- **Plain language:** readers include recruiters and business people. Explain jargon such as harness engineering and agentic ops in brackets the first time it appears and again in the current role; later mentions stay bare so the explanation is not repeated (chips can stay bare too). Describe impact as a concrete before/after (what people did by hand, what the agents do now) rather than vague phrases like "time saved and less risk".

## Sources of truth

These live in `resources/`, which is git-ignored and never published. In order of freshness:

1. `linkedin Profile.pdf`: most up to date for titles, dates and volumes.
2. `MGT_CV-1.pdf`: the CV.
3. `Panel TOP@Expert.pptx`: use only for a few milestones (training, onboardings, interviews) and personal info. It is not a source for current roles.

**Data volumes:**
- ~8M records/day: batch processing for Carrefour.
- ~5M records/month: Mercedes-Benz after-sales lakehouse.
- 100–150K leads/month: multi-market campaigns (confirmed by Manuel on 2026-11-05; the PDFs still say 30–50K).

**Confirmed by Manuel, not in the PDFs (2026-11-04, updated 2026-11-05):**
- His AI agents are in production. Business users use them for KPIs and reports; the team uses them to check data quality, with the data as the AI's context. In development, the harness gives the AI its context.
- The agents run with human review, an audit trail and access control through Unity Catalog.
- Example he allows on the site: a multi-agent system that uses YAML rules as context to flag rows in a file, correct them and verify each correction, iterating until the verifier and router agents agree the result is correct.
- Languages: Spanish native, English C1, Italian C1.
- He has no outcome metrics for the agents (time saved, users…). Do not add any, not even "realistic" estimates; describe the outcome qualitatively.
- (2026-11-08) Data quality is centralised in a single Unity Catalog table that can be queried directly with Genie. The agents took over the manual comparison of files and the review of human errors, which saves time and reduces risk (not quantified).
- (2026-11-08) As Technical Product Owner he turned business requirements into user stories, defined the technical roadmap and made technical decisions on architecture and code review.
- The team size (~8 people) appears only in the hero highlights and the current role, so it isn't repeated across sections.

Never invent figures, technologies or claims that aren't in these sources. If something is missing, ask.

## Content rules

- **Companies and clients may be named. Internal project names may not**, for example SHERPA, MPRS, NeTAMPS or Geoban. `tests/content.test.mjs` enforces this.
- **Experience:** each role in the timeline is a `<details>` that folds to its title, company and dates. Only the current role starts open, and only on screens 640px and wider: on phones `main.js` folds it too, to keep the page short.
- **No repeated content:** each fact has one home. The hero shows the headline figures, the timeline holds the details, and *Selected achievements* shows outcomes without restating what About or the timeline already say. The volume figures (~8M, ~5M, 100–150K) appear at most in the hero and in their role.
- **Older technology** (Hadoop, Cloudera, Kafka, Kudu, Sqoop, .NET…) appears only inside the collapsed *Earlier career* rows, never in the main stack.
- **No phone number anywhere.** The only email shown is the public contact address.
- **Translations:** every visible string needs its Spanish and Italian versions in `data-es` and `data-it` attributes on the same element. Update the three languages together.
- **Projects:** the carousel lists Trading Advisor (live, runs daily), RAG System (live demo on Cloudflare's free tier at https://rag-catalog.mgutierrezt.workers.dev) and LLMOps Platform (live demo on a Cloudflare Worker on the free tier; the card links to its live demo at https://llmops-platform.mgutierrezt.workers.dev and to the repo). Trading Advisor goes last in the carousel (decided 2026-11-09: a backtest return on its own invites scepticism from senior reviewers). Its card shows the out-of-sample figure and the limitations from the repo README (below buy-and-hold on most symbols; the backtest validates engine changes and is not a promise of returns); refresh the figures from the README when they change. The carousel sits in a `<details>` that starts open on screens 640px and wider and folded on phones; its summary names every project so the section is not skipped, and nav links to `#projects` open it. Every card is a `div` with a repository link and a docs link to the repo's documentation folder (`trading_advisor/docs`, `rag_system/doc`, `llmops-platform/doc`); the cards with a live demo also link to it. Diagrams of his professional work stay off the site: they could expose sensitive data. Describe only what the repos actually contain; read their README before writing a card.

## Working on the repo

- **Branches:** `main` is protected (CODEOWNERS). Work on a branch and open a PR.
- **Tests:** run `npm test` before pushing. CI runs it too, plus a Cloudflare dry run; both must pass to merge. Fix the cause, not the test, unless the rule itself changed. When you add a content rule here, add a check for it in `tests/rules.test.mjs`.
- **Visual changes:** check them at 1366px and 390px, in both themes and all three languages.
- **Replacing the CV:** follow the redaction steps in the README and update `CV_SHA256`.
