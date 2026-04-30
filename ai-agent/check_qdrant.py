"""
Diagnostic script to check Qdrant collection and test retrieval.
Run this to verify documents are properly stored and searchable.
"""

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer
from utils.config import get_settings

def main():
    settings = get_settings()
    
    print("=" * 80)
    print("QDRANT DIAGNOSTIC CHECK")
    print("=" * 80)
    
    # Connect to Qdrant (with prefer_grpc=False for Windows compatibility)
    client = QdrantClient(
        url=settings.qdrant_url, 
        api_key=settings.qdrant_api_key,
        prefer_grpc=False,  # Force HTTP instead of gRPC
        timeout=10
    )
    
    # Check collection
    try:
        collection_info = client.get_collection(settings.qdrant_collection)
        print(f"\n✅ Collection: {settings.qdrant_collection}")
        print(f"   Points count: {collection_info.points_count}")
        print(f"   Vector size: {collection_info.config.params.vectors.size}")
        print(f"   Distance: {collection_info.config.params.vectors.distance}")
        
        if collection_info.points_count == 0:
            print("\n⚠️  WARNING: Collection is EMPTY! No documents have been uploaded.")
            return
            
    except Exception as e:
        print(f"\n❌ Error accessing collection: {e}")
        return
    
    # Sample some points
    print("\n" + "=" * 80)
    print("SAMPLE DOCUMENTS IN COLLECTION")
    print("=" * 80)
    
    try:
        # Scroll through first 5 points
        points, _ = client.scroll(
            collection_name=settings.qdrant_collection,
            limit=5,
            with_payload=True,
            with_vectors=False,
        )
        
        for i, point in enumerate(points, 1):
            payload = point.payload or {}
            print(f"\n📄 Document {i}:")
            print(f"   ID: {point.id}")
            print(f"   Source: {payload.get('source', 'unknown')}")
            print(f"   File ID: {payload.get('file_id', 'unknown')}")
            print(f"   Chunk index: {payload.get('chunk_index', 0)}")
            print(f"   Text preview: {payload.get('text', '')[:150]}...")
            
    except Exception as e:
        print(f"\n❌ Error scrolling collection: {e}")
        return
    
    # Test search
    print("\n" + "=" * 80)
    print("TEST SEARCH: 'Tesla Q3 revenue'")
    print("=" * 80)
    
    try:
        embedder = SentenceTransformer(settings.embedding_model)
        query = "Tesla Q3 revenue"
        query_vector = embedder.encode([query], show_progress_bar=False)[0].tolist()
        
        # Use query_points instead of search for newer qdrant-client versions
        from qdrant_client.models import SearchRequest
        
        results = client.query_points(
            collection_name=settings.qdrant_collection,
            query=query_vector,
            limit=3,
            with_payload=True,
        ).points
        
        if not results:
            print("\n⚠️  No results found for test query!")
        else:
            print(f"\n✅ Found {len(results)} results:")
            for i, hit in enumerate(results, 1):
                payload = hit.payload or {}
                print(f"\n   Result {i}:")
                print(f"   Score: {hit.score:.4f}")
                print(f"   Source: {payload.get('source', 'unknown')}")
                print(f"   Text: {payload.get('text', '')[:200]}...")
                
    except Exception as e:
        print(f"\n❌ Error during test search: {e}")
        return
    
    print("\n" + "=" * 80)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
