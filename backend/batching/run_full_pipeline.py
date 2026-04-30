"""
RapidRoute - Full Pipeline
Runs Phase 1 (batching) then Phase 2 (route optimisation).
Must be run from any directory — resolves script paths automatically.
"""

import sys
import os
import subprocess
import argparse

# Fix Windows console encoding for emoji support
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Always resolve relative to this file's directory
HERE = os.path.dirname(os.path.abspath(__file__))

parser = argparse.ArgumentParser(description="Run RapidRoute pipeline")
parser.add_argument('--orders', type=str, help="Comma-separated list of order IDs to batch")
args = parser.parse_args()

def run(script: str, pass_args=False):
    """Run a script from the batching directory, streaming output live."""
    cmd = [sys.executable, script]
    if pass_args and args.orders:
        cmd.extend(["--orders", args.orders])
        
    result = subprocess.run(
        cmd,
        cwd=HERE,             # always run from batching/
        # No capture_output — output streams directly to terminal in real-time
    )
    if result.returncode != 0:
        print(f"\n❌ {script} exited with code {result.returncode}. Aborting pipeline.")
        sys.exit(result.returncode)


print("\n" + "="*70)
print("🚀 RapidRoute - Full Optimisation Pipeline")
print("="*70)

print("\nPhase 1: Intelligent Batching (K-Means + Capacity)")
print("-" * 70)
run("batch_orders.py", pass_args=True)

print("\nPhase 2: Route Optimisation (OR-Tools TSP)")
print("-" * 70)
run("optimize_routes.py", pass_args=False)

print("\n" + "="*70)
print("✅ Full pipeline completed successfully!")
print("="*70 + "\n")
