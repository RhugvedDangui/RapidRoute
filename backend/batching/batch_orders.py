"""
RapidRoute - Phase 1: Intelligent Batching
==========================================
Groups pending orders into batches using:
  - K-Means geographic clustering
  - Time-window refinement (morning / afternoon / evening)
  - Vehicle capacity constraints (greedy bin-packing)
  - Smallest-fit vehicle assignment

Route optimisation is handled separately by optimize_routes.py (Phase 2).
"""

import os, sys, uuid, json
import numpy as np
import pandas as pd
import requests
from math import radians, sin, cos, sqrt, atan2, ceil
from datetime import datetime, timezone
from sklearn.cluster import KMeans
from dotenv import load_dotenv
import argparse

# ── Windows UTF-8 fix ──────────────────────────────────────────────
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.buffer, "strict")
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.buffer, "strict")

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

MAX_ORDERS_PER_BATCH = 10
DEFAULT_COST_PER_KM  = 15.0   # fallback ₹/km
CO2_PER_KM           = 0.21   # kg CO₂/km

HEADERS = {
    "apikey":        SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}


# ══════════════════════════════════════════════════════════════════
# GEOMETRY (used only for carbon estimate in batch metrics)
# ══════════════════════════════════════════════════════════════════

def haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371.0
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat, dlng = lat2 - lat1, lng2 - lng1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlng/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))


# ══════════════════════════════════════════════════════════════════
# DATA FETCHING
# ══════════════════════════════════════════════════════════════════

def fetch_orders(order_ids: list = None) -> pd.DataFrame:
    print("📦 Fetching pending orders...")
    url = f"{SUPABASE_URL}/rest/v1/orders?status=eq.pending&select=*"
    if order_ids:
        # e.g. &id=in.(10001,10002)
        ids_str = ",".join(order_ids)
        url += f"&id=in.({ids_str})"

    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    data = r.json()
    if not data:
        print("⚠️  No pending orders.")
        return pd.DataFrame()
    df = pd.DataFrame(data).dropna(subset=["lat", "lng"])
    df["weight_kg"]   = pd.to_numeric(df.get("weight_kg",   1.0), errors="coerce").fillna(1.0)
    df["time_window"] = df.get("time_window", "other").fillna("other")
    print(f"✅ {len(df)} orders | {df['weight_kg'].sum():.1f} kg total")
    return df


def fetch_vehicles() -> list:
    print("🚗 Fetching active vehicles...")
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/vehicles"
        "?active=eq.true&select=*&order=capacity_kg.asc",
        headers=HEADERS,
    )
    r.raise_for_status()
    vehicles = r.json() or []
    for v in vehicles:
        print(f"   {v.get('name')} | {v.get('type')} | "
              f"{v.get('capacity_kg')} kg | ₹{v.get('cost_per_km', DEFAULT_COST_PER_KM)}/km")
    print(f"✅ {len(vehicles)} vehicles found")
    return vehicles


# ══════════════════════════════════════════════════════════════════
# CLUSTERING
# ══════════════════════════════════════════════════════════════════

def compute_k(df: pd.DataFrame, max_cap_kg: float) -> int:
    """k = max(ceil(n/MAX_ORDERS), ceil(total_weight/max_vehicle_cap))"""
    k_orders = ceil(len(df) / MAX_ORDERS_PER_BATCH)
    k_weight = ceil(df["weight_kg"].sum() / max_cap_kg) if max_cap_kg else 1
    k = max(1, k_orders, k_weight)
    print(f"📊 k={k}  (by-orders={k_orders}, by-weight={k_weight})")
    return k


def cluster(df: pd.DataFrame, max_cap_kg: float) -> pd.DataFrame:
    k = compute_k(df, max_cap_kg)
    print(f"🔄 K-Means with k={k}...")
    df = df.copy()
    df["cluster_id"] = KMeans(
        n_clusters=k, random_state=42, n_init=10
    ).fit_predict(df[["lat", "lng"]].values)
    print(f"✅ {k} geographic clusters created")
    return df


# ══════════════════════════════════════════════════════════════════
# CAPACITY-AWARE BATCH FINALISATION
# ══════════════════════════════════════════════════════════════════

# Round-robin counter per capacity tier (e.g. all 20-kg bikes share one index)
_rr_index: dict = {}

def assign_vehicle(total_weight_kg: float, vehicles: list):
    """
    Smallest-fit + round-robin:
      1. Find the minimum capacity tier that fits the batch weight.
      2. Collect all vehicles in that tier.
      3. Rotate through them evenly across successive calls.
    """
    sorted_v = sorted(vehicles, key=lambda x: x["capacity_kg"])

    # Find min capacity that fits
    min_cap = None
    for v in sorted_v:
        if v["capacity_kg"] >= total_weight_kg:
            min_cap = v["capacity_kg"]
            break

    if min_cap is None:
        # Nothing fits exactly — use the largest available
        return sorted_v[-1] if sorted_v else None

    # All vehicles in the same capacity tier
    tier = [v for v in sorted_v if v["capacity_kg"] == min_cap]

    # Round-robin within the tier
    idx = _rr_index.get(min_cap, 0) % len(tier)
    _rr_index[min_cap] = idx + 1
    return tier[idx]


