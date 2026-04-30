# ═══════════════════════════════════════════════════════════════════════════════
# RapidRoute - Training Data Generator v3
# Changes from v2:
#   - 100K samples (2x more)
#   - Exports is_monsoon + day_of_week as features (were missing from FEATURE_COLUMNS)
#   - 4 new interaction features: wind_x_rain, weather_peak, courier_weather, traffic_x_dist
#   - Cyclical time encoding: time_sin + time_cos
#   - Slightly reduced noise (0.005 std) for cleaner labels
# ═══════════════════════════════════════════════════════════════════════════════

import pandas as pd
import numpy as np
from pathlib import Path

np.random.seed(42)

NUM_SAMPLES = 100000
OUTPUT_DIR  = Path(__file__).parent.parent / "data"
OUTPUT_FILE = OUTPUT_DIR / "training_data.csv"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ───────────────────────────────────────────────────────────────────────────────
# WEATHER CODE → SEVERITY
# ───────────────────────────────────────────────────────────────────────────────

def weather_code_to_severity(code: int) -> int:
    if code in [0, 1]:          return 0
    elif code in [2, 3]:        return 1
    elif code in [45, 48]:      return 2
    elif code in [51, 53, 55]:  return 3
    elif code in [61, 80]:      return 3
    elif code in [63, 81]:      return 4
    elif code in [65, 82]:      return 5
    elif code in [95, 96, 99]:  return 6
    else:                       return 2


# ───────────────────────────────────────────────────────────────────────────────
# FEATURE GENERATORS (unchanged from v2)
# ───────────────────────────────────────────────────────────────────────────────

def gen_distance():
    return np.random.gamma(shape=2, scale=5)

def gen_courier_score():
    return float(np.clip(np.random.beta(a=5, b=2), 0.05, 0.99))

def gen_rain(season_factor=1.0):
    return 0.0 if np.random.random() < 0.70 else float(np.random.exponential(scale=5 * season_factor))

def gen_wind():
    return float(np.clip(np.random.gamma(shape=2, scale=8), 0, 80))

def gen_weather_code(rain_mm):
    if rain_mm == 0:   return int(np.random.choice([0, 1, 2, 3], p=[0.40, 0.30, 0.20, 0.10]))
    elif rain_mm < 2:  return int(np.random.choice([51, 53, 61]))
    elif rain_mm < 10: return int(np.random.choice([61, 63, 80, 81]))
    elif rain_mm < 20: return int(np.random.choice([63, 65, 81, 82]))
    else:              return int(np.random.choice([82, 95, 96, 99]))

def gen_time():
    w = np.array([0.01,0.01,0.01,0.01,0.01,0.01,0.02,0.03,0.05,0.08,0.10,0.10,
                  0.08,0.07,0.06,0.06,0.05,0.08,0.10,0.08,0.05,0.03,0.02,0.01])
    w /= w.sum()
    return int(np.random.choice(range(24), p=w))

def gen_day_of_week():
    w = np.array([0.18, 0.18, 0.18, 0.18, 0.15, 0.07, 0.06])
    w /= w.sum()
    return int(np.random.choice(range(7), p=w))

def gen_temperature(time_of_day):
    return float(28 - 5 * np.cos(2 * np.pi * time_of_day / 24) + np.random.normal(0, 3))

def gen_traffic(time_of_day, is_weekend):
    if is_weekend:
        base = 30.0
    elif time_of_day in [8, 9, 10]:    base = float(np.random.uniform(70, 95))
    elif time_of_day in [17,18,19,20]: base = float(np.random.uniform(75, 100))
    elif time_of_day in [12,13,14]:    base = float(np.random.uniform(50, 70))
    elif time_of_day in [7,11,16,21]:  base = float(np.random.uniform(40, 60))
    else:                              base = float(np.random.uniform(20, 40))
    return float(np.clip(base + np.random.normal(0, 5), 0, 100))


# ───────────────────────────────────────────────────────────────────────────────
# DELAY PROBABILITY (sigmoid-based, same as v2)
# ───────────────────────────────────────────────────────────────────────────────

def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))

def calc_delay_prob(distance_km, courier_score, rain_mm, wind_speed,
                    weather_severity, time_of_day, temperature,
                    traffic_level, is_weekend):
    logit = -5.0  # stronger intercept to compensate for amplified coefficients

    # Distance — amplified
    logit += 1.4  * np.log1p(distance_km) / np.log1p(30)

    # Courier — strongest individual predictor
    courier_risk = (1.0 - courier_score) ** 1.5
    logit += 5.0  * courier_risk

    # Weather factors — amplified
    logit += 2.8  * np.log1p(rain_mm) / np.log1p(25)
    logit += 1.4  * (wind_speed / 80.0)
    logit += 0.6  * weather_severity

    # Traffic — amplified
    logit += 3.0  * (traffic_level / 100.0) ** 1.2

    # Time/day — amplified
    if time_of_day in [8, 9, 10, 17, 18, 19, 20]:  logit += 0.9
    elif time_of_day in [7, 11, 16, 21]:            logit += 0.4
    if is_weekend:                                   logit -= 0.7
    if temperature > 42 or temperature < 8:         logit += 0.5

    # Interaction terms — amplified (these are the key discriminators)
    rain_traffic = (np.log1p(rain_mm) / np.log1p(25)) * (traffic_level / 100.0)
    logit += 3.5  * rain_traffic
    logit += 2.5  * courier_risk * (np.log1p(distance_km) / np.log1p(30))
    if weather_severity >= 6: logit += 1.8

    prob = sigmoid(logit) + np.random.normal(0, 0.003)  # minimal noise
    return float(np.clip(prob, 0.01, 0.99))


