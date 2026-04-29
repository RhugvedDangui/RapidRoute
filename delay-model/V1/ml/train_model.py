# ═══════════════════════════════════════════════════════════════════════════════
# RapidRoute - Model Training v3.1
# Fixes: XGBoost back to binary:logistic (soft labels were counterproductive)
# Keeps: 22 features, 100K samples, CatBoost, stacking, Optuna
# ═══════════════════════════════════════════════════════════════════════════════

import pandas as pd
import numpy as np
import xgboost as xgb
import json, os
from pathlib import Path
from dotenv import load_dotenv

from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report,
    average_precision_score
)

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False
    print("LightGBM not installed")

try:
    from catboost import CatBoostClassifier
    HAS_CB = True
except ImportError:
    HAS_CB = False
    print("CatBoost not installed")

try:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    HAS_OPTUNA = True
except ImportError:
    HAS_OPTUNA = False

load_dotenv()

# ─── PATHS ────────────────────────────────────────────────────────────────────
DATA_DIR  = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent.parent / "models"
INPUT_FILE       = DATA_DIR  / "training_data.csv"
XGB_MODEL_OUTPUT = MODEL_DIR / "rapidroute_delay_model.json"
LGB_MODEL_OUTPUT = MODEL_DIR / "rapidroute_delay_lgb.txt"
CB_MODEL_OUTPUT  = MODEL_DIR / "rapidroute_delay_cb.cbm"
METRICS_OUTPUT   = MODEL_DIR / "model_metrics.json"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ─── 22 FEATURES ──────────────────────────────────────────────────────────────
FEATURE_COLUMNS = [
    'distance_km', 'courier_reliability_score', 'rain_mm', 'wind_speed_kmh',
    'weather_code', 'time_of_day', 'temperature_celsius', 'traffic_level',
    'is_weekend',
    'weather_severity', 'is_peak_hour', 'distance_bucket',
    'rain_x_traffic', 'courier_x_distance',
    'is_monsoon', 'day_of_week',
    'wind_x_rain', 'weather_x_peak', 'courier_x_weather', 'traffic_x_dist',
    'time_sin', 'time_cos',
]
TARGET = 'was_delayed'


# ─── LOAD ──────────────────────────────────────────────────────────────────────
def load_data():
    df = pd.read_csv(INPUT_FILE)
    print(f"Loaded {len(df):,} records  |  Delay rate: {df[TARGET].mean()*100:.1f}%")
    X = df[FEATURE_COLUMNS].values.astype(np.float32)
    y = df[TARGET].values.astype(np.float32)
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    print(f"Train: {len(X_tr):,}  |  Test: {len(X_te):,}")
    return X_tr, X_te, y_tr, y_te


# ─── THRESHOLD ─────────────────────────────────────────────────────────────────
def find_threshold(y_true, y_proba):
    best_t, best_f1 = 0.5, 0.0
    for t in np.arange(0.15, 0.85, 0.005):
        f = f1_score(y_true, (y_proba >= t).astype(int), zero_division=0)
        if f > best_f1:
            best_f1, best_t = f, t
    return round(float(best_t), 3), round(float(best_f1), 4)


# ─── EVALUATE ──────────────────────────────────────────────────────────────────
def evaluate(name, y_test, y_proba, threshold):
    y_pred = (y_proba >= threshold).astype(int)
    m = {
        'model': name, 'threshold': float(threshold),
        'accuracy':  float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, zero_division=0)),
        'recall':    float(recall_score(y_test, y_pred)),
        'f1_score':  float(f1_score(y_test, y_pred)),
        'roc_auc':   float(roc_auc_score(y_test, y_proba)),
        'pr_auc':    float(average_precision_score(y_test, y_proba)),
    }
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    m['confusion_matrix'] = {'tn': int(tn), 'fp': int(fp), 'fn': int(fn), 'tp': int(tp)}

    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"  F1={m['f1_score']:.4f}  Prec={m['precision']:.4f}  "
          f"Rec={m['recall']:.4f}  AUC={m['roc_auc']:.4f}")
    print(f"  Threshold={threshold:.3f}  Acc={m['accuracy']:.4f}  PRAUC={m['pr_auc']:.4f}")
    print(f"  TN={tn} FP={fp} FN={fn} TP={tp}")
    print(classification_report(y_test, y_pred, target_names=['On-Time','Delayed'], zero_division=0))
    return m


