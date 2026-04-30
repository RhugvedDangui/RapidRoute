from rag.retriever import retrieve_chunks

print("Testing retriever...")
results = retrieve_chunks('Tesla Q3 2025 revenue profit', top_k=3)
print(f'\nFound {len(results)} results:\n')

for i, r in enumerate(results, 1):
    print(f"{i}. Score: {r['score']:.4f}")
    print(f"   Source: {r['source']}")
    print(f"   Text: {r['text'][:150]}...")
    print()
