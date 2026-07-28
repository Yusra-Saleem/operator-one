# Multi-Agent Collaboration System Specification

## Overview
Operator One employs a modular multi-agent orchestration architecture powered by the OpenAI Agents SDK and a domain tool registry.

## Agent Roster

| Agent Name | Primary Responsibility | Associated Tools |
| :--- | :--- | :--- |
| **CoordinatorAgent** | Intent classification & multi-agent tool delegation | IntentAnalyzer, Planner |
| **ExecutiveAgent** | KPI analysis, operational risk detection & executive briefings | `executive_reporting_tool` |
| **SalesAgent** | Deal tracking, revenue pipeline insights & conversion analysis | `sales_analytics_tool` |
| **InventoryAgent** | Stock monitoring, reorder triggers & supply chain advice | `inventory_management_tool` |
| **ReportingAgent** | Structured business summaries & executive reports generation | `executive_reporting_tool` |

---

## Tool Registry Specifications

All tools inherit from `BaseTool` and validate inputs/outputs using Pydantic:

1. **`sales_analytics_tool`**
   - Actions: `pipeline_summary`, `list_deals`, `create_deal`
2. **`inventory_management_tool`**
   - Actions: `health`, `list_stock`, `reorder`
3. **`executive_reporting_tool`**
   - Actions: `all`, `sales`, `inventory`, `operations`
4. **`workflow_execution_tool`**
   - Actions: `trigger_workflow`
