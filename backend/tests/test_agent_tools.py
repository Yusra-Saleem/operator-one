"""Unit tests for AI Agent Tools."""

import pytest
from app.agent.tools.calculator import CalculatorTool
from app.agent.tools.dispatch_tool import DispatchTool
from app.agent.tools.sales_tool import SalesAnalyticsTool
from app.agent.tools.inventory_tool import InventoryManagementTool


@pytest.mark.asyncio
async def test_calculator_tool():
    tool = CalculatorTool()
    res = await tool.execute(CalculatorTool.InputModel(expression="2500 * 12"))
    assert res.result == 30000.0


def test_dispatch_tool_run():
    tool = DispatchTool()
    res = tool.run(
        channel="email",
        document_type="invoice",
        recipient_name="ACME",
        recipient_contact="acme@example.com",
        amount=500.0,
    )
    assert res["status"] == "success"
    assert res["channel"] == "email"


@pytest.mark.asyncio
async def test_sales_tool_pipeline():
    tool = SalesAnalyticsTool()
    res = await tool.execute(SalesAnalyticsTool.InputModel(action="pipeline_summary"))
    assert res.success is True
    assert "total_pipeline_value" in res.result


@pytest.mark.asyncio
async def test_inventory_tool_health():
    tool = InventoryManagementTool()
    res = await tool.execute(InventoryManagementTool.InputModel(action="health"))
    assert res.success is True
    assert "health_score" in res.result
