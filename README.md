<div align="center">

![CareerPilot — AI-assisted job-search decision support](docs/assets/hero.png)

# CareerPilot

### AI-assisted job-search decision support for active job seekers

CareerPilot connects career context, CVs, opportunities, applications, outcomes, and cautious AI guidance—helping job seekers decide where to invest effort and what to do next.

**CareerPilot identifies possibilities; the job seeker decides.**

![Ironhack](https://img.shields.io/badge/Ironhack-AI%20Product%20Manager-2D2B55?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Responsible AI](https://img.shields.io/badge/Responsible%20AI-Human--in--the--loop-7C3AED?style=flat-square)

[Explore the MVP](#mvp-scope) · [Presentation](docs/Presentation.pdf) · [PRD](docs/PRD.md) · [User Research](docs/User%20Insight%20Artifact.md) · [Responsible AI](docs/AI%20Responsibility%20Statement.md)

*Ironhack AI Product Manager Final Project · 10-day capstone delivery window*

</div>

## Table of Contents

- [Project Overview](#project-overview)
- [Problem & Opportunity](#problem--opportunity)
- [Research & Key Insights](#research--key-insights)
- [Product Strategy & Core Workflow](#product-strategy--core-workflow)
- [MVP Scope](#mvp-scope)
- [AI Decision Support](#ai-decision-support)
- [Responsible AI](#responsible-ai)
- [Success Metrics](#success-metrics)
- [Monitoring & Event Tracking](#monitoring--event-tracking)
- [Product & Technical Architecture](#product--technical-architecture)
- [Product Documentation](#product-documentation)
- [Tools & Technology](#tools--technology)
- [Product Management Skills](#product-management-skills)
- [Reflection](#reflection)
- [About](#about)
- [Team](#team)

## Project Overview

CareerPilot is a web-based job-search support product for active job seekers managing several opportunities at once. It combines a professional profile, career goals, multiple CVs, saved jobs, application tracking, outcome records, a factual dashboard, and AI-assisted recommendations in one connected workspace.

It is deliberately not a job board, recruiter platform, or autonomous application agent. Its differentiated hypothesis is that job seekers may need more help turning job-search information into better-informed decisions—not simply another place to store it.

The capstone covers the complete PM journey: discovery, research, competitive analysis, product definition, prioritisation, backlog design, measurement, Responsible AI, implementation, and monitoring design.

## Problem & Opportunity

Active job seekers make repeated decisions with incomplete feedback:

- Is this imperfect-fit opportunity worth pursuing?
- How much tailoring effort does this application justify?
- What do recent applications and outcomes suggest might deserve attention?
- Where should effort go next?

CareerPilot began as a broader CV-builder and tracker concept. Research weakened both as primary differentiators: mature products already serve those needs, while user behaviour varied. The stronger directional signal was feedback and actionability—the gap between recording activity and interpreting it responsibly.

**Refined hypothesis:** Active job seekers may struggle to turn information from their job search into confident decisions about which opportunities deserve effort and what they should change based on application outcomes.

This is a hypothesis to validate, not a proven market-wide problem.

## Research & Key Insights

Discovery combined a structured survey with **5 respondents**, secondary research using **6 BLS and NBER sources**, a self-conducted think-aloud exploration of FlowCV, Huntr, and Teal, plus analysis of manual alternatives such as spreadsheets, Notion, email, and memory.

1. **Outcome visibility showed the clearest signal.** Four of five respondents did not clearly know which parts of their search worked best; four also reported changing strategy based on results.
2. **Rejection creates an information need, not reliable causal evidence.** Four of five wanted to understand why they were rejected, but CareerPilot cannot infer an employer's true reason without explicit evidence.
3. **Job-fit decisions are trade-offs.** People may apply without meeting every requirement, so the useful question is often whether the opportunity merits the effort—not a binary verdict.
4. **Tailoring is relevant but not universal.** Behaviours ranged from reusing one CV to making small changes or using AI tools.
5. **Tracking is an enabler, not validated differentiation.** Respondents used memory, spreadsheets, job-board tools, or no tracker, while established competitors already offer mature tracking.

### Research limitations

The sample was small (n=5), convenience-based, and self-reported. No qualitative user interviews were completed. Competitor think-aloud observations were conducted by the project owner rather than independent usability participants. Secondary sources provide context but do not prove demand for CareerPilot. Pain severity, trust, data sufficiency, actionability, segment fit, willingness to pay, and behavioural impact all require further validation.

Read the complete evidence base in the [User Insight Artifact](docs/User%20Insight%20Artifact.md).

## Product Strategy & Core Workflow

CareerPilot connects factual job-search context with cautious, user-controlled decision support.

    Profile & Goals
          ↓
    Multiple CVs → Saved Opportunity → Optional CV–Job Match / AI Tailoring
                                          ↓
                               Record an Application
                                          ↓
                      Applied → Interview → Offer
                             ↘ Rejected / Withdrawn / Closed
                                          ↓
                     Dashboard, Insights & Recommended Actions
                                          ↓
                           Review · Dismiss · Give Feedback

Saving a job and recording an application are separate actions. AI tailoring creates a new CV copy rather than overwriting the source. Recorded facts, explicit employer feedback, deterministic metrics, and AI interpretation remain distinguishable.

## MVP Scope

The MVP is a focused web experience built to test the decision-support hypothesis within a 10-day delivery window.

### Included

- Secure account access and a private persistent workspace
- Structured professional profile and career goals
- Multiple named CVs with Classic, Modern, and Compact one-column templates
- Per-CV visibility controls, preview, and PDF export
- Manual and user-reviewed URL-assisted job capture
- Kanban application workflow with drag-and-drop and status-control fallback
- Separate application, progression, outcome, and employer-feedback records
- Dashboard with factual metrics and cautious patterns
- Contextual opportunity insights and a transparent CV–Job Match Assessment
- User-initiated AI CV tailoring that creates a reviewable copy
- Recommended actions with review, dismissal, and usefulness feedback

### Out of scope

- A native job marketplace or job board
- Recruiter and employer workflows
- Autonomous applications or consequential career actions
- Claims of employer ATS access, hiring probability, or guaranteed outcomes
- Advanced freeform CV design
- Dedicated native mobile or desktop products

Future possibilities include broader job integrations, advanced analytics, cover-letter support, a browser extension, and deeper CV customisation—but only where further evidence justifies them.

## AI Decision Support

CareerPilot uses the minimum relevant, user-controlled context for each task. Depending on the feature, that may include selected profile information, visible CV content, a job description, career goals, applications, recorded outcomes, and explicit employer feedback.

It can help users review opportunity trade-offs, compare a selected CV with a job, create a tailored CV copy from supported facts, identify cautious patterns, and consider possible next actions with their supporting context.

The CV–Job Match result is a CareerPilot document-to-job assessment—not an employer ATS score, eligibility verdict, interview probability, or hiring prediction. AI output is advisory and remains subject to user review.

## Responsible AI

Responsible AI is part of the product definition, not a final compliance add-on.

- **Human control:** no autonomous applications or career decisions.
- **Evidence boundaries:** user facts, employer evidence, system calculations, and AI interpretations remain distinguishable.
- **No invented explanations:** unknown rejection reasons stay unknown.
- **No CV fabrication:** tailoring cannot invent experience, skills, qualifications, or achievements.
- **Uncertainty by design:** sparse or contradictory context produces limitations, not forced conclusions.
- **Data minimisation:** only task-relevant context is sent to the AI provider.
- **No causal or hiring claims:** observed patterns do not prove CareerPilot caused an interview, offer, or job.
- **Fail safely:** disable a capability from the validation build if a critical guardrail cannot be met.

Full principles and escalation rules: [AI Responsibility Statement](docs/AI%20Responsibility%20Statement.md).

## Success Metrics

The framework separates product usefulness from downstream hiring outcomes.

| Metric | Role | Definition | MVP target |
|---|---|---|---|
| Recommendation Usefulness Rate | North Star | Helpful ratings ÷ all explicit ratings | ≥70%, with feedback on ≥50% of reviewed recommendations |
| Recommendation Review Rate | Supporting | Unique recommendations reviewed ÷ eligible recommendations shown | ≥60% |
| Recommendation Feedback Coverage | Supporting | Reviewed recommendations with feedback ÷ recommendations reviewed | ≥50% |
| Context Readiness Rate | Supporting | Users with sufficient context ÷ relevant validation cohort | ≥70% |
| Interview Rate | Downstream observation | Applications reaching Interview ÷ submitted applications | Establish baseline |
| Offer Rate | Downstream observation | Applications resulting in Offer ÷ submitted applications | Establish baseline |
| Time to Job | Long-term observation | Days from recorded search start to accepted job | Establish baseline |

Activation is the first meaningful review of an eligible recommendation generated from sufficient context. Dashboard and monitoring values currently shown are **simulated demo data**, not real-user validation results.

## Monitoring & Event Tracking

The event model measures whether users reach the core decision-support loop:

    Registered → Context Ready → Recommendation Shown → Recommendation Reviewed → Feedback Provided
                                                                   ↘ Dismissed

Canonical signals cover account creation, context readiness, job and application activity, outcome recording, recommendation exposure/review, feedback, and dismissal.

Events represent successful actions or derived states with internal identifiers and minimum necessary context. Dismissal remains separate from a Not Helpful rating, repeated views are de-duplicated, and raw CV, job-description, or AI-prompt content does not belong in analytics events.

[Read the event specification](docs/Event%20Tracking.md) · [Open the dashboard PDF](docs/Monitoring%20Dashboard%20.pdf)

![CareerPilot Monitoring Dashboard — simulated demo data](docs/assets/Monitoring%20Dashboard.png)

## Product & Technical Architecture

    React / TanStack Start web experience
                     ↓
           Trusted backend / API layer
              ↙                  ↘
    Supabase PostgreSQL      External AI service
    Auth + user-isolated     Minimum relevant context,
    persistent records       validated structured output

The relational model preserves relationships among users, profiles, goals, independent CVs, source/tailored CV provenance, jobs, applications, status history, outcomes, match assessments, recommendations, dismissal state, and feedback. Saved jobs remain distinct from applications, and backend authorisation protects user-level isolation independently of frontend visibility.

## Product Documentation

| Artifact | Purpose |
|---|---|
| [PRD](docs/PRD.md) | Context, requirements, 37 stories, prioritisation, metrics, risks, privacy, Responsible AI, GTM, and roadmap |
| [User Insight Artifact](docs/User%20Insight%20Artifact.md) | Methods, evidence, triangulation, insights, decisions, and limitations |
| [AI Responsibility Statement](docs/AI%20Responsibility%20Statement.md) | Data boundaries, human control, failure modes, and escalation |
| [AI Use Reflection](docs/AI%20Use%20Reflection.md) | AI acceleration, risks, and human review |
| [Event Tracking](docs/Event%20Tracking.md) | Events, activation, KPIs, QA, and privacy boundaries |
| [Monitoring Dashboard](docs/Monitoring%20Dashboard%20.pdf) | Simulated monitoring view |
| [Final Presentation](docs/Presentation.pdf) | Capstone narrative and product story |

## Tools & Technology

**Product management:** ChatGPT for research support, synthesis, documentation, and KPI logic; Jira Product Discovery for idea-level prioritisation and roadmap; Jira Software for the delivery backlog; Confluence for approved prioritisation and documentation; Lovable for AI-assisted implementation.

**Implementation:** React 19, TypeScript, TanStack Start, Vite, Tailwind CSS, Radix UI, Supabase/PostgreSQL, TanStack Query, TanStack Router, dnd-kit, Recharts, Zod, and React Hook Form.

## Product Management Skills

- Problem framing and hypothesis management
- Primary and secondary research
- Competitive analysis and evidence triangulation
- Insight synthesis and decision logging
- Persona and Jobs-to-be-Done definition
- MVP scoping under time constraints
- Requirements, stories, acceptance criteria, and backlog traceability
- MoSCoW prioritisation and roadmap design
- KPI hierarchy, activation, event tracking, and monitoring
- Responsible AI, privacy, data minimisation, and human-in-the-loop design
- AI-assisted prototyping with critical human review

## Reflection

The most important product lesson was that research should be allowed to change the product. CareerPilot started with CV creation and tracking near the centre. The evidence did not support treating either as the primary problem, so the concept shifted toward the more uncertain—but potentially more differentiated—space between job-search information and decisions.

AI was most effective as a speed and structure multiplier. It was most risky when polished output could be mistaken for evidence or settled judgement. Competitor assumptions needed correction, simulated data needed explicit labels, and limited research needed careful language.

**Use AI to accelerate the work; keep evidence, judgement, and accountability human-owned.**

Read the full [AI Use Reflection](docs/AI%20Use%20Reflection.md).

## About

CareerPilot is an AI Product Management capstone created for Ironhack. It demonstrates an end-to-end process: discovering and reframing a problem, translating evidence into decisions, defining and prioritising a responsible MVP, building a connected web experience, and designing measurement for its core hypothesis.

This repository is a portfolio case study and MVP implementation. It does not claim statistically representative validation, production-scale analytics, proven hiring impact, or guaranteed career outcomes.

## Team

### Jose Manuel Lozano — Solo Product Manager & Builder

Jose Manuel owned the complete project lifecycle: research, product strategy, scope, PRD, prioritisation, backlog, Responsible AI, measurement design, prototype implementation, and final presentation.

[GitHub profile](https://github.com/jm-lozano-pm)
