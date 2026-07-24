import io
import numpy as np
import pandas as pd
from fastapi import HTTPException

HORIZON_MAP = {
    "daily": 1095,    # fallback if no explicit horizon is given (3 years daily)
    "weekly": 156,    # fallback (3 years weekly)
    "monthly": 36,    # fallback (3 years monthly)
}

DELTA_MAP = {
    "daily": pd.Timedelta(days=1),
    "weekly": pd.Timedelta(weeks=1),
    "monthly": pd.Timedelta(days=30),
}


def parse_csv(contents: bytes, date_column: str, value_column: str) -> dict:
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")

    if date_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Date column '{date_column}' not found")
    if value_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Value column '{value_column}' not found")

    df[date_column] = pd.to_datetime(df[date_column])
    df = df.sort_values(date_column)
    df = df.dropna(subset=[value_column])

    return {
        "dates": df[date_column].tolist(),
        "values": df[value_column].tolist(),
    }


def get_horizon(frequency: str) -> int:
    return HORIZON_MAP.get(frequency, HORIZON_MAP["daily"])


def get_delta(frequency: str) -> pd.Timedelta:
    return DELTA_MAP.get(frequency, DELTA_MAP["daily"])


def generate_future_dates(last_date, horizon: int, frequency: str) -> list:
    delta = get_delta(frequency)
    return [(last_date + delta * (i + 1)).strftime("%Y-%m-%d") for i in range(horizon)]


def calculate_metrics(actual: list, predicted: list) -> dict:
    actual = np.array(actual, dtype=np.float64)
    predicted = np.array(predicted, dtype=np.float64)

    mae = float(np.mean(np.abs(actual - predicted)))
    rmse = float(np.sqrt(np.mean((actual - predicted) ** 2)))

    nonzero = actual != 0
    mape = float(np.mean(np.abs((actual[nonzero] - predicted[nonzero]) / actual[nonzero])) * 100) if nonzero.any() else 0.0

    denom = np.abs(actual) + np.abs(predicted)
    nonzero_denom = denom != 0
    smape = float(np.mean(2 * np.abs(actual[nonzero_denom] - predicted[nonzero_denom]) / denom[nonzero_denom]) * 100) if nonzero_denom.any() else 0.0

    ss_res = np.sum((actual - predicted) ** 2)
    ss_tot = np.sum((actual - np.mean(actual)) ** 2)
    r2 = float(1 - (ss_res / ss_tot)) if ss_tot != 0 else 0.0

    return {
        "mae": mae,
        "rmse": rmse,
        "mape": mape,
        "smape": smape,
        "r2": r2,
        "n_points": int(len(actual)),
    }
