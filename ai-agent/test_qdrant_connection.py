"""
Test Qdrant connection with different methods to diagnose DNS issue.
"""

import socket
from qdrant_client import QdrantClient

# Test 1: DNS resolution
print("=" * 80)
print("TEST 1: DNS Resolution")
print("=" * 80)

hostname = "fe27e53d-7f22-4c7f-8a14-e64c9b4ada5e.eu-west-1-0.aws.cloud.qdrant.io"
try:
    ip = socket.gethostbyname(hostname)
    print(f"✅ DNS resolved: {hostname} -> {ip}")
except socket.gaierror as e:
    print(f"❌ DNS resolution failed: {e}")
    print("\nTrying alternative DNS resolution...")
    try:
        result = socket.getaddrinfo(hostname, 443, socket.AF_INET)
        ip = result[0][4][0]
        print(f"✅ Alternative DNS resolved: {hostname} -> {ip}")
    except Exception as e2:
        print(f"❌ Alternative DNS also failed: {e2}")

# Test 2: Direct connection with URL
print("\n" + "=" * 80)
print("TEST 2: Qdrant Client Connection (with URL)")
print("=" * 80)

url = "https://fe27e53d-7f22-4c7f-8a14-e64c9b4ada5e.eu-west-1-0.aws.cloud.qdrant.io"
api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Mzc0OWNlNjktNGVhNi00ZmEyLWE2YTMtNDQ4NTI4ODFlMTY4In0.zB1O-UiKmf3mCueZA--hk96QRR1PNgFgY2YoCfrCZe0"

try:
    client = QdrantClient(url=url, api_key=api_key, timeout=10)
    collections = client.get_collections()
    print(f"✅ Connected successfully!")
    print(f"   Collections: {[c.name for c in collections.collections]}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print(f"   Error type: {type(e).__name__}")

# Test 3: Connection with prefer_grpc=False
print("\n" + "=" * 80)
print("TEST 3: Qdrant Client Connection (prefer_grpc=False)")
print("=" * 80)

try:
    client = QdrantClient(
        url=url, 
        api_key=api_key, 
        timeout=10,
        prefer_grpc=False  # Force HTTP instead of gRPC
    )
    collections = client.get_collections()
    print(f"✅ Connected successfully with HTTP!")
    print(f"   Collections: {[c.name for c in collections.collections]}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print(f"   Error type: {type(e).__name__}")

# Test 4: Check if collection exists
print("\n" + "=" * 80)
print("TEST 4: Check 'agent_knowledge' Collection")
print("=" * 80)

try:
    client = QdrantClient(url=url, api_key=api_key, prefer_grpc=False, timeout=10)
    collection_info = client.get_collection("agent_knowledge")
    print(f"✅ Collection 'agent_knowledge' exists!")
    print(f"   Points count: {collection_info.points_count}")
    print(f"   Vector size: {collection_info.config.params.vectors.size}")
except Exception as e:
    print(f"❌ Failed to access collection: {e}")
    print(f"   Error type: {type(e).__name__}")

print("\n" + "=" * 80)
print("DIAGNOSTIC COMPLETE")
print("=" * 80)