# ───────────────────────────────────────────────────────────────────────────────
# MAIN
# ───────────────────────────────────────────────────────────────────────────────

def generate():
    print(f"Generating {NUM_SAMPLES:,} records (v3)...")
    data = []

    for i in range(NUM_SAMPLES):
        distance_km   = gen_distance()
        courier_score = gen_courier_score()
        time_of_day   = gen_time()
        day_of_week   = gen_day_of_week()
        is_monsoon    = np.random.random() < 0.25
        season_factor = 3.0 if is_monsoon else 1.0
        is_weekend    = day_of_week >= 5

        rain_mm       = gen_rain(season_factor)
        wind_speed    = gen_wind()
        weather_code  = gen_weather_code(rain_mm)
        temperature   = gen_temperature(time_of_day)
        traffic_level = gen_traffic(time_of_day, is_weekend)

        # Derived features
        w_sev       = weather_code_to_severity(weather_code)
        peak_hour   = 1 if time_of_day in [8,9,10,17,18,19,20] else 0
        dist_bucket = (0 if distance_km < 5 else 1 if distance_km < 10 else
                       2 if distance_km < 20 else 3 if distance_km < 30 else 4)

        # Base interactions (v2)
        rain_x_traffic     = (np.log1p(rain_mm) / np.log1p(25)) * (traffic_level / 100.0)
        courier_risk       = (1.0 - courier_score) ** 1.5
        courier_x_distance = courier_risk * (np.log1p(distance_km) / np.log1p(30))

        # NEW interactions (v3)
        wind_x_rain        = (wind_speed / 80.0) * (np.log1p(rain_mm) / np.log1p(25))
        weather_x_peak     = float(w_sev) * float(peak_hour)
        courier_x_weather  = courier_risk * float(w_sev) / 6.0
        traffic_x_dist     = (traffic_level / 100.0) * float(dist_bucket) / 4.0

        # Cyclical time encoding (NEW v3)
        time_sin = float(np.sin(2 * np.pi * time_of_day / 24))
        time_cos = float(np.cos(2 * np.pi * time_of_day / 24))

        # Label
        delay_prob  = calc_delay_prob(
            distance_km, courier_score, rain_mm, wind_speed,
            w_sev, time_of_day, temperature, traffic_level, is_weekend
        )
        was_delayed = 1 if np.random.random() < delay_prob else 0

        data.append({
            # ── Original 9 ──────────────────────────────────────────────────
            'distance_km':               round(distance_km, 2),
            'courier_reliability_score': round(courier_score, 4),
            'rain_mm':                   round(rain_mm, 2),
            'wind_speed_kmh':            round(wind_speed, 2),
            'weather_code':              weather_code,
            'time_of_day':               time_of_day,
            'temperature_celsius':       round(temperature, 1),
            'traffic_level':             round(traffic_level, 1),
            'is_weekend':                int(is_weekend),
            # ── V2 engineered (5) ───────────────────────────────────────────
            'weather_severity':          w_sev,
            'is_peak_hour':              peak_hour,
            'distance_bucket':           dist_bucket,
            'rain_x_traffic':            round(float(rain_x_traffic), 4),
            'courier_x_distance':        round(float(courier_x_distance), 4),
            # ── V3 new features (8) ─────────────────────────────────────────
            'is_monsoon':                int(is_monsoon),
            'day_of_week':               day_of_week,
            'wind_x_rain':               round(float(wind_x_rain), 4),
            'weather_x_peak':            round(float(weather_x_peak), 4),
            'courier_x_weather':         round(float(courier_x_weather), 4),
            'traffic_x_dist':            round(float(traffic_x_dist), 4),
            'time_sin':                  round(time_sin, 4),
            'time_cos':                  round(time_cos, 4),
            # ── Labels ──────────────────────────────────────────────────────
            'delay_probability':         round(delay_prob, 4),
            'was_delayed':               was_delayed,
        })

        if (i + 1) % 20000 == 0:
            print(f"  {i+1:,}/{NUM_SAMPLES:,}")

    df = pd.DataFrame(data)
    df.to_csv(OUTPUT_FILE, index=False)

    rate = df['was_delayed'].mean()
    print(f"\nSaved {len(df):,} records -> {OUTPUT_FILE}")
    print(f"Delayed: {df['was_delayed'].sum():,} ({rate*100:.1f}%)")
    print(f"On-time: {(~df['was_delayed'].astype(bool)).sum():,} ({(1-rate)*100:.1f}%)")
    print(f"Features: {len(df.columns) - 2} (+ 2 labels)")
    return df


if __name__ == "__main__":
    df = generate()
    print("\nDone! (v3)")
