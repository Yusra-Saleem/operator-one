# Explainable AI Decision Engine Architecture

## Overview
The **AI Decision Engine** (`backend/app/engine/decision_engine.py`) continuously evaluates real-time business telemetry across sales, inventory, supply chain, and financials to generate explainable risk scores and confidence-weighted recommendations.

---

## Risk Scoring & Recommendation Pipeline

1. **Telemetry Ingestion**: Scans active sales deals, warehouse inventory items, and operational alerts.
2. **Risk Factor Evaluation**: Calculates impact scores (0 to 100) based on lead-time buffers, deal stagnation durations, and stock-out thresholds.
3. **Predictive Recommendation Generation**: Output structured `PredictiveRecommendation` objects with:
   - `confidence_score` (e.g., 0.96)
   - `impact_estimate` (e.g., "$42,000 revenue impact prevented")
   - `explanation` (Data-grounded rationale)
   - `suggested_action` (Executable workflow command)

---

## REST & Agent Integration

- **REST API**: `/api/v1/decision/insights`, `/api/v1/decision/risks`, `/api/v1/decision/recommendations`
- **Agent Tool**: `decision_engine_tool` registered for autonomous multi-agent invocation.
