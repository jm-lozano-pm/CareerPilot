# AI Responsibility Statement

## *CareerPilot uses AI as decision support for job seekers, not as an autonomous career decision-maker.*

**CareerPilot identifies possibilities; the job seeker decides.**

# **Data Used with AI**

* **Use only what is necessary.** AI inputs should be limited to the minimum context required for the specific feature.  
* **May include:** selected professional profile information, visible CV content, job descriptions, Career Goals, application history, recorded outcomes, and explicit employer feedback when relevant.  
* **Do not send:** credentials, session or API secrets, another user’s data, hidden CV content, unnecessary full personal-data payloads, or irrelevant sensitive characteristics.  
* **Evidence boundaries matter.** User-provided facts, employer feedback, system calculations, and AI interpretation should remain distinguishable.

# **Human Review & User Control**

* **Human review is required** before any consequential career action.  
* **No autonomous applications.** CareerPilot must not submit applications, decide whether a user should apply, or take other consequential actions on the user’s behalf.  
* **CV tailoring is reviewable.** AI may rephrase or emphasise supported information, but must not invent experience, skills, qualifications, achievements, or role history. Source CVs remain unchanged.  
* **Recommendations are advisory.** Users may review, dismiss, correct underlying records, or request a new analysis. A “Helpful” rating reflects perceived usefulness, not objective correctness.

# **Known Limitations & Failure Modes**

* **Context quality limits output.** Missing, outdated, sparse, or contradictory information can reduce the quality of recommendations.  
* **Unknowns must remain unknown.** CareerPilot should not invent rejection reasons or other explanations unsupported by recorded evidence.  
* **No hiring guarantees.** CV–Job Match is a CareerPilot document-to-job assessment, not an ATS score, interview probability, or promise of employment.  
* **Correlation is not causation.** Interview, offer, and source-performance patterns are observational and must not be presented as outcomes caused by CareerPilot.  
* **User-facing failures include** generic advice, unsupported certainty, missing-context errors, stale evidence, or recommendations that are safe but not useful.

# **Mistakes, Abuse & Escalation**

* **Critical blockers include** fabricated professional evidence, invented rejection reasons presented as facts, unsupported hiring guarantees, autonomous consequential actions, CV falsification, sensitive-attribute decisioning, or deceptive claims of recruiter/employer review.  
* **Escalation path:** Identify the failure → correct the prompt, context, output, or UI control → retest the affected capability → re-enable only after the critical scenario passes.  
* **If a critical guardrail cannot be met,** disable or remove the capability from the validation build rather than knowingly expose it.  
* **For non-critical errors,** users should be able to correct the underlying CareerPilot record and request a new analysis.  
* **Safety and usefulness are separate.** A recommendation can be useful but unsafe, or safe but not useful; both dimensions require review.

# 

# **How AI Was Used in the Project**

* **ChatGPT** supported the product-management workflow: structuring discovery hypotheses, synthesising research, drafting and refining the PRD and supporting documentation, defining KPI logic, and reviewing Responsible AI decisions.  
* **Atlassian Rovo** supported Jira and Confluence work, including backlog, Epic/User Story and roadmap-related organisation; all scope and prioritisation decisions were reviewed before being accepted.  
* **Lovable** was used as an AI-assisted builder to create and iterate the CareerPilot MVP from approved requirements, build-readiness decisions, and targeted audit/remediation prompts.  
* **Human ownership** remained with me. AI accelerated analysis, drafting and implementation, but I reviewed outputs, corrected assumptions, selected scope and priorities, and made the final product decisions. Credentials, secrets and unnecessary sensitive data were not intentionally provided to AI tools.

**Responsible AI operating rule — Ground in user evidence, preserve uncertainty, keep the user in control.**