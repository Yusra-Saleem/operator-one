from typing import Dict, Type
from .base import BaseTool

_tool_registry: Dict[str, Type[BaseTool]] = {}

def register_tool(cls: Type[BaseTool]):
    """Class decorator to register a tool.

    The tool class must define a ``metadata`` attribute of type ``ToolMetadata``.
    The decorator stores the class in the global ``_tool_registry`` using the
    ``metadata.name`` as the key.
    """
    name = getattr(cls, "metadata").name
    _tool_registry[name] = cls
    return cls

def get_tool(name: str) -> Type[BaseTool]:
    """Retrieve a registered tool class by *name*.

    Raises ``KeyError`` if the tool is not found.
    """
    return _tool_registry[name]

def list_tools() -> Dict[str, Type[BaseTool]]:
    """Return a copy of the internal tool registry mapping names to classes."""
    return dict(_tool_registry)
