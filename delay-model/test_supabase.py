import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('c:/Users/uday0/OneDrive/Desktop/code/other/RapidRoute/delay-model/.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))

# Fetch recent delay_predictions
print('Recent Predictions:')
try:
    res = supabase.table('delay_predictions').select('*').order('created_at', desc=True).limit(5).execute()
    for r in res.data:
        print(r)
except Exception as e:
    print(f"Error fetching predictions: {e}")

# Fetch the orders that the user ran predictions on
print('\nRecent Orders:')
try:
    res_orders = supabase.table('orders').select('*').limit(5).execute()
    for o in res_orders.data:
        print(o)
except Exception as e:
    print(f"Error fetching orders: {e}")
