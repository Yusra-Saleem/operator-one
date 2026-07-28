# Operator One — Full System Architecture Blueprint

## Executive Overview
**Operator One** is a commercially deployable, production-grade **Voice-First Enterprise AI Business Operations Platform**. It combines real-time speech processing, OpenAI Agents SDK multi-agent orchestration, explainable AI risk scoring, standardized enterprise system connectors, and an executive Next.js command dashboard.

---

## Architectural Diagram

```mermaid
graph TD
    Client[Next.js Light-Theme Frontend] <--> SupabaseAuth[Supabase Authentication JWT]
    Client <--> VoiceHUD[Voice Interaction Hub / Speech-to-Text]
    Client <--> REST[FastAPI Production REST API]

    REST <--> AuthMiddleware[Supabase Auth & Security Middleware]
    REST <--> DB[Supabase PostgreSQL Database Pool]

    REST <--> DecisionEngine[Explainable AI Decision Engine]
    DecisionEngine --> RiskScoring[Risk Scoring & Bottleneck Analytics]
    DecisionEngine --> Recommendations[Predictive Recommendations Generator]

    REST <--> AgentSDK[OpenAI Agents SDK Multi-Agent System]
    AgentSDK --> Coordinator[CoordinatorAgent Router]
    Coordinator --> DomainAgents[Specialized Agents: Executive, Sales, Inventory, Reporting]
    AgentSDK --> ToolRegistry[Domain Tool Registry]

    ToolRegistry --> Connectors[Enterprise Integration Connectors]
    Connectors --> Salesforce[Salesforce CRM API]
    Connectors --> NetSuite[NetSuite ERP API]
    Connectors --> QuickBooks[QuickBooks Financials API]
    Connectors --> Webhooks[Inbound Event Webhooks]
```

---

## Technical Stack Summary

| Layer | Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14, React 18, Tailwind CSS (Light Theme + Purple Accent), TypeScript | Executive Command Hub, Dashboard Widgets, Voice Bar, Auth Modal, Integrations & Risk Hub |
| **Backend** | FastAPI, Python 3.11, Pydantic v2, Uvicorn | Production REST API, CORS security, Exception handling, Auth middleware, Logging |
| **Auth & Database** | Supabase Auth (JWT), Supabase PostgreSQL, SQLAlchemy | User identity, session persistence, normalized database schemas, pool management |
| **AI Orchestration** | OpenAI Agents SDK, Python Multi-Agent Framework | Intent analysis, autonomous planning, tool registry, multi-agent collaboration |
| **Integrations** | `BaseConnector` Abstraction (Salesforce, NetSuite, QuickBooks, Webhooks) | Cross-system data synchronization, health testing, inbound webhook processing |
| **Decision Engine** | Explainable Risk Engine (`backend/app/engine/`) | Live operational risk index (0-100), bottleneck detection, predictive recommendations |
