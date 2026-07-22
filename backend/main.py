from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import numpy as np
import io
from datetime import datetime, timedelta
from forecaster import forecaster

app = FastAPI(title="TimesFM Forecasting API")

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    forecaster.load_model()


@app.get("/")
def root():
    return {"status": "TimesFM API running"}


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": forecaster.model is not None
    }


@app.post("/forecast")
async def forecast(
    file: UploadFile = File(...),
    date_column: str = "date",
    value_column: str = "value",
    frequency: str = "daily"
):
    # Read uploaded CSV
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

    # Validate columns
    if date_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Date column '{date_column}' not found")
    if value_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Value column '{value_column}' not found")

    # Parse dates and values
    df[date_column] = pd.to_datetime(df[date_column])
    df = df.sort_values(date_column)
    df = df.dropna(subset=[value_column])

    values = df[value_column].tolist()
    dates  = df[date_column].tolist()

    # Set horizon based on frequency
    freq_map = {
        "daily"   : 1095,  # 3 years daily
        "weekly"  : 156,   # 3 years weekly
        "monthly" : 36,    # 3 years monthly
    }
    horizon = freq_map.get(frequency, 1095)

    # Run TimesFM forecast
    try:
        result = forecaster.predict(values, horizon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

    # Generate future dates
    last_date = dates[-1]
    freq_delta = {
        "daily"   : timedelta(days=1),
        "weekly"  : timedelta(weeks=1),
        "monthly" : timedelta(days=30),
    }
    delta = freq_delta.get(frequency, timedelta(days=1))

    future_dates = [
        (last_date + delta * (i + 1)).strftime("%Y-%m-%d")
        for i in range(horizon)
    ]

    return {
        "historical": {
            "dates" : [d.strftime("%Y-%m-%d") for d in dates],
            "values": values,
        },
        "forecast": {
            "dates"      : future_dates,
            "values"     : result["predictions"],
            "lower_bound": result["lower_bound"],
            "upper_bound": result["upper_bound"],
        },
        "metadata": {
            "frequency"       : frequency,
            "horizon"         : horizon,
            "historical_points": len(values),
            "model"           : "TimesFM 2.5"
        }
    }


@app.post("/download")
async def download(data: dict):
    # Build CSV from forecast data
    rows = []

    # Historical rows
    for date, val in zip(
        data["historical"]["dates"],
        data["historical"]["values"]
    ):
        rows.append({
            "date"       : date,
            "actual"     : val,
            "predicted"  : "",
            "lower_bound": "",
            "upper_bound": ""
        })

    # Forecast rows
    for i, date in enumerate(data["forecast"]["dates"]):
        rows.append({
            "date"       : date,
            "actual"     : "",
            "predicted"  : data["forecast"]["values"][i],
            "lower_bound": data["forecast"]["lower_bound"][i] if data["forecast"]["lower_bound"] else "",
            "upper_bound": data["forecast"]["upper_bound"][i] if data["forecast"]["upper_bound"] else "",
        })

    df = pd.DataFrame(rows)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    return StreamingResponse(
        io.BytesIO(csv_buffer.getvalue().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=timesfm_forecast.csv"
        }
    )