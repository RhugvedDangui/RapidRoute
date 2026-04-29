"""
RapidRoute - Phase 1: Intelligent Batching
K-Means clustering for optimal delivery route batching
Using direct HTTP requests to avoid dependency issues
"""

import os
import sys
import uuid
import json
import requests
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.cluster import KMeans
from dotenv import load_dotenv

# Fix Windows console encoding for emoji support
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Constants
MAX_ORDERS_PER_BATCH = 10
API_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}


def get_pending_orders():
    """
    Fetch all pending orders with valid coordinates from Supabase.
    
    Returns:
        pd.DataFrame: DataFrame containing pending orders with lat/lng
    """
    print("📦 Fetching pending orders from Supabase...")
    
    url = f"{SUPABASE_URL}/rest/v1/orders?status=eq.pending&select=*"
    
    try:
        response = requests.get(url, headers=API_HEADERS)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"❌ Error fetching orders: {e}")
        return pd.DataFrame()
    
    if not data:
        print("⚠️  No pending orders found.")
        return pd.DataFrame()
    
    df = pd.DataFrame(data)
    
    # Filter out orders without valid coordinates
    df = df.dropna(subset=['lat', 'lng'])
    
    print(f"✅ Found {len(df)} pending orders with valid coordinates")
    return df


def calculate_k(df):
    """
    Calculate optimal number of clusters based on total orders.
    Formula: k = ceil(total_orders / MAX_ORDERS_PER_BATCH)
    
    Args:
        df (pd.DataFrame): DataFrame of orders
        
    Returns:
        int: Number of clusters
    """
    total_orders = len(df)
    
    if total_orders == 0:
        return 0
    
    k = int(np.ceil(total_orders / MAX_ORDERS_PER_BATCH))
    print(f"📊 Calculated k = {k} clusters for {total_orders} orders")
    return k


def apply_clustering(df):
    """
    Apply K-Means clustering to group orders by geographic proximity.
    
    Args:
        df (pd.DataFrame): DataFrame with lat/lng columns
        
    Returns:
        pd.DataFrame: DataFrame with added 'cluster_id' column
    """
    k = calculate_k(df)
    
    if k == 0:
        print("⚠️  No orders to cluster")
        return df
    
    print(f"🔄 Running K-Means clustering with k={k}...")
    
    # Prepare coordinate features
    coords = df[['lat', 'lng']].values
    
    # Initialize and run K-Means
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    df['cluster_id'] = kmeans.fit_predict(coords)
    
    print(f"✅ Clustering complete. Created {k} geographic clusters")
    return df


def finalize_batches(df):
    """
    Refine clusters by splitting based on time_window.
    Ensures each batch has same time window and max 10 orders.
    
    Args:
        df (pd.DataFrame): DataFrame with cluster_id and time_window
        
    Returns:
        list: List of DataFrames, each representing a final batch
    """
    print("🔧 Refining batches by time window...")
    
    final_batches = []
    
    # Group by K-Means cluster AND time window
    grouped = df.groupby(['cluster_id', 'time_window'])
    
    for (cluster, window), group in grouped:
        # If any sub-group exceeds MAX_ORDERS_PER_BATCH, split it
        for i in range(0, len(group), MAX_ORDERS_PER_BATCH):
            batch_chunk = group.iloc[i : i + MAX_ORDERS_PER_BATCH]
            final_batches.append(batch_chunk)
            print(f"  📦 Batch: Cluster {cluster}, {window}, {len(batch_chunk)} orders")
    
    print(f"✅ Finalized {len(final_batches)} batches")
    return final_batches


