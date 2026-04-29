"""
RapidRoute - Full Pipeline
Runs both batching (Phase 1) and route optimization (Phase 2)
"""

import sys
import subprocess

# Fix Windows console encoding for emoji support
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

print("\n" + "="*70)
print("🚀 RapidRoute - Full Optimization Pipeline")
print("="*70 + "\n")

print("Phase 1: Intelligent Batching (K-Means)")
print("-" * 70)

# Run batching
try:
    result = subprocess.run(
        [sys.executable, "batch_orders.py"],
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace',
        check=True
    )
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"❌ Batching failed: {e}")
    if e.stdout:
        print(e.stdout)
    if e.stderr:
        print(e.stderr)
    sys.exit(1)

print("\n" + "="*70)
print("Phase 2: Route Optimization (OR-Tools TSP)")
print("-" * 70)

# Run route optimization
try:
    result = subprocess.run(
        [sys.executable, "optimize_routes.py"],
        capture_output=True,
        text=True,
        encoding='utf-8',
        errors='replace',
        check=True
    )
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"❌ Route optimization failed: {e}")
    if e.stdout:
        print(e.stdout)
    if e.stderr:
        print(e.stderr)
    sys.exit(1)

print("\n" + "="*70)
print("✅ Full pipeline completed successfully!")
print("="*70 + "\n")
