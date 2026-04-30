import asyncio
import logging
from pathlib import Path
from qdrant_client import QdrantClient
from utils.config import get_settings
from rag.ingest import ingest_file

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed():
    settings = get_settings()
    client = QdrantClient(url=settings.qdrant_url, api_key=settings.qdrant_api_key)
    collection_name = settings.qdrant_collection
    
    # Ensure collection exists, or check for existing files
    existing_paths = set()
    try:
        # Fetch some points to check what is already there. For a true check, we'd need to scroll
        # or use scroll API to get all unique local_paths. We'll do a simple scroll.
        records, next_page = client.scroll(
            collection_name=collection_name,
            limit=10000,
            with_payload=["local_path"],
            with_vectors=False
        )
        for record in records:
            if record.payload and "local_path" in record.payload:
                existing_paths.add(record.payload["local_path"])
    except Exception as e:
        logger.warning(f"Could not fetch existing records (collection might not exist yet): {e}")

    data_dir = Path("rag/data")
    if not data_dir.exists():
        logger.info("No rag/data directory found. Nothing to seed.")
        return

    count = 0
    for file_path in data_dir.rglob("*"):
        if file_path.is_file():
            # simple check if file path is already in Qdrant
            if str(file_path) in existing_paths:
                logger.info(f"Skipping {file_path}, already in Qdrant.")
                continue

            logger.info(f"Ingesting {file_path}...")
            try:
                ingest_file(str(file_path), file_path.name)
                count += 1
            except Exception as e:
                logger.error(f"Failed to ingest {file_path}: {e}")

    logger.info(f"Seeding complete. Ingested {count} new files.")

if __name__ == "__main__":
    seed()
