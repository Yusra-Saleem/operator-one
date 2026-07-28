from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Any, Dict, Type

class ToolMetadata(BaseModel):
    """Metadata describing a tool.

    * ``name`` – unique identifier used for selection.
    * ``description`` – human‑readable description.
    * ``version`` – optional version string.
    """
    name: str
    description: str
    version: str = "1.0"

class BaseTool(ABC):
    """Abstract base class for all tools.

    Concrete tools must provide ``metadata``, an ``InputModel`` and an ``OutputModel``
    and implement the :meth:`execute` method.
    """

    metadata: ToolMetadata
    InputModel: Type[BaseModel]
    OutputModel: Type[BaseModel]

    @abstractmethod
    async def execute(self, inputs: Any) -> Any:
        """Execute the tool with validated *inputs* and return the *output* model."""
        raise NotImplementedError

    def validate(self, data: Dict[str, Any]) -> Any:
        """Validate raw ``data`` against ``InputModel`` and return a model instance.
        Raises ``pydantic.ValidationError`` on failure.
        """
        return self.InputModel(**data)