def bin_pack(group: pd.DataFrame, max_weight_kg: float) -> list:
    """Greedy bin-packing within a cluster×time-window group."""
    bins, cur, cur_w = [], [], 0.0
    for _, row in group.iterrows():
        w = float(row["weight_kg"])
        if cur and (cur_w + w > max_weight_kg or len(cur) >= MAX_ORDERS_PER_BATCH):
            bins.append(pd.DataFrame(cur))
            cur, cur_w = [], 0.0
        cur.append(row)
        cur_w += w
    if cur:
        bins.append(pd.DataFrame(cur))
    return bins


def finalise_batches(df: pd.DataFrame, vehicles: list) -> list:
    """Returns list of (batch_df, vehicle | None)."""
    print("🔧 Finalising batches (cluster × time-window × capacity)...")
    max_cap = max((v["capacity_kg"] for v in vehicles), default=50)
    result  = []
    for (cid, tw), grp in df.groupby(["cluster_id", "time_window"]):
        for sub in bin_pack(grp, max_cap):
            total_w = sub["weight_kg"].sum()
            vehicle = assign_vehicle(total_w, vehicles)
            vname   = vehicle["name"] if vehicle else "Unassigned"
            print(f"  📦 Cluster {cid} | {tw} | {len(sub)} orders | {total_w:.1f} kg → {vname}")
            result.append((sub, vehicle))
    print(f"✅ {len(result)} batches finalised")
    return result


# ══════════════════════════════════════════════════════════════════
# PRELIMINARY METRICS (rough estimate — optimize_routes.py refines)
# ══════════════════════════════════════════════════════════════════

def prelim_metrics(batch_df: pd.DataFrame, vehicle) -> dict:
    """
    Estimate distance as sum of consecutive haversine distances (unoptimised order).
    optimize_routes.py will overwrite these with OR-Tools results.
    """
    coords   = list(zip(batch_df["lat"].values, batch_df["lng"].values))
    raw_km   = sum(
        haversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
        for i in range(len(coords)-1)
    ) if len(coords) > 1 else 0.0

    cpm       = float(vehicle["cost_per_km"]) if vehicle else DEFAULT_COST_PER_KM
    est_cost  = round(raw_km * cpm, 2)
    est_time  = int((raw_km / 30) * 60 + len(batch_df) * 5)

    # Rough carbon estimate: individual round trips vs raw sequential
    clat, clng = batch_df["lat"].mean(), batch_df["lng"].mean()
    indiv_km   = sum(haversine(clat, clng, r.lat, r.lng) * 2 for _, r in batch_df.iterrows())
    carbon     = round(max(0, indiv_km - raw_km) * CO2_PER_KM, 3)

    return {
        "estimated_distance": round(raw_km, 2),
        "estimated_time":     est_time,
        "estimated_cost":     est_cost,
        "carbon_saved":       carbon,
    }


# ══════════════════════════════════════════════════════════════════
# PERSISTENCE
# ══════════════════════════════════════════════════════════════════

def save(final_batches: list):
    print(f"\n💾 Saving {len(final_batches)} batches...")
    for idx, (batch_df, vehicle) in enumerate(final_batches, 1):
        batch_id = f"B-{uuid.uuid4().hex[:6].upper()}"
        m        = prelim_metrics(batch_df, vehicle)
        vid      = vehicle["id"] if vehicle else None
        vname    = vehicle["name"] if vehicle else "None"

        # 1. Insert batch row
        batch_row = {
            "id":                 batch_id,
            "total_orders":       len(batch_df),
            "created_at":         datetime.now(timezone.utc).isoformat(),
            "estimated_distance": m["estimated_distance"],
            "estimated_time":     m["estimated_time"],
            "estimated_cost":     m["estimated_cost"],
            "carbon_saved":       m["carbon_saved"],
            "vehicle_id":         vid,
        }
        try:
            requests.post(
                f"{SUPABASE_URL}/rest/v1/batches",
                headers=HEADERS, json=batch_row,
            ).raise_for_status()
            print(f"  ✅ [{idx}] {batch_id} | {len(batch_df)} orders | "
                  f"{m['estimated_distance']} km (prelim) | 🚛 {vname}")
        except Exception as e:
            print(f"  ❌ Batch insert failed: {e}")
            continue

        # 2. Update orders → status=batched, batch_id
        for _, row in batch_df.iterrows():
            try:
                requests.patch(
                    f"{SUPABASE_URL}/rest/v1/orders?id=eq.{row['id']}",
                    headers=HEADERS,
                    json={"batch_id": batch_id, "status": "batched"},
                ).raise_for_status()
            except Exception as e:
                print(f"     ⚠️  Order update failed ({row['id']}): {e}")


# ══════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════

def run():
    parser = argparse.ArgumentParser(description="Run RapidRoute Phase 1 Batching")
    parser.add_argument('--orders', type=str, help="Comma-separated list of order IDs to batch")
    args = parser.parse_args()

    print("\n" + "="*60)
    print("🚀 RapidRoute — Phase 1: Batching")
    print("="*60 + "\n")

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env")
        return

    order_ids = args.orders.split(',') if args.orders else None
    orders    = fetch_orders(order_ids)
    if orders.empty:
        return

    vehicles = fetch_vehicles()
    max_cap  = max((v["capacity_kg"] for v in vehicles), default=50)

    orders        = cluster(orders, max_cap)
    final_batches = finalise_batches(orders, vehicles)
    save(final_batches)

    print("\n" + "="*60)
    print("✅ Batching complete! Run optimize_routes.py for Phase 2.")
    print("="*60 + "\n")


if __name__ == "__main__":
    run()