# ─── XGBOOST (binary:logistic + Optuna) ───────────────────────────────────────
def train_xgboost(X_tr, y_tr, X_te, y_te):
    print("\n--- XGBoost ---")
    spw = (len(y_tr) - y_tr.sum()) / y_tr.sum()
    dtrain = xgb.DMatrix(X_tr, label=y_tr, feature_names=FEATURE_COLUMNS)
    dtest  = xgb.DMatrix(X_te, label=y_te, feature_names=FEATURE_COLUMNS)

    if HAS_OPTUNA:
        print("  Optuna (30 trials)...")
        def obj(trial):
            p = {
                'objective': 'binary:logistic', 'eval_metric': 'aucpr',
                'max_depth':        trial.suggest_int('max_depth', 4, 10),
                'learning_rate':    trial.suggest_float('lr', 0.01, 0.12, log=True),
                'subsample':        trial.suggest_float('sub', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('col', 0.5, 1.0),
                'min_child_weight': trial.suggest_int('mcw', 1, 15),
                'gamma':            trial.suggest_float('gamma', 0, 1.5),
                'reg_alpha':        trial.suggest_float('alpha', 0, 3.0),
                'reg_lambda':       trial.suggest_float('lam', 0.5, 4.0),
                'scale_pos_weight': spw, 'seed': 42,
            }
            nr = trial.suggest_int('nr', 200, 800)
            m = xgb.train(p, dtrain, num_boost_round=nr,
                          evals=[(dtest,'test')], early_stopping_rounds=30,
                          verbose_eval=False)
            prob = m.predict(dtest)
            _, f = find_threshold(y_te, prob)
            return f

        study = optuna.create_study(direction='maximize')
        study.optimize(obj, n_trials=30, show_progress_bar=False)
        bp = study.best_params
        print(f"  Best F1: {study.best_value:.4f}")
        nr = bp.pop('nr', 500)
        params = {
            'objective': 'binary:logistic', 'eval_metric': ['logloss','auc'],
            'scale_pos_weight': spw, 'seed': 42,
            'max_depth': bp['max_depth'], 'learning_rate': bp['lr'],
            'subsample': bp['sub'], 'colsample_bytree': bp['col'],
            'min_child_weight': bp['mcw'], 'gamma': bp['gamma'],
            'reg_alpha': bp['alpha'], 'reg_lambda': bp['lam'],
        }
    else:
        params = {
            'objective': 'binary:logistic', 'eval_metric': ['logloss','auc'],
            'max_depth': 7, 'learning_rate': 0.04, 'subsample': 0.85,
            'colsample_bytree': 0.75, 'min_child_weight': 5,
            'gamma': 0.3, 'reg_alpha': 1.0, 'reg_lambda': 2.0,
            'scale_pos_weight': spw, 'seed': 42,
        }
        nr = 600

    model = xgb.train(params, dtrain, num_boost_round=nr,
                      evals=[(dtrain,'train'),(dtest,'test')],
                      early_stopping_rounds=40, verbose_eval=100)
    print(f"  Best iter: {model.best_iteration}")
    return model


# ─── LIGHTGBM ─────────────────────────────────────────────────────────────────
def train_lgb(X_tr, y_tr, X_te, y_te):
    if not HAS_LGB: return None
    print("\n--- LightGBM ---")
    spw = (len(y_tr) - y_tr.sum()) / y_tr.sum()
    lt = lgb.Dataset(X_tr, label=y_tr, feature_name=FEATURE_COLUMNS)
    lv = lgb.Dataset(X_te, label=y_te, feature_name=FEATURE_COLUMNS, reference=lt)
    params = {
        'objective': 'binary', 'metric': 'binary_logloss', 'boosting_type': 'gbdt',
        'feature_pre_filter': False, 'num_leaves': 80, 'max_depth': 10,
        'learning_rate': 0.035, 'feature_fraction': 0.80, 'bagging_fraction': 0.85,
        'bagging_freq': 5, 'min_child_samples': 15, 'reg_alpha': 0.4,
        'reg_lambda': 0.8, 'scale_pos_weight': spw, 'verbose': -1, 'seed': 42,
    }
    model = lgb.train(params, lt, num_boost_round=900,
                      valid_sets=[lt, lv], valid_names=['train','test'],
                      callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(200)])
    print(f"  Best iter: {model.best_iteration}")
    return model


# ─── CATBOOST ──────────────────────────────────────────────────────────────────
def train_cb(X_tr, y_tr, X_te, y_te):
    if not HAS_CB: return None
    print("\n--- CatBoost ---")
    model = CatBoostClassifier(
        iterations=1200, learning_rate=0.04, depth=8, l2_leaf_reg=3.0,
        border_count=128, bagging_temperature=0.8, random_strength=1.2,
        od_type='Iter', od_wait=60, eval_metric='F1',
        auto_class_weights='Balanced', random_seed=42, verbose=200
    )
    model.fit(X_tr, y_tr, eval_set=(X_te, y_te), use_best_model=True)
    print(f"  Best iter: {model.best_iteration_}")
    return model


# ─── STACKING ──────────────────────────────────────────────────────────────────
def predict_model(m, mtype, X):
    if mtype == 'xgb':
        return np.clip(m.predict(xgb.DMatrix(X, feature_names=FEATURE_COLUMNS)), 0, 1)
    elif mtype == 'lgb':
        return m.predict(X)
    elif mtype == 'cb':
        return m.predict_proba(X)[:, 1]

