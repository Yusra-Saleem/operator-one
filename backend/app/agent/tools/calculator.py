"""Restricted arithmetic tool with no Python evaluation escape hatch."""

import ast
import operator
from typing import Any

from pydantic import BaseModel, Field

from .base import BaseTool, ToolMetadata
from .registry import register_tool


_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _evaluate(node: ast.AST) -> float | int:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _OPERATORS:
        left = _evaluate(node.left)
        right = _evaluate(node.right)
        if abs(left) > 1e12 or abs(right) > 1e12:
            raise ValueError("Numbers are outside the safe calculation range")
        return _OPERATORS[type(node.op)](left, right)
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPERATORS:
        return _OPERATORS[type(node.op)](_evaluate(node.operand))
    raise ValueError("Only basic arithmetic expressions are allowed")


def safe_calculate(expression: str) -> float | int:
    tree = ast.parse(expression, mode="eval")
    result = _evaluate(tree.body)
    if abs(result) > 1e15:
        raise ValueError("Calculation result is outside the safe range")
    return result


@register_tool
class CalculatorTool(BaseTool):
    metadata = ToolMetadata(name="calculator", description="Evaluate a basic arithmetic expression.")

    class InputModel(BaseModel):
        expression: str = Field(..., min_length=1, max_length=500)

    class OutputModel(BaseModel):
        result: Any
        expression: str

    async def execute(self, inputs: InputModel) -> OutputModel:
        try:
            result = safe_calculate(inputs.expression)
        except Exception as exc:
            result = f"Calculation rejected: {exc}"
        return self.OutputModel(result=result, expression=inputs.expression)
