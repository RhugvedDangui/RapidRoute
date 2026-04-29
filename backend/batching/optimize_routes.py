"""
RapidRoute - Phase 2: Professional Route Optimization
Google OR-Tools TSP solver for optimal delivery routes
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

API_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Hub location (Agnel Institute, Assagao, Goa)
HUB_LOCATION = (15.5946557, 73.7948836)


def haversine(lat1, lng1, lat2, lng2):
    """
    Calculate distance between two points using Haversine formula.
    
    Args:
        lat1, lng1: First point coordinates
        lat2, lng2: Second point coordinates
        
    Returns:
        float: Distance in kilometers
    """
    R = 6371  # Earth radius in km
    
    lat1, lng1, lat2, lng2 = map(np.radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlng/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    
    return R * c


def create_distance_matrix(locations):
    """
    Create distance matrix for OR-Tools.
    
    Args:
        locations: List of (lat, lng) tuples. First entry MUST be the Hub.
        
    Returns:
        list: 2D distance matrix
    """
    num_locations = len(locations)
    matrix = np.zeros((num_locations, num_locations))
    
    for i in range(num_locations):
        for j in range(num_locations):
            if i == j:
                matrix[i][j] = 0
            else:
                matrix[i][j] = haversine(
                    locations[i][0], locations[i][1],
                    locations[j][0], locations[j][1]
                )
    
    return matrix.tolist()


def solve_tsp(distance_matrix):
    """
    Solve Traveling Salesperson Problem using Google OR-Tools.
    
    Args:
        distance_matrix: 2D list of distances between locations
        
    Returns:
        list: Optimized route sequence (indices)
    """
    # Create Routing Index Manager
    # Parameters: number of locations, number of vehicles, depot index
    manager = pywrapcp.RoutingIndexManager(len(distance_matrix), 1, 0)
    
    # Create Routing Model
    routing = pywrapcp.RoutingModel(manager)
    
    # Create Distance Callback
    def distance_callback(from_index, to_index):
        """Returns the distance between two nodes."""
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        # Convert to meters for precision (OR-Tools works with integers)
        return int(distance_matrix[from_node][to_node] * 1000)
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Set Search Parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    
    # Solve the problem
    solution = routing.SolveWithParameters(search_parameters)
    
    # Extract the route
    if solution:
        index = routing.Start(0)
        route_sequence = []
        
        while not routing.IsEnd(index):
            route_sequence.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        
        # Add depot at the end (return to hub)
        route_sequence.append(0)
        
        return route_sequence
    
    return None


def calculate_route_distance(route_sequence, distance_matrix):
    """
    Calculate total distance for a route sequence.
    
    Args:
        route_sequence: List of location indices
        distance_matrix: 2D distance matrix
        
    Returns:
        float: Total distance in km
    """
    total_distance = 0
    for i in range(len(route_sequence) - 1):
        total_distance += distance_matrix[route_sequence[i]][route_sequence[i + 1]]
    return total_distance


def calculate_before_distance(distance_matrix):
    """
    Calculate "before" distance (individual trips: hub -> order -> hub).
    
    Args:
        distance_matrix: 2D distance matrix
        
    Returns:
        float: Total distance in km
    """
    total_distance = 0
    # For each order (skip hub at index 0)
    for i in range(1, len(distance_matrix)):
        # Hub to order and back
        total_distance += distance_matrix[0][i] * 2
    return total_distance


def get_batched_orders():
    """
    Fetch all batched orders grouped by batch_id.
    
    Returns:
        dict: Dictionary of batch_id -> list of orders
    """
    print("📦 Fetching batched orders from Supabase...")
    
    url = f"{SUPABASE_URL}/rest/v1/orders?status=eq.batched&select=*"
    
    try:
        response = requests.get(url, headers=API_HEADERS)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"❌ Error fetching orders: {e}")
        return {}
    
    if not data:
        print("⚠️  No batched orders found.")
        return {}
    
    df = pd.DataFrame(data)
    
    # Group by batch_id
    batches = {}
    for batch_id, group in df.groupby('batch_id'):
        batches[batch_id] = group.to_dict('records')
    
    print(f"✅ Found {len(batches)} batches with {len(df)} orders")
    return batches


def optimize_batch_route(batch_id, orders):
    """
    Optimize route for a single batch using OR-Tools TSP solver.
    
    Args:
        batch_id: Batch identifier
        orders: List of order dictionaries
        
    Returns:
        dict: Route optimization results
    """
    print(f"\n🔄 Optimizing route for batch {batch_id} ({len(orders)} orders)...")
    
    # Prepare locations: [Hub, Order1, Order2, ...]
    locations = [HUB_LOCATION]
    order_ids = []
    
    for order in orders:
        locations.append((order['lat'], order['lng']))
        order_ids.append(order['id'])
    
    # Create distance matrix
    distance_matrix = create_distance_matrix(locations)
    
    # Calculate "before" distance (individual trips)
    before_distance = calculate_before_distance(distance_matrix)
    
    # Solve TSP
    route_sequence = solve_tsp(distance_matrix)
    
    if not route_sequence:
        print(f"  ❌ Failed to optimize route for batch {batch_id}")
        return None
    
    # Calculate "after" distance (optimized route)
    after_distance = calculate_route_distance(route_sequence, distance_matrix)
    
    # Calculate savings
    distance_saved = before_distance - after_distance
    cost_saved = distance_saved * 8  # ₹8/km
    percentage_saved = (distance_saved / before_distance) * 100 if before_distance > 0 else 0
    
    # Map route sequence to order IDs
    order_sequence = []
    polyline = [{"lat": HUB_LOCATION[0], "lng": HUB_LOCATION[1]}]
    
    for idx in route_sequence[1:-1]:  # Skip first and last (both are hub)
        order_sequence.append(order_ids[idx - 1])  # -1 because hub is at index 0
        polyline.append({
            "lat": locations[idx][0],
            "lng": locations[idx][1]
        })
    
    # Add hub at the end
    polyline.append({"lat": HUB_LOCATION[0], "lng": HUB_LOCATION[1]})
    
    # Calculate estimated time
    estimated_time = int((after_distance / 30) * 60 + len(orders) * 5)  # 30 km/h + 5 min per stop
    
    print(f"  ✅ Route optimized:")
    print(f"     Before: {before_distance:.2f} km")
    print(f"     After:  {after_distance:.2f} km")
    print(f"     Saved:  {distance_saved:.2f} km ({percentage_saved:.1f}%) = ₹{cost_saved:.2f}")
    
    return {
        "batch_id": batch_id,
        "order_sequence": order_sequence,
        "polyline": polyline,
        "total_distance": round(after_distance, 2),
        "total_time": estimated_time,
        "before_distance": round(before_distance, 2),
        "distance_saved": round(distance_saved, 2),
        "cost_saved": round(cost_saved, 2),
        "percentage_saved": round(percentage_saved, 1)
    }


def save_route_to_db(route_data):
    """
    Save optimized route to Supabase routes table.
    Updates if route already exists (upsert).
    
    Args:
        route_data: Dictionary containing route information
    """
    route_id = f"R-{route_data['batch_id']}"
    
    route_record = {
        "id": route_id,
        "batch_id": route_data['batch_id'],
        "order_sequence": json.dumps(route_data['order_sequence']),
        "total_distance": route_data['total_distance'],
        "total_time": route_data['total_time'],
        "polyline": json.dumps(route_data['polyline'])
    }
    
    try:
        # Try to insert first
        url = f"{SUPABASE_URL}/rest/v1/routes"
        response = requests.post(url, headers=API_HEADERS, json=route_record)
        
        if response.status_code == 409:
            # Route exists, update it instead
            url = f"{SUPABASE_URL}/rest/v1/routes?id=eq.{route_id}"
            response = requests.patch(url, headers=API_HEADERS, json=route_record)
            response.raise_for_status()
            print(f"  💾 Route updated: {route_id}")
        else:
            response.raise_for_status()
            print(f"  💾 Route saved: {route_id}")
    except Exception as e:
        print(f"  ❌ Error saving route {route_id}: {e}")


def update_batch_metrics(batch_id, route_data):
    """
    Update batch table with optimized metrics.
    
    Args:
        batch_id: Batch identifier
        route_data: Dictionary containing route metrics
    """
    try:
        url = f"{SUPABASE_URL}/rest/v1/batches?id=eq.{batch_id}"
        update_data = {
            "estimated_distance": route_data['total_distance'],
            "estimated_time": route_data['total_time'],
            "estimated_cost": route_data['total_distance'] * 8
        }
        response = requests.patch(url, headers=API_HEADERS, json=update_data)
        response.raise_for_status()
    except Exception as e:
        print(f"  ⚠️  Error updating batch metrics: {e}")


def run_route_optimization():
    """
    Main pipeline: Fetch batches → Optimize routes → Save results
    """
    print("\n" + "="*60)
    print("🚀 RapidRoute - Route Optimization Pipeline")
    print("="*60 + "\n")
    
    # Validate environment variables
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ ERROR: Missing environment variables")
        print("Please check your .env file")
        return
    
    print(f"🔗 Connecting to: {SUPABASE_URL}")
    print(f"📍 Hub location: {HUB_LOCATION}")
    
    # Fetch batched orders
    batches = get_batched_orders()
    
    if not batches:
        print("\n⚠️  No batches to optimize. Run batching first.")
        return
    
    # Optimize each batch
    total_distance_saved = 0
    total_cost_saved = 0
    optimized_count = 0
    
    for batch_id, orders in batches.items():
        route_data = optimize_batch_route(batch_id, orders)
        
        if route_data:
            # Save route to database
            save_route_to_db(route_data)
            
            # Update batch metrics
            update_batch_metrics(batch_id, route_data)
            
            # Accumulate savings
            total_distance_saved += route_data['distance_saved']
            total_cost_saved += route_data['cost_saved']
            optimized_count += 1
    
    # Summary
    print("\n" + "="*60)
    print("📊 Optimization Summary")
    print("="*60)
    print(f"✅ Optimized {optimized_count} batches")
    print(f"📏 Total distance saved: {total_distance_saved:.2f} km")
    print(f"💰 Total cost saved: ₹{total_cost_saved:.2f}")
    print("="*60 + "\n")


if __name__ == "__main__":
    run_route_optimization()
