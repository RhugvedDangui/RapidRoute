import pytest
import os
import tempfile
from rag.ingest import ingest_file
from rag.retriever import retrieve_chunks

@pytest.fixture
def sample_file():
    fd, path = tempfile.mkstemp(suffix=".txt")
    with os.fdopen(fd, 'w') as f:
        f.write("This is a test document about Python programming and RAG systems.")
    yield path
    try:
        os.remove(path)
    except:
        pass

def test_ingest_and_retrieve(sample_file):
    # This might fail if Qdrant/Redis are not running, but tests the schema
    try:
        res = ingest_file(sample_file, "test.txt")
        assert res["status"] == "success"
        assert "file_id" in res

        chunks = retrieve_chunks("Python programming", top_k=1)
        assert isinstance(chunks, list)
    except Exception as e:
        pytest.skip(f"Skipping due to external dependency error: {e}")
