# **CareerPilot — User Insight Artifact**

**User Research Synthesis, Hypothesis Validation & Decision Log | v2 | 28 August 2026**

Purpose: consolidate the evidence gathered through secondary research, a structured user survey (n=5), and a self-conducted think-aloud exploration of FlowCV, Huntr and Teal. This document is an evidence record, not a final product specification. It explicitly separates hypotheses, evidence, interpretation, inference, decisions and remaining uncertainty.

# **Table of Contents**

[**1 — Research Objective	2**](#heading=)

[**2 — Evidence Framework	2**](#heading=)

[**3 — Research Hypotheses Under Investigation	3**](#heading=)

[**4 — Research Methods & Evidence Base	3**](#heading=)

[**5 — User Survey Findings	4**](#heading=)

[**6 — Secondary Research	5**](#heading=)

[**7 — Think-Aloud Usability & Competitor Evidence	7**](#heading=)

[**8 — Manual Alternatives & Workarounds	8**](#heading=)

[**9 — Triangulation: Secondary Research \+ Survey \+ Usability	9**](#heading=)

[**10 — Key User Insights	10**](#heading=)

[**11 — Emerging Hypothesis: Job-Search Decision Support	10**](#heading=)

[**12 — Product Implications	11**](#heading=)

[**13 — What Changed From the Initial Position	11**](#heading=)

[**14 — What Did Not Change	11**](#heading=)

[**15 — Hypothesis Validation Matrix	12**](#heading=)

[**16 — Decision Log	13**](#heading=)

[**17 — Analytics / Feedback Decision Test	14**](#heading=)

[**18 — Cover Letters	14**](#heading=)

[**19 — Target User & Persona Status	14**](#heading=)

[**20 — Current Refined Problem Hypothesis	14**](#heading=)

[**21 — Remaining Open Questions	15**](#heading=)

[**22 — Research Limitations	15**](#heading=)

[**23 — Current Research Conclusion	15**](#heading=)

[**24 — External Source-to-Claim Map	16**](#heading=)

# **01 — Research Objective**

The research objective is to determine whether the current CareerPilot problem hypotheses describe meaningful problems for active job seekers, identify which problems appear most important and underserved, understand what people do today, examine existing alternatives, and determine how the product direction should change in response to evidence.

The research is deliberately problem-first. It is not intended to prove that CareerPilot should exist or to validate a predetermined feature set.

## **Primary research questions**

* RQ1 — How do active job seekers decide whether they are qualified enough to apply?  
* RQ2 — How do active job seekers adapt their applications to different opportunities, and what makes this difficult or time-consuming?  
* RQ3 — How do active job seekers manage multiple applications from submission through interview or rejection?  
* RQ4 — Do job seekers understand which sources and strategies are producing the best results for them, and would this information influence their behaviour?  
* RQ5 — Which tools and workarounds already solve these problems well, and where do meaningful gaps remain?

# **02 — Evidence Framework**

| Category | Meaning | How it is used in this artifact |
| :---- | :---- | :---- |
| FACT | Supported by a reliable external source or direct evidence. | Used for source-backed or directly observed statements. |
| OBSERVATION | Something directly observed in a product, workflow or research interaction. | Used for the self-conducted think-aloud and product exploration. |
| USER INSIGHT | A meaningful finding about behaviour, motivation, pain or need supported by evidence. | Used only where multiple observations or user responses justify an interpretation. |
| HYPOTHESIS | Something believed but not sufficiently validated. | The H1–H7 statements below began as research hypotheses. |
| ASSUMPTION | Something that must be true for a product direction to work. | Tracked when research reveals dependencies that still need proof. |
| INFERENCE | A conclusion drawn from available evidence. | Clearly labelled as interpretation rather than direct evidence. |
| DECISION | A deliberate project decision based on evidence. | Recorded in the Decision Log. |
| OPEN QUESTION | Something unresolved that requires further investigation. | Preserved rather than forced into a conclusion. |

Research rule: a hypothesis or assumption must not be presented as an established fact. Where evidence is insufficient, the correct conclusion is: “We need to validate this.”

# **03 — Research Hypotheses Under Investigation**

These were the hypotheses entering the research. They are included explicitly so that the reader can understand what H1–H7 mean without needing to consult another project document. The initial priority was based on perceived importance and uncertainty before research; it was intentionally allowed to change.

| Hypothesis | Original statement | Initial priority | Research focus |
| :---- | :---- | :---- | :---- |
| H1 — Job-fit decisions | Job seekers struggle to determine whether they are a realistic match for a job and whether they should apply when they do not meet all requirements. | 1 — High importance / High uncertainty | Job-fit decision-making; information used before applying. |
| H2 — Application quality / tailoring | Tailoring applications to individual jobs requires significant time and cognitive effort. | 2 — High importance / High uncertainty | Tailoring behaviour, preparation time and perceived value of tailoring. |
| H3 — Application tracking | Job seekers managing multiple applications struggle to keep an accurate overview of what they applied for and the current status of each application. | 3 — High importance / Medium uncertainty | Tracking behaviour, maintenance effort and existing alternatives. |
| H4 — Feedback & actionability | Job seekers may lack a clear way to understand which parts of their job-search strategy are producing meaningful outcomes, such as interviews and offers. | 4 — High importance / High uncertainty | Visibility, usefulness, actionability, behaviour change and outcomes. |
| H5 — Post-application management | Job seekers struggle to manage what happens after applying, including follow-ups, interviews and next actions. | 5 — Medium–High importance / High uncertainty | Status, follow-up and post-application coordination. |
| H6 — Multi-channel search / source focus | Job seekers experience meaningful friction when deciding where to focus their job-search effort across multiple sources. | 6 — Medium importance / High uncertainty | Use of multiple sources and whether source choice creates meaningful pain. |
| H7 — CV creation | Creating or maintaining a CV is a significant enough problem to justify being a central product problem. | 7 — Medium importance / High uncertainty | Temporarily deprioritised because evidence increasingly separates CV quality from CV creation. |

## **Important distinction about H4**

H4 is not equivalent to “users want a dashboard.” The research plan defined a stricter chain: Visibility → Pain → Usefulness → Actionability → Behaviour → Outcome. A positive reaction to metrics would not be sufficient evidence. The question is whether performance information helps users make better decisions and changes what they do.

# **04 — Research Methods & Evidence Base**

| Method | Evidence collected | Purpose | Strength / limitation |
| :---- | :---- | :---- | :---- |
| Structured user survey | 5 responses | Understand reported behaviour, pain, tools, tailoring, tracking, feedback needs and frustrations. | Direct primary evidence, but small convenience sample and self-reported. |
| Secondary research | 6 external sources from BLS/NBER | Test hypotheses against broader evidence and deliberately seek supporting and contradicting evidence. | High-quality external context; does not prove CareerPilot demand. |
| Think-aloud usability exploration | Hands-on exploration of FlowCV, Huntr and Teal, including free and selected Pro workflows. | Observe UI clarity, hierarchy, navigation, workflow friction, customisation, paywalls and analytics. | Direct product observation by the project owner; not a market-wide usability study. |
| Competitive analysis | FlowCV, Huntr, Teal and manual alternatives | Understand what is already well solved and where potential gaps might exist. | Competitor presence/absence is not proof of user need. |

# **05 — User Survey Findings**

The survey is the project's primary-user evidence. Because only five people responded, percentages should be read as counts within this sample, not as prevalence estimates for job seekers generally.

| Area | Direct survey evidence | Interpretation | Confidence |
| :---- | :---- | :---- | :---- |
| Job-fit uncertainty | 4/5 encounter jobs they are interested in but do not fully qualify for at least sometimes; 3/5 apply anyway. | Missing requirements are not always treated as a reason not to apply. | Medium |
| Application preparation | Reported preparation time ranged from under 10 minutes to more than one hour. | Application effort varies substantially by person and application. | Medium |
| Tailoring behaviour | 2/5 use AI/tools to tailor; 2/5 use the same CV almost every time; 1/5 makes small changes. | Tailoring is real but not universal; users differ in perceived effort and value. | Medium |
| Tracking behaviour | 2/5 do not track; others use memory, a spreadsheet or a job-board tracker. | A dedicated tracker is not universally used. | Medium |
| Outcome visibility | 4/5 do not clearly know which parts of their job search work best. | There is a directional signal of uncertainty about performance. | Medium |
| Rejection feedback | 4/5 selected understanding why they are getting rejected as something they most want to understand. | Understanding outcomes may be more compelling than generic reporting. | Medium |
| Strategy change | 4/5 reported changing their job-search strategy based on results. | Users may already act on feedback, but the quality and source of feedback are unclear. | Medium |
| Multi-channel search | All 5 use LinkedIn; several also use company sites and other job platforms/networks. | Multi-channel search is common in this sample, but source-selection pain is not established. | Low–Medium |

## **Survey evidence that matters most for the emerging direction**

* The strongest direct signal is not that users want another tracker; it is that 4/5 do not clearly know which parts of their job search work best.  
* 4/5 also want to understand why they are being rejected. This points toward an information/feedback need, but does not prove that a product can provide a reliable explanation.  
* 4/5 report changing their job-search strategy based on results. This makes actionability worth investigating because users already attempt to learn from outcomes.  
* Tailoring behaviour is split. The evidence therefore does not support assuming that every active job seeker wants to tailor every application.  
* Tracking behaviour is also split. This weakens the assumption that application tracking is universally painful.

# **06 — Secondary Research**

Secondary research was conducted in two passes. Pass 1 systematically searched across H1–H7 and included both supporting and contradicting evidence. Pass 2 concentrated on H1 Job-fit, H2 Application quality/tailoring, H4 Feedback/actionability, H3/H5 Application-status friction and H6 Multi-channel search. H7 was temporarily deprioritised.

Source selection prioritised credibility, relevance, recency where appropriate, methodological transparency, and whether the source actually supported the claim being made. The six retained sources are listed below.

| ID / Source | Publication | Date | Quality | Evidence / limitation | Relevant hypotheses |
| :---- | :---- | :---- | :---- | :---- | :---- |
| S1 — U.S. Bureau of Labor Statistics | How do jobseekers search for jobs? New data on applications, interviews, and job offers | 2020 | High | Uses CPS data from May and September 2018\. Provides representative context on applications, interviews and offers. It does not prove that tracking or analytics cause better outcomes. | H1, H3/H5, H4 context |
| S2 — U.S. Bureau of Labor Statistics | Unemployed jobseekers by sex, reason for unemployment, and active job search methods used | 2025 data; published 2026 | High | Official annual-average statistics. In 2025, jobseekers used multiple active methods; average methods used was 1.8. The table supports multi-method behaviour, not multi-channel pain. | H6 |
| S3 — Steven J. Davis & Brenda Samaniego de la Parra / NBER | Application Flows | 2024; revised Dec. 2025 | High | Database of 125 million applications on Dice.com. Almost half of applications flowed to openings posted within the prior 48 hours; application intensity was uneven. Platform/occupation-specific. | H3/H5, H6 context |
| S4 — Le Barbanchon, Schmieder & Weber / NBER | Job Search, Unemployment Insurance, and Active Labor Market Policies | 2024 | High | Broad empirical overview of job-search behaviour and labour-market policies. Useful context, but not specifically evidence about tracking or tailoring. | H1–H6 context |
| S5 — Belot et al. / NBER | Advising Job Seekers in Occupations with Poor Prospects: A Field Experiment | May 2025 | High | Randomised field experiment. Personalised information about alternative occupations/prospects improved employment, hours and labour income by 5–6% after 18 months in the studied context. Does not prove a general CareerPilot decision-support demand. | H1, H4 |
| S6 — Chiplunkar, Kelley & Lane / NBER | Who Gets the Job? The Consequences of Strategic Information Sharing within Social Networks | 2024; revised Sep. 2025 | High | Experimental evidence about job-information sharing and applicant/hiring outcomes in social networks. Relevant to information availability, but not direct evidence about job-search tracking or source dashboards. | H1, H6 context |

## **External source links**

[S1 — BLS: How do jobseekers search for jobs?](https://www.bls.gov/opub/btn/volume-9/how-do-jobseekers-search-for-jobs.htm)

[S2 — BLS: 2025 active job-search methods](https://www.bls.gov/cps/cpsaat34.htm)

[S3 — NBER: Application Flows](https://www.nber.org/papers/w32320)

[S4 — NBER: Job Search, Unemployment Insurance, and Active Labor Market Policies](https://www.nber.org/papers/w32720)

[S5 — NBER: Advising Job Seekers in Occupations with Poor Prospects](https://www.nber.org/papers/w33819)

[S6 — NBER: Who Gets the Job?](https://www.nber.org/papers/w32171)

## **Secondary research synthesis by hypothesis**

**H1 — Job-fit decisions** — External evidence strengthens the broader idea that information can affect job-search decisions and outcomes. S5 is especially relevant because personalised information changed outcomes in a specific labour-market context. This supports investigating decision support, but does not prove job-fit evaluation is a dominant pain.

**H2 — Application quality / tailoring** — The retained external evidence is stronger for the broader importance of matching/application quality than for the exact claim that tailoring is the dominant user pain. Competitors heavily emphasise resume/job alignment, which shows market activity but not unmet demand.

**H4 — Feedback and actionability** — External evidence supports the principle that useful information can influence behaviour in some contexts. However, this does not validate a dashboard. CareerPilot still needs to prove the chain from visibility to action and meaningful outcome.

**H3/H5 — Application-status friction** — Application activity is substantial, and the competitive category for tracking/status management is mature. This weakens the claim that basic tracking alone is underserved. The unresolved question is whether maintenance, fragmentation or post-application coordination create enough pain to matter.

**H6 — Multi-channel search** — Current BLS data show that jobseekers use multiple active search methods. This supports multi-channel behaviour but not the stronger claim that users struggle to decide where to focus.

**H7 — CV creation** — H7 is temporarily deprioritised. Existing products provide substantial CV creation capability, while the survey does not show creation itself as the dominant frustration. The more promising question is whether CV quality/tailoring matters at a later stage of the workflow.

# **07 — Think-Aloud Usability & Competitor Evidence**

This was not a usability test of CareerPilot because CareerPilot does not yet exist. It was a self-conducted think-aloud examination of existing products. The focus was on UI clarity, hierarchy, text size/readability, navigation, information architecture, discoverability, onboarding, free/paid boundaries, resume customisation, tracking workflow and analytics.

| Product | Observed strengths | Observed friction / limitations | Research implication |
| :---- | :---- | :---- | :---- |
| FlowCV | Simple business-oriented UI; many templates; extensive customisation; can build before account creation; sections can be shown/hidden; templates can be shared; Pro adds multiple CVs/cover letters and AI tools. | AI tools perceived as more limited than Huntr; Pro gating; tracker perceived as limited; explored workflow did not provide job-specific tailoring; translated PDFs shared a filename. | Strong CV UX, but CV creation/customisation is not enough to differentiate CareerPilot. |
| Huntr | Free tracker with limits; welcome page suggests next steps; detailed job records; manual \+ Chrome extension capture; ATS scanner and editable AI tailoring in Pro; metrics available. | Login required; small UI/text; persistent onboarding; some Pro-gated actions appear inactive to free users; resume functions feel fragmented; lower perceived customisation; limited template flexibility. | Strong application workflow coverage, but UX friction exists. Tracking itself is already well served. |
| Teal | Onboarding; job search; resume import from resume/LinkedIn/plain text; tutorial; moderate customisation; selectable information; list \+ board tracker; metrics for saved jobs/applications/interviews/offers/activity. | Templates appear visually similar; explored AI/job-search experience appeared US-focused; advanced analysis/alignment/AI features are gated by Teal+; metrics exist but actionability is unproven. | Most relevant comparator for integrated search \+ tracking \+ performance visibility. Analytics is not novel by itself. |

## **Important competitor corrections and observations**

* Huntr should not be described as requiring an existing CV upload. The explored/current project understanding is that users can start from profile information, an uploaded CV or LinkedIn information.  
* Huntr job capture is available manually and through a Chrome extension.  
* FlowCV Pro was explored at €19 monthly or €60 yearly during the project investigation. Payment methods observed were card, PayPal and Google Pay.  
* Huntr Pro was explored at $40 monthly, $90 every three months or $160 every six months; the monthly price displayed as €34.51 during testing. Card payment was observed.  
* Teal demonstrates that integrated job search, tracking and metrics already exist in the market. Therefore an 'all-in-one' proposition or analytics dashboard is not sufficient differentiation.

# **08 — Manual Alternatives & Workarounds**

| Alternative | What it does well | What may break | Research implication |
| :---- | :---- | :---- | :---- |
| Spreadsheets | Flexible tracking, custom fields, formulas and charts. | Manual maintenance and discipline. | Basic tracking and analytics are possible without a dedicated career product. |
| Notion | Highly customisable databases and linked workflows. | Setup and maintenance complexity. | Flexibility is valuable, but users pay with configuration effort. |
| Documents | Simple information storage and job-specific notes. | Poor structured overview and comparison. | Low-friction storage may be sufficient for low-volume searches. |
| Notes | Very fast capture. | Becomes unstructured at higher volume. | Speed may matter more than sophisticated workflow. |
| Email | Automatically preserves recruiter/application communication. | Not designed as a tracker; status is implicit. | Some application information already exists elsewhere. |
| Calendar | Reminders and interview scheduling. | Does not represent the whole application portfolio. | Some post-application coordination is already solved elsewhere. |
| Bookmarks | Fast job saving. | Little context about why a job was saved or whether it was applied to. | Discovery and application state can become disconnected. |
| Memory | Zero setup. | Does not scale reliably with volume. | Need to identify the volume threshold where this breaks down. |

# **09 — Triangulation: Secondary Research \+ Survey \+ Usability**

Triangulation is used to determine where different evidence sources converge and where they do not. A competitor feature is not treated as proof of user demand, and a survey response is not treated as market prevalence.

| Hypothesis | Survey | Secondary research | Usability / competitors | Triangulated conclusion |
| :---- | :---- | :---- | :---- | :---- |
| H1 — Job-fit decisions | 4/5 encounter imperfect-fit jobs; 3/5 apply anyway. | S5 shows information can influence job-search outcomes in a specific context. | Huntr/Teal provide matching/alignment capabilities. | Partially supported. Reframe from binary qualification toward whether an opportunity is worth the effort given fit. |
| H2 — Tailoring | Preparation time ranges widely; tailoring behaviour is inconsistent. | External evidence supports the importance of matching more than a dominant tailoring pain. | Huntr/Teal make tailoring a mature product category; FlowCV is less job-specific. | Partially supported. Investigate whether users need help deciding when tailoring is worth the effort. |
| H3 — Tracking | 2/5 do not track; others use simple alternatives. | Large-scale application activity supports the relevance of managing applications, but not the need for a dedicated tracker. | Huntr and Teal already provide strong tracking; manual alternatives also exist. | Inconclusive. Tracking may be an enabler rather than the core problem. |
| H4 — Feedback/actionability | 4/5 do not clearly know what works; 4/5 want to understand rejection; 4/5 change strategy based on results. | S5 supports the broader idea that relevant information can change outcomes in some contexts. | Teal already provides metrics, so dashboard novelty is not a gap; actionability remains unresolved. | Strongest emerging area. Refine toward interpreting outcomes and deciding what to do next. |
| H5 — Post-application | Waiting/rejection frustration appears, but follow-up mechanics are not consistently identified as a problem. | External evidence does not strongly establish follow-up management as an unmet need. | Huntr/Teal already support status/follow-up fields and workflows. | Inconclusive. Investigate uncertainty/control after applying rather than assuming reminders are the problem. |
| H6 — Multi-channel | All 5 use LinkedIn; several use other sources. | BLS 2025 confirms multiple active methods are common. | Teal and other tools already support search/capture. | Multi-channel behaviour supported; source-focus pain remains inconclusive. |
| H7 — CV creation | Little evidence that CV creation itself is the main frustration. | External evidence is about job-search/application context, not a specific CV-creation pain. | FlowCV, Huntr and Teal all provide mature CV creation. | Weakened. CV quality remains relevant; CV creation should not be central without contrary evidence. |

# **10 — Key User Insights**

**1\. Application decisions are not simply qualification checks.** The survey shows that people sometimes apply even when they do not fully meet requirements. This suggests that users evaluate trade-offs rather than applying a strict yes/no qualification rule.

**2\. Tailoring has a cost, but its perceived value varies.** Some respondents invest in tailoring while others reuse the same CV. This makes 'tailor faster' less universally compelling than understanding when additional effort is justified.

**3\. Tracking is a behaviour, not yet a validated core pain.** Users use memory, spreadsheets, job-board trackers or no tracking at all. Existing competitors already cover basic tracking.

**4\. Outcome uncertainty is more interesting than generic dashboard interest.** Most respondents do not clearly know what works best, while most also report changing strategy based on results. The unresolved value lies in interpretation and action.

**5\. Rejection is a specific information need.** Understanding why applications are rejected was selected by 4/5 respondents. This is a meaningful signal, but a product cannot automatically know the true cause of a rejection.

**6\. Multi-channel search is common, but source-management pain is not established.** Using multiple sources is observable; difficulty choosing which source deserves more effort is still a hypothesis.

**7\. Existing products are strong at collecting and generating job-search information.** FlowCV, Huntr and Teal collectively cover CV creation, tailoring, tracking and metrics. Feature aggregation alone is unlikely to be defensible differentiation.

**8\. The emerging opportunity is the connection between information and decisions.** The strongest cross-evidence pattern is not 'users need more data' but 'users may need help turning job-search data into confident next actions.'

# **11 — Emerging Hypothesis: Job-Search Decision Support**

NH1 — Active job seekers may struggle to turn information from their job search into confident decisions about which opportunities deserve effort and what they should change based on application outcomes.

Why this hypothesis emerged:

* H1 provides evidence of uncertainty around whether imperfect-fit jobs are worth applying to.  
* H2 shows that tailoring effort varies and may create a trade-off between time spent and expected benefit.  
* H4 provides the strongest direct signal: users often do not know what is working and want to understand rejection, while many already change strategy based on results.  
* H3/H5 and competitor research show that storing and tracking the underlying information is already relatively mature.  
* Therefore the possible gap may be less about collecting information and more about helping users interpret it and act on it.

Status: Emerging hypothesis, not a validated product direction. The next validation step should test pain severity, trust, data sufficiency, actionability and whether users would actually change behaviour based on such support.

# **12 — Product Implications**

* Do not position CareerPilot primarily as another CV builder. CV creation is a mature capability and is not emerging as the strongest user problem.  
* Do not assume a better tracker alone creates differentiation. Tracking is already well served and user behaviour varies.  
* Investigate decision support as the emerging opportunity: helping users decide which opportunities deserve effort and what to change after outcomes.  
* Treat analytics as a possible mechanism, not the value proposition. The product must prove that information leads to decisions and behaviour change.  
* Treat tailoring as a possible component of decision support rather than automatically as the core product.  
* Keep source attribution as a hypothesis until there is evidence that source-level information changes decisions.  
* Keep cover letters as Could Have / Future Release; current evidence is insufficient to elevate them.

# **13 — What Changed From the Initial Position**

| Initial position | Research evidence | Current position | Confidence |
| :---- | :---- | :---- | :---- |
| CareerPilot broadly combines a CV builder and application tracker. | FlowCV, Huntr and Teal already provide substantial CV and tracking capabilities. | A feature combination is not sufficient differentiation. | Medium |
| H1 job-fit evaluation was the highest-priority hypothesis. | Survey confirms imperfect-fit situations occur, but does not show that this is the dominant pain. | H1 remains relevant but is reframed around application-worth/effort decisions. | Medium |
| H2 tailoring was a major potential pain. | Effort is real but behaviour is highly variable; competitors already provide strong tailoring. | H2 remains partially supported; investigate value/effort trade-off. | Medium |
| H3 tracking was a high-priority problem. | Tracking behaviour varies; alternatives and competitors are strong. | Tracking is not currently a compelling core problem. | Medium |
| H4 analytics/performance visibility might differentiate. | 4/5 lack clear visibility and 4/5 change strategy based on results; Teal already has metrics. | Feedback/actionability is the strongest emerging area; analytics remains conditional. | Medium |
| H5 post-application management might be a major pain. | Waiting/rejection frustration exists, but mechanics of follow-up are not strongly validated. | Keep H5 open; investigate post-application uncertainty/control. | Low–Medium |
| H6 source focus could be important. | Multi-channel behaviour is confirmed, but source-choice pain is weak. | H6 remains inconclusive. | Low |
| H7 CV creation could be central. | Competitor maturity \+ limited direct pain signal. | H7 is weakened; CV quality remains relevant. | Medium–High |

# **14 — What Did Not Change**

* Active job seekers applying to multiple positions remain the working target segment, but the strongest sub-segment is not yet validated.  
* Application quality/tailoring remains relevant, but its priority depends on whether users value the effort relative to expected benefit.  
* Performance visibility remains worth investigating, but it is not a validated analytics feature decision.  
* CareerPilot's product direction remains open to further evidence.  
* Cover letters remain Could Have / Future Release.

# **15 — Hypothesis Validation Matrix**

| Hypothesis | Evidence | Status | Confidence | What changed? |
| :---- | :---- | :---- | :---- | :---- |
| H1 — Job-fit decisions | 4/5 encounter imperfect-fit jobs; 3/5 apply anyway; S5 supports information affecting outcomes in a specific context; matching exists in competitors. | Partially supported | Medium | Refine from 'am I qualified?' toward 'is this opportunity worth the effort given my fit?' |
| H2 — Application quality / tailoring | Preparation time varies; tailoring behaviour varies; Huntr/Teal provide strong tailoring; external evidence is broader than the exact pain claim. | Partially supported | Medium | Investigate whether users need help deciding when tailoring is worth the effort. |
| H3 — Application tracking | 2/5 do not track; others use memory/spreadsheet/job-board tracker; Huntr and Teal already provide substantial tracking. | Inconclusive | Medium | Downgraded as a core problem; retain as workflow/enabler if needed. |
| H4 — Feedback & actionability | 4/5 lack clear visibility; 4/5 want rejection understanding; 4/5 change strategy; S5 supports information-driven change in a specific context; Teal already has metrics. | Partially supported | Medium | Promote as strongest emerging research area; test actionability rather than dashboard appeal. |
| H5 — Post-application management | Waiting/rejection frustration appears; follow-up mechanics are not consistently painful; competitors cover status/follow-up. | Inconclusive | Low–Medium | Investigate uncertainty/control after applying rather than assuming reminders are the problem. |
| H6 — Multi-channel search / source focus | All 5 use LinkedIn; several use additional sources; BLS 2025 confirms multiple methods. | Weakly supported / Inconclusive | Low | Keep open; do not prioritise without stronger pain evidence. |
| H7 — CV creation | Little direct evidence of creation as the core pain; FlowCV/Huntr/Teal are mature CV solutions. | Weakened | Medium–High | Deprioritise as central problem; retain CV quality as contextual need. |
| NH1 — Job-search decision support | Cross-evidence convergence around fit, effort, outcome uncertainty and behaviour change. | Emerging hypothesis | Low–Medium | Validate whether turning job-search information into decisions is painful, trusted, actionable and sufficiently underserved. |

# 

# **16 — Decision Log**

| Decision | Previous position | Why | New position | Confidence | Impact |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Do not make CV creation the core problem. | CV builder was part of the initial concept. | Competitor maturity and weak direct pain signal. | H7 weakened; CV quality remains relevant. | Medium–High | Problem framing / MVP |
| Do not treat application tracking as the primary differentiator. | Tracking was a high-priority hypothesis. | Survey behaviour varies; competitors and manual alternatives already cover it. | Tracking becomes an enabling workflow rather than a validated core problem. | Medium | Product direction |
| Keep analytics as a hypothesis, not a feature commitment. | Analytics was considered a possible differentiator. | Teal already has metrics; survey supports visibility uncertainty but not dashboard value. | Focus on feedback → interpretation → action. | Medium | Research / MVP |
| Introduce job-search decision support as an emerging hypothesis. | H1, H2 and H4 were investigated separately. | Evidence converges around uncertainty about effort and outcomes. | Create NH1 for further validation. | Low–Medium | Problem framing |
| Do not prioritise multi-channel source management yet. | Source focus was a discovery hypothesis. | Multi-channel behaviour is supported; source-choice pain is weak. | H6 remains inconclusive. | Low | Research priority |
| Keep cover letters as Could Have / Future Release. | Cover letters were already considered later scope. | No sufficiently strong evidence to promote them. | No change. | Low–Medium | Scope |
| Treat self-conducted usability as product observation, not market validation. | Usability path was required by the capstone and CareerPilot does not yet exist. | Observed FlowCV/Huntr/Teal friction is directly useful for comparison and design, but not representative user evidence. | Keep observations clearly labelled. | High | Research integrity |

# **17 — Analytics / Feedback Decision Test**

Analytics remains conditional. The evidence currently supports some early stages of the chain, but not the full chain.

| Stage | Current evidence | Status |
| :---- | :---- | :---- |
| Visibility | 4/5 survey respondents do not clearly know which parts of their job search work best. | Directional support |
| Pain | The same survey pattern suggests uncertainty, but severity and consequences are not established. | Needs validation |
| Usefulness | Respondents want to understand rejection and outcomes. | Directional support |
| Actionability | 4/5 report changing strategy based on results, but we do not know whether better product feedback would improve those decisions. | Needs validation |
| Behaviour | Self-reported strategy changes exist. | Needs stronger behavioural evidence |
| Outcome | No evidence yet that analytics-driven changes improve job-search efficiency/effectiveness. | Unknown |

Conclusion: analytics should not be framed as a validated feature. The evidence supports researching feedback and actionability as a problem space.

# **18 — Cover Letters**

Status: Could Have / Future Release. The earlier recruiter feedback remains anecdotal evidence from one person and is not treated as a general market fact. Current research does not provide enough evidence to promote cover letters to the core problem or MVP.

# **19 — Target User & Persona Status**

The working target remains active job seekers applying to multiple positions. However, the evidence collected so far is not strong enough to define the final primary segment or persona with high confidence.

Still unresolved:

* At what application volume tracking or coordination becomes materially painful.  
* Whether the strongest problem is concentrated among unemployed job seekers, career changers, early-career candidates, experienced professionals or another segment.  
* Whether the strongest problem is pre-application decision-making, application preparation, post-application learning, or the connection between them.  
* Which users have enough application/outcome data to benefit from performance feedback.

# **20 — Current Refined Problem Hypothesis**

The initial broad problem statement was: active job seekers may struggle to make confident application decisions, efficiently prepare tailored applications, and keep track of what happens throughout the job-search process.

Research does not justify treating every part of that statement as equally important. The current refined problem hypothesis is narrower and provisional:

**Active job seekers may struggle to turn information from their job search into confident decisions about which opportunities deserve effort and what they should change based on application outcomes.**

This is an evidence-driven refinement, not a final validated problem statement. H1 and H2 provide supporting context; H4 provides the strongest current signal; H3/H5 and H7 have been weakened as central problem candidates.

# **21 — Remaining Open Questions**

* How painful and frequent is decision uncertainty compared with other job-search problems?  
* Which specific decisions are hardest: whether to apply, how much to tailor, where to search, whether to follow up, or what to change after rejection?  
* Do users trust product-generated explanations of rejection?  
* Can the product distinguish useful patterns from noise in a user's application data?  
* How much application/outcome data is needed before feedback becomes meaningful?  
* Would users change behaviour because of performance feedback, or simply find it interesting?  
* Which segment experiences the problem most strongly?  
* At what application volume does tracking become genuinely painful?  
* Does source-level performance information change where users search?  
* What outcomes matter most to users: applications, interviews, offers, response rate, time-to-response or another measure?  
* Would users pay for decision support, or is the perceived value insufficient?  
* Does the emerging decision-support problem remain important when compared with the convenience of existing tools?

# **22 — Research Limitations**

* Survey sample size is n=5 and is not statistically representative.  
* Survey respondents were a convenience sample; selection bias is possible.  
* Survey responses are self-reported and may differ from actual behaviour.  
* No qualitative user interviews were completed, so the research has less depth around motivations, context and emotional experience.  
* Think-aloud findings are based on direct exploration by the project owner rather than multiple independent usability participants.  
* Personal usability preferences are useful design input but should not be presented as market evidence.  
* Competitor observations describe the explored product experience and should not be interpreted as universal usability claims.  
* Secondary sources establish broader context but cannot prove that a specific CareerPilot solution will create demand.  
* The strongest emerging hypothesis still requires validation of pain severity, trust, data sufficiency, actionability and behavioural impact.

# **23 — Current Research Conclusion**

The research has materially changed the original CareerPilot concept. CV creation and basic application tracking are already well served by existing products and are not emerging as the strongest user problems in the primary survey. Tailoring and job-fit decisions remain relevant, but the evidence is stronger around the trade-off between application effort and expected value than around the need for another generic tailoring tool.

The strongest emerging signal is feedback and actionability. Most survey respondents do not clearly know what works best in their job search, most report changing strategy based on results, and most want to understand why they are rejected. At the same time, competitors already provide metrics, so simply adding a dashboard is not a meaningful differentiation.

The current research direction is therefore to investigate whether CareerPilot can help active job seekers turn their job-search information into confident decisions and useful next actions. This remains an emerging hypothesis. The evidence is not yet strong enough to claim a validated problem, final persona, or final MVP.

# **24 — External Source-to-Claim Map**

| Source | Claim supported | What it does NOT prove |
| :---- | :---- | :---- |
| S1 — BLS 2020 | Job-search activity can be measured across applications, interviews and offers in a representative survey context. | It does not prove tracking, analytics or tailoring causes better outcomes. |
| S2 — BLS 2025 | Jobseekers use multiple active search methods; the 2025 average was 1.8 methods among jobseekers in the table. | It does not prove multi-channel search is painful or that source comparison is valuable. |
| S3 — NBER Application Flows | Application activity can be high and uneven, with strong concentration on recently posted jobs in the studied technical-job platform. | It does not generalise to all jobseekers or prove tracking pain. |
| S4 — NBER Job Search / ALMP | Provides broader empirical context on job-search behaviour and labour-market policies. | It is not direct evidence for a specific CareerPilot feature. |
| S5 — NBER Field Experiment | Personalised information about alternative occupations/prospects can affect employment outcomes in a specific experimental context. | It does not prove users want CareerPilot or that rejection analytics would work. |
| S6 — NBER Social Networks | Information sharing about jobs can affect applicant and hiring outcomes in the studied social-network context. | It does not prove source tracking or multi-channel comparison is a user pain. |

