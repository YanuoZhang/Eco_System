# ml_service/app.py
from fastapi import FastAPI, HTTPException
import uvicorn
from data_loader import load_data
from model import train_baseline_model, predict_emission

app = FastAPI(title="EcoPath ML Service", version="3.1")

@app.post("/train")
def train_model():
    try:
        df = load_data()
        train_baseline_model(df)
        return {"success": True, "message": "✅ Model trained and saved successfully.", "rows_loaded": len(df)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
def predict_all():
    """
    自动预测未来 10 年各州的排放量。
    """
    try:
        from model import predict_emission
        predictions = predict_emission({})  # 返回纯数字的 predicted_emission_mt

        # ✅ 确保 predicted_emission_mt 是 float
        for p in predictions:
            p["predicted_emission_mt"] = float(p["predicted_emission_mt"])

        return {
            "success": True,
            "predictions": predictions,
            "summary": f"Predicted {len(predictions)} records (2026–2036)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001, reload=True)
