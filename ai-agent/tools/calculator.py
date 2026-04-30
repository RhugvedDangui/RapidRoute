import logging
import numexpr
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

@tool
def calculator(expression: str) -> str:
    """
    Evaluate a mathematical expression safely using numexpr.

    Parameters
    ----------
    expression:
        A mathematical expression string (e.g. ``"2 ** 10 + sqrt(144)"``).
        Supports standard arithmetic, exponents, trig functions, sqrt, log, etc.

    Returns
    -------
    str
        The numeric result as a string, or an error message.
    """
    try:
        result = numexpr.evaluate(expression)
        return f"calculator result: {result}"
    except Exception as exc:
        logger.exception("calculator failed for expression: %s", expression)
        return f"calculator error: {exc}"
