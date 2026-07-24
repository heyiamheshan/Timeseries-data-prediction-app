import asyncio
import contextlib
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io
from forecaster import forecaster
from utils.csv_helper import parse_csv, get_horizon, generate_future_dates, calculate_metrics

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
    request: Request,
    file: UploadFile = File(...),
    date_column: str = "date",
    value_column: str = "value",
    frequency: str = "daily",
    horizon: int = None
):
    disconnect_event = asyncio.Event()

    async def monitor_disconnect() -> None:
        while not disconnect_event.is_set():
            if await request.is_disconnected():
                disconnect_event.set()
                break
            await asyncio.sleep(0.1)

    monitor_task = asyncio.create_task(monitor_disconnect())

    try:
        if await request.is_disconnected():
            disconnect_event.set()
            raise HTTPException(status_code=499, detail="Request cancelled")

        contents = await file.read()
        if await request.is_disconnected():
            disconnect_event.set()
            raise HTTPException(status_code=499, detail="Request cancelled")

        parsed = parse_csv(contents, date_column, value_column)

        values = parsed["values"]
        dates  = parsed["dates"]

        if horizon is None or horizon < 1:
            horizon = get_horizon(frequency)

        # Run TimesFM forecast
        try:
            result = await asyncio.to_thread(
                forecaster.predict,
                values,
                horizon,
                lambda: disconnect_event.is_set(),
            )
        except asyncio.CancelledError:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

        if await request.is_disconnected():
            disconnect_event.set()
            raise HTTPException(status_code=499, detail="Request cancelled")

        forecast_dates = generate_future_dates(dates[-1], horizon, frequency)
    finally:
        monitor_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await monitor_task

    return {
        "historical": {
            "dates" : [d.strftime("%Y-%m-%d") for d in dates],
            "values": values,
        },
        "forecast": {
            "dates"      : forecast_dates,
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


@app.post("/validate")
async def validate(
    request: Request,
    file: UploadFile = File(...),
    date_column: str = "date",
    value_column: str = "value",
    split_ratio: float = 0.7
):
    disconnect_event = asyncio.Event()

    async def monitor_disconnect() -> None:
        while not disconnect_event.is_set():
            if await request.is_disconnected():
                disconnect_event.set()
                break
            await asyncio.sleep(0.1)

    monitor_task = asyncio.create_task(monitor_disconnect())

    try:
        if not (0.1 <= split_ratio <= 0.9):
            raise HTTPException(status_code=400, detail="split_ratio must be between 0.1 and 0.9")

        if await request.is_disconnected():
            disconnect_event.set()
            raise HTTPException(status_code=499, detail="Request cancelled")

        contents = await file.read()
        if await request.is_disconnected():
            disconnect_event.set()
            raise HTTPException(status_code=499, detail="Request cancelled")

        parsed = parse_csv(contents, date_column, value_column)

        values = parsed["values"]
        dates  = parsed["dates"]

        total_rows = len(values)
        split_idx = int(total_rows * split_ratio)

        if split_idx < 1 or split_idx >= total_rows:
            raise HTTPException(status_code=400, detail="Split ratio leaves too few rows in context or held-out set")

        context_values = values[:split_idx]
        context_dates  = dates[:split_idx]
        held_out_values = values[split_idx:]
        held_out_dates  = dates[split_idx:]

        horizon = len(held_out_values)

        try:
            result = await asyncio.to_thread(
                forecaster.predict,
                context_values,
                horizon,
                lambda: disconnect_event.is_set(),
            )
        except asyncio.CancelledError:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

        if await request.is_disconnected():
            disconnect_event.set()
            raise HTTPException(status_code=499, detail="Request cancelled")

        predicted_values = result["predictions"][:horizon]
    finally:
        monitor_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await monitor_task

    lower_bound = result["lower_bound"][:horizon] if result["lower_bound"] else []
    upper_bound = result["upper_bound"][:horizon] if result["upper_bound"] else []

    metrics = calculate_metrics(held_out_values, predicted_values)

    held_out_date_strs = [d.strftime("%Y-%m-%d") for d in held_out_dates]

    return {
        "context": {
            "dates" : [d.strftime("%Y-%m-%d") for d in context_dates],
            "values": context_values,
        },
        "held_out": {
            "dates" : held_out_date_strs,
            "values": held_out_values,
        },
        "predicted": {
            "dates"      : held_out_date_strs,
            "values"     : predicted_values,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
        },
        "metrics": metrics,
        "split_info": {
            "total_rows"    : total_rows,
            "context_rows"  : split_idx,
            "held_out_rows" : horizon,
            "split_ratio"   : split_ratio,
            "context_start" : context_dates[0].strftime("%Y-%m-%d"),
            "context_end"   : context_dates[-1].strftime("%Y-%m-%d"),
            "held_out_start": held_out_dates[0].strftime("%Y-%m-%d"),
            "held_out_end"  : held_out_dates[-1].strftime("%Y-%m-%d"),
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