def calculate_batch_metrics(batch_df):
    """
    Calculate estimated distance, time, and cost for a batch.
    Uses Haversine formula for distance calculation.
    
    Args:
        batch_df (pd.DataFrame): DataFrame of orders in the batch
        
    Returns:
        dict: Metrics including distance, time, and cost
    """
    def haversine(lat1, lng1, lat2, lng2):
        """Calculate distance between two points using Haversine formula"""
        R = 6371  # Earth radius in km
        
        lat1, lng1, lat2, lng2 = map(np.radians, [lat1, lng1, lat2, lng2])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlng/2)**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        
        return R * c
    
    # Simple estimation: sum of distances between consecutive points
    total_distance = 0
    coords = batch_df[['lat', 'lng']].values
    
    for i in range(len(coords) - 1):
        dist = haversine(coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1])
        total_distance += dist
    
    # Estimated time: distance / 30 km/h + 5 min per stop
    estimated_time = int((total_distance / 30) * 60 + len(batch_df) * 5)
    
    # Estimated cost: distance * ₹8/km
    estimated_cost = round(total_distance * 8, 2)
    
    return {
        "estimated_distance": round(total_distance, 2),
        "estimated_time": estimated_time,
        "estimated_cost": estimated_cost
    }


def save_batches_to_db(final_batches):
    """
    Save finalized batches to Supabase using direct HTTP requests.
    Creates batch records and updates order statuses.
    
    Args:
        final_batches (list): List of batch DataFrames
    """
    print("\n💾 Saving batches to Supabase...")
    
    for idx, batch_df in enumerate(final_batches, 1):
        batch_id = f"B-{uuid.uuid4().hex[:6].upper()}"
        
        # Calculate batch metrics
        metrics = calculate_batch_metrics(batch_df)
        
        # 1. Insert into 'batches' table
        batch_data = {
            "id": batch_id,
            "total_orders": len(batch_df),
            "created_at": datetime.utcnow().isoformat(),
            "estimated_distance": metrics["estimated_distance"],
            "estimated_time": metrics["estimated_time"],
            "estimated_cost": metrics["estimated_cost"]
        }
        
        try:
            url = f"{SUPABASE_URL}/rest/v1/batches"
            response = requests.post(url, headers=API_HEADERS, json=batch_data)
            response.raise_for_status()
            print(f"  ✅ Batch {idx}/{len(final_batches)}: {batch_id} - {len(batch_df)} orders, {metrics['estimated_distance']} km, ₹{metrics['estimated_cost']}")
        except Exception as e:
            print(f"  ❌ Error creating batch {batch_id}: {e}")
            continue
        
        # 2. Update 'orders' table
        order_ids = batch_df['id'].tolist()
        
        try:
            # Update each order individually (simpler than bulk update)
            for order_id in order_ids:
                url = f"{SUPABASE_URL}/rest/v1/orders?id=eq.{order_id}"
                update_data = {
                    "batch_id": batch_id,
                    "status": "batched"
                }
                response = requests.patch(url, headers=API_HEADERS, json=update_data)
                response.raise_for_status()
        except Exception as e:
            print(f"  ❌ Error updating orders for batch {batch_id}: {e}")
    
    print(f"\n🎉 Successfully created {len(final_batches)} batches!")


def run_batching_pipeline():
    """
    Main pipeline: Fetch → Cluster → Refine → Save
    """
    print("\n" + "="*60)
    print("🚀 RapidRoute - Intelligent Batching Pipeline")
    print("="*60 + "\n")
    
    # Validate environment variables
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ ERROR: Missing environment variables")
        print("Please check your .env file")
        return
    
    print(f"🔗 Connecting to: {SUPABASE_URL}")
    
    # Step 1: Fetch pending orders
    df = get_pending_orders()
    
    if df.empty:
        print("\n⚠️  No orders to batch. Exiting.")
        return
    
    # Step 2: Apply K-Means clustering
    df = apply_clustering(df)
    
    # Step 3: Refine by time window
    final_batches = finalize_batches(df)
    
    # Step 4: Save to database
    save_batches_to_db(final_batches)
    
    print("\n" + "="*60)
    print("✅ Batching pipeline completed successfully!")
    print("="*60 + "\n")


if __name__ == "__main__":
    run_batching_pipeline()
