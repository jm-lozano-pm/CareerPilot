# **CareerPilot — Event Tracking**

*Final Deliverable*

| Project | CareerPilot — Ironhack Final Project |
| :---- | :---- |
| **Stage** | Discovery & Research → Product Definition → MVP Definition |
| **Status** | Final supporting deliverable — Event Tracking |
| **Project constraint** | MVP validation design; simulated demo data; no production analytics stack claim |

**Document purpose:** This document extends the approved CareerPilot product definition with a focused supporting artifact for MVP event tracking and measurement. It defines the signals needed to evaluate whether users reach the decision-support loop and whether AI recommendations are reviewed and perceived as useful.

Table of Contents

[**1\. Purpose	2**](#1.-purpose)

[**2\. Instrumentation Scope	2**](#2.-instrumentation-scope)

[**3\. Event Tracking Model	2**](#3.-event-tracking-model)

[**4\. Validation Funnel & Activation	2**](#4.-validation-funnel-&-activation)

[**5\. Event & Signal Dictionary	3**](#5.-event-&-signal-dictionary)

[**6\. Instrumentation & Capture Source	5**](#6.-instrumentation-&-capture-source)

[**7\. Core KPI Definitions	5**](#7.-core-kpi-definitions)

[**8\. Data Quality Rules	6**](#8.-data-quality-rules)

[**9\. Responsible Measurement Boundaries	6**](#9.-responsible-measurement-boundaries)

[**10\. Measurement Relationship	6**](#10.-measurement-relationship)

# **1\. Purpose**

This artifact defines the minimum product signals CareerPilot needs to evaluate whether users reach the decision-support loop and whether AI recommendations are reviewed and perceived as useful.

# **2\. Instrumentation Scope**

CareerPilot uses lightweight signals that can be recorded directly as events or derived from persistent records and timestamps in the connected product data model. This is an MVP measurement design, not a claim that a production analytics SDK or large-scale tracking stack has been deployed.

# **3\. Event Tracking Model**

Amplitude describes event tracking as capturing discrete, timestamped user actions with contextual properties. For CareerPilot, every canonical event should answer four basic questions: what happened, when it happened, who performed it, and what product context is needed to interpret it.

## **Common event schema**

• event\_name — canonical lower\_snake\_case name.  
• event\_id — unique identifier where feasible, used to detect duplicates.  
• occurred\_at — client or server timestamp for the completed action.  
• user\_id — internal CareerPilot identifier; do not use email as the analytics key.  
• session\_id — optional web session identifier when useful for journey analysis.  
• source — client, server or derived.  
• entity identifiers — only when relevant, such as job\_id, application\_id, cv\_id, insight\_id or recommendation\_id.  
• event-specific properties — bounded contextual values needed for analysis.  
• schema\_version — included when the event contract changes materially.

## **Naming convention**

• Use lower\_snake\_case.  
• Name completed actions or states, not UI labels. Example: application\_recorded rather than click\_record\_application\_button.  
• Use one canonical name for the same action across the product.  
• Store variants as properties rather than creating a new event name for each variant.  
• Do not silently repurpose an existing event. If meaning changes materially, migrate or version the schema.

## **Event categories used for the MVP**

• Funnel / setup signals: account\_created, context\_ready, job\_saved, application\_recorded.  
• Application evidence signals: application\_status\_changed, application\_outcome\_recorded.  
• Recommendation exposure and activation: recommendation\_shown, recommendation\_reviewed.  
• Feedback / control signals: recommendation\_feedback\_submitted, recommendation\_dismissed.  
• Revenue events are not applicable to the MVP because monetisation is outside the current validation scope.  
• Retention can later be analysed from repeated occurrences of core events such as recommendation\_reviewed rather than inventing a separate “retained” click event.

# **4\. Validation Funnel & Activation**

## **Validation funnel**

Recruited → Registered → Context Ready → Recommendation Shown → Recommendation Reviewed → Feedback Provided

## **Activation event**

The recommended MVP activation event is the user’s first meaningful review of an eligible CareerPilot recommendation generated from sufficient relevant context.

Account creation, profile completion, CV creation, job saving, application recording, dashboard opening or clicking an AI button are useful funnel diagnostics, but they are not activation by themselves.

# **5\. Event & Signal Dictionary**

## **5.1 account\_created**

**Definition / trigger**  
• A new user account is successfully created.  
**Key fields**  
• Internal user identifier; created timestamp.  
**Measurement use**  
• Registration funnel diagnostic and cohort denominator where appropriate.

## **5.2 context\_ready**

**Definition / trigger**  
• Derived state indicating that the user has enough relevant career and opportunity/application context for the intended analysis or recommendation.  
**Key fields**  
• Internal user identifier; context\_ready state; state-change timestamp where available.  
**Measurement use**  
• Context Readiness Rate and diagnosis of users who cannot yet reach the core decision-support experience.  
**Important note**  
• This is primarily a derived product state, not a click event.

## **5.3 job\_saved**

**Definition / trigger**  
• A reviewed job opportunity is saved to the user’s workspace, whether entered manually or through user-reviewed URL-assisted prefill.  
**Key fields**  
• job\_id; internal user identifier; capture method; created timestamp.  
**Measurement use**  
• Opportunity-workflow diagnostic and evidence availability.

## **5.4 application\_recorded**

**Definition / trigger**  
• The user records that an application has been submitted for a saved job.  
**Key fields**  
• application\_id; job\_id; internal user identifier; application date/timestamp.  
**Measurement use**  
• Application funnel, pipeline metrics and observational outcome rates.

## **5.5 application\_status\_changed**

**Definition / trigger**  
• A recorded application changes stage or status.  
**Key fields**  
• application\_id; previous status; new status; timestamp.  
**Measurement use**  
• Pipeline progression, stage counts and interview/offer calculations.  
**Important note**  
• Status history should be preserved rather than only overwriting the current state.

## **5.6 application\_outcome\_recorded**

**Definition / trigger**  
• The user records an application outcome or employer feedback that is actually available.  
**Key fields**  
• application\_id; outcome; timestamp; optional factual employer feedback.  
**Measurement use**  
• Observational interview/offer/rejection outcomes and later job-search interpretation.  
**Responsible-AI boundary**  
• An outcome record does not reveal the employer’s true reason unless that reason was explicitly provided.

## **5.7 recommendation\_shown**

**Definition / trigger**  
• An eligible CareerPilot recommendation becomes available to the user and is presented in the product.  
**Key fields**  
• recommendation\_id; insight\_id where relevant; internal user identifier; shown\_at; relevant context reference.  
**Measurement use**  
• Primary exposure denominator for Recommendation Review Rate.  
**Important note**  
• Internal recommendation generation may occur before exposure; “shown” is used for the review-rate denominator so unseen recommendations do not inflate it.

## **5.8 recommendation\_reviewed**

**Definition / trigger**  
• The user deliberately reviews a recommendation and its supporting evidence/context, or otherwise performs the implemented interaction that qualifies as meaningful review.  
**Key fields**  
• recommendation\_id; internal user identifier; reviewed\_at.  
**Measurement use**  
• MVP activation event and Recommendation Review Rate.  
**Important note**  
• Repeated opens of the same recommendation must not inflate unique review counts.

## **5.9 recommendation\_feedback\_submitted**

**Definition / trigger**  
• The user submits Helpful or Not Helpful feedback for a reviewed recommendation.  
**Key fields**  
• recommendation\_id; rating; feedback timestamp; optional explanation; optional intended\_action.  
**Measurement use**  
• Recommendation Usefulness Rate and Recommendation Feedback Coverage.  
**Important note**  
• intended\_action records stated intention only; it must not be interpreted as completed behaviour.

## **5.10 recommendation\_dismissed**

**Definition / trigger**  
• The user dismisses a recommendation.  
**Key fields**  
• recommendation\_id; dismissed\_at; internal user identifier.  
**Measurement use**  
• Human-control and relevance diagnostic.  
**Important note**  
• Dismissal is distinct from a Not Helpful rating and should not be silently treated as negative feedback.

# **6\. Instrumentation & Capture Source**

CareerPilot should capture an event only after the underlying action has succeeded. A failed save or failed API request must not be counted as the corresponding successful product event.

## **Preferred source of truth**

• Server / database-backed events: account\_created, job\_saved, application\_recorded, application\_status\_changed, application\_outcome\_recorded, recommendation\_feedback\_submitted and recommendation\_dismissed.  
• Derived state: context\_ready is calculated from persistent user context rather than treated as a click.  
• Client exposure / review events: recommendation\_shown and recommendation\_reviewed originate from the product UI, but their first qualifying timestamp should be persisted so repeated rendering or reopening does not inflate counts.

## **Operational error events — recommended for production hardening**

These supporting events are useful for detecting friction and validating implementation, but they are not part of the North Star KPI scorecard:  
• ai\_analysis\_failed — operation\_type, error\_code, retryable.  
• job\_prefill\_failed — error\_code, retryable.  
• cv\_export\_failed — cv\_id, error\_code.  
• authentication\_failed — auth\_step, provider where relevant, error\_code.

No raw AI prompt, CV content, job-description text or personal narrative should be stored in these analytics events.

## **Instrumentation QA checklist**

• Duplicate prevention — one completed user action should not emit multiple canonical events. Use event\_id and entity-level de-duplication where appropriate.  
• Missing-event checks — confirm that success events fire only after persistence succeeds and that retry paths do not lose or double-count events.  
• Naming consistency — the same action must use the same canonical event name and property names everywhere.  
• Property validation — required properties should be present and enum-like values should use controlled values.  
• Schema governance — material property or meaning changes should be documented and versioned.  
• Reconciliation — for high-value events, periodically compare analytics counts with the underlying CareerPilot database records.  
• Privacy review — use internal identifiers and minimum necessary context; avoid email addresses, phone numbers, raw CV text, job-description text and free-text AI inputs/outputs in analytics.

# **7\. Core KPI Definitions**

## **Recommendation Usefulness Rate — North Star**

Helpful feedback submissions ÷ all Helpful \+ Not Helpful feedback submissions.

## **Recommendation Review Rate**

Unique recommendations reviewed ÷ eligible recommendations shown.

## **Recommendation Feedback Coverage**

Unique reviewed recommendations with submitted feedback ÷ unique reviewed recommendations.

## **Context Readiness Rate**

Users meeting the defined minimum context threshold ÷ the relevant validation cohort.

## **Activation**

First meaningful review of an eligible recommendation from sufficient relevant context.

## **Supporting observational metrics**

Interview Rate, Offer Rate and accepted-offer duration can be calculated from recorded applications and outcomes. They describe job-search outcomes; they are not proof that CareerPilot caused those outcomes.

# **8\. Data Quality Rules**

• Link feedback to the correct user and recommendation.  
• De-duplicate repeated recommendation views/reviews for rate calculations.  
• Keep recommendation dismissal separate from explicit Helpful / Not Helpful feedback.  
• Preserve status history and timestamps needed for funnel and outcome calculations.  
• Keep factual records, deterministic metrics and AI-generated interpretation distinguishable.  
• Use internal identifiers and minimum necessary data for measurement; avoid unnecessary personal data in analytics.  
• Treat optional intended action as intention, not observed follow-through.

# **9\. Responsible Measurement Boundaries**

CareerPilot should not use these events to claim that the product caused a user to obtain an interview, offer or job. The MVP is designed to validate whether users reach, review and find the decision-support recommendations useful.

Current dashboard values are simulated demo data. They demonstrate the measurement framework and formulas; they are not real-user validation results and must remain labelled as simulated.

# **10\. Measurement Relationship**

Context ready → Recommendation shown → Recommendation reviewed → Feedback submitted  
                         ↓  
                    Dismissed

The primary learning question is: when CareerPilot has enough relevant context to make a grounded recommendation, do users meaningfully review it and find it useful?