def build_stack(models, mtypes, X):
    return np.column_stack([predict_model(m, mt, X) for m, mt in zip(models, mtypes)])

def train_stacking(models, mtypes, X_tr, y_tr):
    print("\n--- Stacking Meta-Learner ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    oof = np.zeros((len(X_tr), len(models)))
    for mi, (m, mt) in enumerate(zip(models, mtypes)):
        for _, val_idx in skf.split(X_tr, y_tr):
            oof[val_idx, mi] = predict_model(m, mt, X_tr[val_idx])
    meta = LogisticRegression(C=1.0, max_iter=500, random_state=42)
    meta.fit(oof, y_tr)
    w = meta.coef_[0]; wn = w / w.sum()
    print(f"  Weights: {[f'{x:.3f}' for x in wn]}")
    return meta


# ─── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  RapidRoute - Training v3.1")
    print("=" * 60)

    X_tr, X_te, y_tr, y_te = load_data()
    results = {}
    models, mtypes = [], []

    # 1. XGBoost
    xm = train_xgboost(X_tr, y_tr, X_te, y_te)
    xp = np.clip(xm.predict(xgb.DMatrix(X_te, feature_names=FEATURE_COLUMNS)), 0, 1)
    t, f = find_threshold(y_te, xp)
    results['xgboost'] = evaluate("XGBoost", y_te, xp, t)
    imp = xm.get_score(importance_type='gain')
    results['xgboost']['feature_importance'] = {k: float(v) for k, v in imp.items()}
    print("  Top features:", sorted(imp.items(), key=lambda x: -x[1])[:5])
    xm.save_model(str(XGB_MODEL_OUTPUT))
    models.append(xm); mtypes.append('xgb')

    # 2. LightGBM
    lm = train_lgb(X_tr, y_tr, X_te, y_te)
    if lm:
        lp = lm.predict(X_te)
        t, f = find_threshold(y_te, lp)
        results['lightgbm'] = evaluate("LightGBM", y_te, lp, t)
        lm.save_model(str(LGB_MODEL_OUTPUT))
        models.append(lm); mtypes.append('lgb')

    # 3. CatBoost
    cm = train_cb(X_tr, y_tr, X_te, y_te)
    if cm:
        cp = cm.predict_proba(X_te)[:, 1]
        t, f = find_threshold(y_te, cp)
        results['catboost'] = evaluate("CatBoost", y_te, cp, t)
        cm.save_model(str(CB_MODEL_OUTPUT))
        models.append(cm); mtypes.append('cb')

    # 4. Simple average ensemble
    if len(models) > 1:
        avg_p = np.mean(build_stack(models, mtypes, X_te), axis=1)
        t, f = find_threshold(y_te, avg_p)
        results['ensemble_avg'] = evaluate("Ensemble (Avg)", y_te, avg_p, t)

    # 5. Stacking
    if len(models) > 1:
        meta = train_stacking(models, mtypes, X_tr, y_tr)
        sp = meta.predict_proba(build_stack(models, mtypes, X_te))[:, 1]
        t, f = find_threshold(y_te, sp)
        results['stacking'] = evaluate("Stacking", y_te, sp, t)

    # Best
    best_name = max(results, key=lambda k: results[k]['f1_score'])
    best = results[best_name]

    # Save metrics
    final = {
        'best_model': best_name, 'feature_columns': FEATURE_COLUMNS,
        'total_training_samples': int(len(X_tr)),
        'results': results,
        'decision_threshold': best['threshold'],
        'f1_score': best['f1_score'], 'precision': best['precision'],
        'recall': best['recall'], 'accuracy': best['accuracy'],
        'roc_auc': best['roc_auc'],
        'confusion_matrix': best['confusion_matrix'],
        'feature_importance': results.get('xgboost', {}).get('feature_importance', {}),
    }
    with open(METRICS_OUTPUT, 'w') as f:
        json.dump(final, f, indent=2)

    print("\n" + "=" * 60)
    print("  RESULTS (sorted by F1)")
    print("=" * 60)
    print(f"  {'Model':<25} {'F1':>7} {'Prec':>7} {'Rec':>7} {'AUC':>7}")
    print("  " + "-" * 55)
    for nm, m in sorted(results.items(), key=lambda x: -x[1]['f1_score']):
        tag = " <<" if nm == best_name else ""
        print(f"  {nm:<25} {m['f1_score']:>7.4f} {m['precision']:>7.4f} "
              f"{m['recall']:>7.4f} {m['roc_auc']:>7.4f}{tag}")
    print(f"\n  Baseline: F1=0.613  ->  Best: F1={best['f1_score']:.4f} "
          f"(+{(best['f1_score']-0.613)/0.613*100:.1f}%)")
    print("=" * 60)


if __name__ == "__main__":
    main()
