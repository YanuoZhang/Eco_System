# ml_service/model.py
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
from data_loader import load_data
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "baseline.joblib")

# =========================
# 训练基线模型（含滞后特征）
# =========================
def train_baseline_model(df: pd.DataFrame):
    print("🔹 Preparing lag feature...")

    # 1️⃣ 为每个 state 生成上一年的排放量列
    df = df.sort_values(["state_id", "year"])
    df["prev_emission_mt"] = df.groupby("state_id")["emissions_mt"].shift(1)

    # 删除首年（没有前一年排放值）
    df = df.dropna(subset=["prev_emission_mt"])

    # 2️⃣ 特征与标签
    X = df[["year", "population", "prev_emission_mt"]]
    y = df["emissions_mt"]

    # 3️⃣ 训练模型
    model = RandomForestRegressor(
        n_estimators=200, random_state=42, max_depth=8
    )
    model.fit(X, y)

    # 4️⃣ 评估
    y_pred = model.predict(X)
    r2 = r2_score(y, y_pred)
    mae = mean_absolute_error(y, y_pred)
    print(f"✅ Model trained successfully | R²={r2:.3f}, MAE={mae:.3f}")

    # 保存模型
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"💾 Model saved to {MODEL_PATH}")

    return model


# =========================
# 预测未来十年排放（滚动预测）
# =========================
def predict_emission(req_data: dict):
    print("🔹 Loading trained model...")
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Model not trained yet. Run /train first.")

    model = joblib.load(MODEL_PATH)
    df = load_data()
    df = df.sort_values(["state_id", "year"])

    # 取每个 state 的最近一条数据作为起点
    last_records = df.groupby("state_id").tail(1)

    future_years = list(range(2026, 2037))
    predictions = []

    print("🔹 Starting rolling forecast for 2026–2036...")

    for _, row in last_records.iterrows():
        state = row["state_id"]
        prev_emission = row["emissions_mt"]
        population = row["population"]
        last_year = row["year"]

        for year in future_years:
            # 简单假设人口每年增长 1%
            population *= 1.01

            X_future = pd.DataFrame(
                [[year, population, prev_emission]],
                columns=["year", "population", "prev_emission_mt"]
            )
            predicted = model.predict(X_future)[0]

            predictions.append({
                "state_id": state,
                "year": int(year),
                "predicted_emission_mt": round(predicted, 3)
            })

            # 更新 prev_emission 以支持滚动预测
            prev_emission = predicted

    print(f"✅ Forecast completed for {len(predictions)} rows")
    return predictions
