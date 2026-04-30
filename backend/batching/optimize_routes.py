"""
RapidRoute - Phase 2: Route Optimization
Google OR-Tools TSP solver — runs AFTER batch_orders.py

For each batch:
  1. Fetch batched orders grouped by batch_id
  2. Fetch hub from sellers table (fallback: hardcoded Goa coords)
  3. Fetch vehicle for the batch (for cost_per_km)
  4. Build full distance matrix: [Hub, Stop1, Stop2, ...]
  5. Solve TSP with OR-Tools PATH_CHEAPEST_ARC
  6. Save optimised route to routes table (upsert)
  7. Update batch: estimated_distance, time, cost, carbon_saved
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import requests
from datetime import datetime
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from dotenv import load_dotenv

# ── Windows UTF-8 fix ──────────────────────────────────────────────
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

# Fallback hub (used only if sellers table has no warehouse coords)
FALLBACK_HUB = (15.5946557, 73.7948836)

AVG_SPEED_KMH = 30
STOP_TIME_MIN  = 5
CO2_PER_KM     = 0.21       # kg CO₂ / km
DEFAULT_CPK    = 15.0       # ₹ / km fallback


# ══════════════════════════════════════════════════════════════════
# GEOMETRY
# ══════════════════════════════════════════════════════════════════

def haversine(lat1, lng1, lat2, lng2) -> float:
    from math import radians, sin, cos, sqrt, atan2
    R = 6371.0
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat, dlng = lat2 - lat1, lng2 - lng1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlng/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))


def build_distance_matrix(locations: list) -> list:
    """locations[0] = hub, locations[1..n] = orders."""
    n = len(locations)
    dm = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                dm[i][j] = haversine(
                    locations[i][0], locations[i][1],
                    locations[j][0], locations[j][1],
                )
    return dm


# ══════════════════════════════════════════════════════════════════
# OR-TOOLS TSP SOLVER
# ══════════════════════════════════════════════════════════════════

def solve_tsp(distance_matrix: list) -> list | None:
    """
    Solve TSP with OR-Tools PATH_CHEAPEST_ARC.
    Returns full node sequence including hub at start AND end,
    e.g. [0, 3, 1, 2, 0].
    Returns None on failure.
    """
    manager = pywrapcp.RoutingIndexManager(len(distance_matrix), 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_cb(from_idx, to_idx):
        # OR-Tools needs integers; multiply km by 1000 for mm precision
        return int(distance_matrix[manager.IndexToNode(from_idx)]
                                  [manager.IndexToNode(to_idx)] * 1000)

    cb_idx = routing.RegisterTransitCallback(distance_cb)
    routing.SetArcCostEvaluatorOfAllVehicles(cb_idx)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    # Also allow local search improvements
    params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    params.time_limit.seconds = 5  # max solve time per batch

    solution = routing.SolveWithParameters(params)
    if not solution:
        return None

    idx, seq = routing.Start(0), []
    while not routing.IsEnd(idx):
        seq.append(manager.IndexToNode(idx))
        idx = solution.Value(routing.NextVar(idx))
    seq.append(0)  # return to hub
    return seq


# ══════════════════════════════════════════════════════════════════
# DATA FETCHING
# ══════════════════════════════════════════════════════════════════

def fetch_hub() -> tuple:
    """Return (lat, lng) of warehouse hub from sellers table."""
    try:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/sellers"
            "?select=warehouse_lat,warehouse_lng&limit=1",
            headers=HEADERS,
        )
        r.raise_for_status()
        sellers = r.json()
        if sellers and sellers[0].get("warehouse_lat") and sellers[0].get("warehouse_lng"):
            hub = (sellers[0]["warehouse_lat"], sellers[0]["warehouse_lng"])
            print(f"🏭 Hub: {hub}")
            return hub
    except Exception as e:
        print(f"⚠️  Hub fetch failed ({e}) — using fallback hub")
    print(f"📍 Fallback hub: {FALLBACK_HUB}")
    return FALLBACK_HUB


def fetch_batched_orders() -> dict:
    """Returns {batch_id: [order_dict, ...]}"""
    print("📦 Fetching batched orders...")
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/orders?status=eq.batched&select=*",
        headers=HEADERS,
    )
    r.raise_for_status()
    data = r.json()
    if not data:
        print("⚠️  No batched orders found.")
        return {}
    df = pd.DataFrame(data)
    batches = {bid: grp.to_dict("records") for bid, grp in df.groupby("batch_id")}
    print(f"✅ {len(batches)} batches | {len(df)} orders")
    return batches


def fetch_batch_vehicle(batch_id: str) -> dict | None:
    """Fetch the vehicle assigned to a batch (for cost_per_km)."""
    try:
        # Get vehicle_id from batch
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/batches?id=eq.{batch_id}&select=vehicle_id",
            headers=HEADERS,
        )
        r.raise_for_status()
        rows = r.json()
        if not rows or not rows[0].get("vehicle_id"):
            return None
        vid = rows[0]["vehicle_id"]

        # Fetch vehicle details
        r2 = requests.get(
            f"{SUPABASE_URL}/rest/v1/vehicles?id=eq.{vid}&select=*",
            headers=HEADERS,
        )
        r2.raise_for_status()
        vehicles = r2.json()
        return vehicles[0] if vehicles else None
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════
# ROUTE OPTIMIZATION PER BATCH
# ══════════════════════════════════════════════════════════════════

def optimise_batch(batch_id: str, orders: list, hub: tuple) -> dict | None:
    print(f"\n🔄 Optimising {batch_id} ({len(orders)} orders)...")

    # locations[0] = hub, locations[1..n] = order stops
    locations = [hub] + [(o["lat"], o["lng"]) for o in orders]
    order_ids = [o["id"] for o in orders]

    dm = build_distance_matrix(locations)

    # ── Before distance: individual hub→stop→hub per order ────────
    before_km = sum(dm[0][i] * 2 for i in range(1, len(locations)))

    # ── Solve TSP ──────────────────────────────────────────────────
    sequence = solve_tsp(dm)
    if not sequence:
        print(f"  ❌ TSP solver failed for {batch_id}")
        return None

    # ── After distance: full tour hub→...→hub ─────────────────────
    after_km = sum(dm[sequence[i]][sequence[i+1]] for i in range(len(sequence)-1))
    after_km = round(after_km, 3)

    # ── Fetch vehicle for cost_per_km ─────────────────────────────
    vehicle    = fetch_batch_vehicle(batch_id)
    cpm        = float(vehicle["cost_per_km"]) if vehicle else DEFAULT_CPK

    # ── Metrics ───────────────────────────────────────────────────
    distance_saved   = round(before_km - after_km, 3)
    cost_saved       = round(distance_saved * cpm, 2)
    pct_saved        = round((distance_saved / before_km) * 100, 1) if before_km > 0 else 0
    carbon_saved     = round(distance_saved * CO2_PER_KM, 3)
    estimated_cost   = round(after_km * cpm, 2)
    estimated_time   = int((after_km / AVG_SPEED_KMH) * 60 + len(orders) * STOP_TIME_MIN)

    # ── Build ordered stop list and polyline ──────────────────────
    # sequence = [0, s1, s2, ..., sN, 0] — skip first and last (both hub)
    stop_indices   = sequence[1:-1]
    order_sequence = [str(order_ids[i - 1]) for i in stop_indices]  # -1: hub is at dm[0]

    polyline = [{"lat": hub[0], "lng": hub[1]}]
    for i in stop_indices:
        polyline.append({"lat": locations[i][0], "lng": locations[i][1]})
    polyline.append({"lat": hub[0], "lng": hub[1]})

    print(f"  ✅ Before: {before_km:.2f} km  →  After: {after_km:.2f} km  |  "
          f"Saved: {distance_saved:.2f} km ({pct_saved}%) = ₹{cost_saved}  |  "
          f"🌿 {carbon_saved} kg CO₂")

    return {
        "batch_id":         batch_id,
        "order_sequence":   order_sequence,
        "polyline":         polyline,
        "total_distance":   after_km,
        "total_time":       estimated_time,
        "estimated_cost":   estimated_cost,
        "carbon_saved":     carbon_saved,
        "before_distance":  round(before_km, 2),
        "distance_saved":   distance_saved,
        "cost_saved":       cost_saved,
        "pct_saved":        pct_saved,
    }


# ══════════════════════════════════════════════════════════════════
# PERSISTENCE
# ══════════════════════════════════════════════════════════════════

def save_route(result: dict):
    """Upsert into routes table."""
    route_id = f"R-{result['batch_id']}"
    row = {
        "id":             route_id,
        "batch_id":       result["batch_id"],
        "order_sequence": json.dumps(result["order_sequence"]),
        "total_distance": result["total_distance"],
        "total_time":     result["total_time"],
        "polyline":       json.dumps(result["polyline"]),
    }
    # Try insert; if 409 conflict, patch
    r = requests.post(f"{SUPABASE_URL}/rest/v1/routes", headers=HEADERS, json=row)
    if r.status_code == 409:
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/routes?id=eq.{route_id}",
            headers=HEADERS, json=row,
        )
    r.raise_for_status()
    print(f"  💾 Route saved: {route_id}")


def update_batch(result: dict):
    """Update batch with final optimised metrics."""
    patch = {
        "estimated_distance": result["total_distance"],
        "estimated_time":     result["total_time"],
        "estimated_cost":     result["estimated_cost"],
        "carbon_saved":       result["carbon_saved"],
    }
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/batches?id=eq.{result['batch_id']}",
        headers=HEADERS, json=patch,
    )
    r.raise_for_status()


# ══════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════

def run_route_optimization():
    print("\n" + "="*60)
    print("🚀 RapidRoute — Route Optimization (OR-Tools TSP)")
    print("="*60 + "\n")

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env")
        return

    hub     = fetch_hub()
    batches = fetch_batched_orders()
    if not batches:
        print("\n⚠️  No batches to optimise. Run batch_orders.py first.")
        return

    total_saved_km, total_saved_cost, total_carbon, done = 0, 0, 0, 0

    for batch_id, orders in batches.items():
        result = optimise_batch(batch_id, orders, hub)
        if not result:
            continue
        save_route(result)
        update_batch(result)
        total_saved_km   += result["distance_saved"]
        total_saved_cost += result["cost_saved"]
        total_carbon     += result["carbon_saved"]
        done             += 1

    print("\n" + "="*60)
    print(f"📊 Summary: {done} batches optimised")
    print(f"   📏 Distance saved: {total_saved_km:.2f} km")
    print(f"   💰 Cost saved:     ₹{total_saved_cost:.2f}")
    print(f"   🌿 CO₂ saved:      {total_carbon:.3f} kg")
    print("="*60 + "\n")


if __name__ == "__main__":
    run_route_optimization()
