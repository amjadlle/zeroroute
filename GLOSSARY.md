# ZeroRoute

ZeroRoute is an AI gateway plus an embeddable customer-support chatbot. Customers add knowledge, customise their chatbot, and embed it on their website. These are the approved user-facing words; use them in all console copy, emails and docs.

## People and places

**Customer**:
A person or company with a ZeroRoute account who runs a chatbot or calls the gateway.
_Avoid_: Subscriber, tenant, user (in copy), bot (for the account)

**Visitor**:
A person chatting with a customer's chatbot on the customer's website.
_Avoid_: End user, lead, guest

**Admin**:
The person who operates ZeroRoute itself.
_Avoid_: Master, owner, root, superuser

**User console**:
The part of ZeroRoute where a customer manages their chatbot, knowledge, install, usage and billing.
_Avoid_: Subscriber console, dashboard, workspace, telemetry

**Admin console**:
The part of ZeroRoute where the admin manages providers, customers and request logs.
_Avoid_: Master admin, master session, control room

## Account and access

**API key**:
The secret a customer uses to call the gateway from their own code.
_Avoid_: Master gateway key, bearer token, secret key, router key

**Bot ID**:
The public identifier that tells the embed snippet which chatbot to load.
_Avoid_: Widget ID, bot key, chatbot token

**Allowed domains**:
The websites where a customer's chatbot is permitted to load.
_Avoid_: Whitelist, anti-hijack security, domain lock, origins

**Embed snippet**:
The one-line script tag a customer pastes into their website to show their chatbot.
_Avoid_: Widget code, 1-line install, script injection

## Chatbot

**Chatbot**:
The support assistant a customer embeds on their website.
_Avoid_: Widget, bot (in headings), agent, AI assistant

**Chatbot settings**:
Everything that shapes how the chatbot looks and talks: name, greeting, instructions, suggested questions, brand colour and logo.
_Avoid_: Persona & prompts, configuration, widget settings

**Name**:
What the chatbot calls itself in its header.
_Avoid_: Bot title, display name

**Greeting**:
The first message a visitor sees when the chat opens.
_Avoid_: Welcome message, intro, opener

**Instructions**:
Free-text guidance telling the chatbot how to behave and what tone to use.
_Avoid_: Persona, system prompt, role, tone (as a separate setting)

**Suggested questions**:
Clickable starter questions shown to a visitor before they type.
_Avoid_: Prompts, quick replies, starter prompts

**Brand colour**:
The accent colour of the chatbot button and header.
_Avoid_: Theme colour, accent, primary colour

**Logo**:
The image shown on the chatbot button and header.
_Avoid_: Avatar, icon, bot image

**Visitor conversation**:
One chat between a visitor and a customer's chatbot.
_Avoid_: Session, thread, chat log, transcript

## Knowledge

**Knowledge**:
The content a customer gives their chatbot so it can answer questions about their business.
_Avoid_: Knowledge base, RAG, semantic knowledge base, documents, training data

**Source**:
One item of knowledge, named by where it came from.
_Avoid_: Document, doc, chunk, entry

**File**:
A source uploaded from the customer's computer.
_Avoid_: file_upload, document upload, attachment

**Website**:
A source read from a public web page or a text file at a web address.
_Avoid_: web_crawl, web_website, web_raw_text, URL scrape, crawler

**Text**:
A source the customer typed or pasted in.
_Avoid_: manual_text, raw text, snippet, note

**Google Docs**:
A source read from a shared Google Doc.
_Avoid_: web_google_docs, GDocs, live sync

**GitHub**:
A source read from a file in a GitHub repository.
_Avoid_: web_github_raw, raw GitHub, repo crawl

**Notion**:
A source read from a public Notion page.
_Avoid_: web_notion, Notion sync

## Plans and usage

**Plan**:
What a customer pays for, which sets their monthly request limit and how many allowed domains they get. Either **Free** or **Pro**.
_Avoid_: Tier, subscription (as the noun for the plan), quota, Free Forever, Active Pro

**Usage**:
How many requests a customer has made this month against their plan's limit.
_Avoid_: Quota, telemetry, consumption, credits

**Request**:
One question sent to the chatbot or one call to the gateway; the unit usage is counted in.
_Avoid_: Inference, call, message, token (as the unit)

**Subscription status**:
Whether a Pro customer's payments are working: **Active**, **Payment issue** or **Canceled**.
_Avoid_: Paused, on hold, past due, expired

## Gateway

**Gateway**:
The OpenAI-compatible endpoint that answers requests by routing them to providers.
_Avoid_: Router, multi-cloud pool, proxy, racing clouds

**Provider**:
An AI company whose models the gateway can send requests to.
_Avoid_: Cloud, upstream, vendor, backend

**Model**:
A specific AI model offered by a provider.
_Avoid_: Engine, LLM (in copy)

**Fallback models**:
The ordered list of models a provider tries when the first one fails.
_Avoid_: Intra-provider model fallback chain, failover chain, model chain

**Request log**:
The admin's record of each request: who sent it, which provider answered, how long it took and whether it succeeded.
_Avoid_: Logs & failovers, telemetry, audit trail, 2xx/Err
