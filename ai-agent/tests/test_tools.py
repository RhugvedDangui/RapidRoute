import pytest
from tools.calculator import calculator
from tools.wikipedia import wikipedia_search

def test_calculator():
    # Simple math
    result = calculator.invoke("2 + 2")
    assert "4" in result

def test_wikipedia():
    # Mocking wikipedia might be better, but testing the schema here.
    result = wikipedia_search.invoke("Python (programming language)")
    assert isinstance(result, str)
    if "wikipedia_search error" not in result:
        assert "wikipedia_search result for" in result
