# Business Process Automation Engine Specification

## Overview
Operator One's **Business Process Automation Engine** enables cross-system multi-step workflow execution, scheduled cron jobs, conditional execution paths, and human-in-the-loop sign-off gates.

## Workflow Execution Flow

```mermaid
sequenceDiagram
    participant User as Executive User
    participant Agent as CoordinatorAgent
    participant Engine as WorkflowEngine
    participant Connector as Enterprise Connector

    User->>Agent: "Trigger automated reorder workflow"
    Agent->>Engine: Create WorkflowInstance (WF-101)
    Engine->>Connector: Reorder stock via NetSuite ERP
    Connector-->>Engine: 50 units confirmed
    Engine-->>Agent: Step complete (65%)
    Agent-->>User: "Workflow active: 50 units ordered"
```

## Supported Workflows
- **Automated Inventory Reorder**: Triggered when stock drops below threshold.
- **Deal Stagnation Engagement**: Triggers AI proposal refresh for inactive leads >4 days.
- **Compliance & Asset Audit Sign-off**: Requires human-in-the-loop executive approval gate.
