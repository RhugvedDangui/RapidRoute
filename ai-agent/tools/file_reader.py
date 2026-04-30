import logging
from langchain_core.tools import tool
from utils.config import get_settings

logger = logging.getLogger(__name__)

@tool
def read_file(file_id: str) -> str:
    """
    Retrieve the parsed text content of a previously ingested file from Redis.

    Parameters
    ----------
    file_id:
        The file ID returned by the ``POST /ingest`` endpoint.

    Returns
    -------
    str
        The stored text content of the file, or an error message.
    """
    try:
        from upstash_redis import Redis

        settings = get_settings()
        redis = Redis(
            url=settings.upstash_redis_url,
            token=settings.upstash_redis_token,
        )
        key = f"file:{file_id}:content"
        content: str | None = redis.get(key)
        if content is None:
            return f"read_file: File '{file_id}' not found. It may have expired or never been ingested."
        return f"read_file content for '{file_id}':\n{content[:3000]}"
    except Exception as exc:
        logger.exception("read_file failed")
        return f"read_file error: {exc}"
