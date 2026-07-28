"""Application logging without secrets or request payload leakage."""

import logging
import sys

from app.core.config import settings


def setup_logger(name: str = "operation_one") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(settings.log_level.upper())
    logger.propagate = False
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
        ))
        logger.addHandler(handler)
    return logger


logger = setup_logger()
