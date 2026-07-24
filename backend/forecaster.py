import os
from typing import Callable
import numpy as np
import torch
from transformers import TimesFm2_5ModelForPrediction

MODEL_CACHE_DIR = os.path.join(os.path.dirname(__file__), "models")


class TimesFMForecaster:
    def __init__(self):
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_model(self):
        print(f"Loading TimesFM model on {self.device}...")
        self.model = TimesFm2_5ModelForPrediction.from_pretrained(
            "google/timesfm-2.5-200m-transformers",
            cache_dir=MODEL_CACHE_DIR,
            device_map="auto",
        )
        print("TimesFM model loaded successfully")

    def predict(self, values: list, horizon: int = 1095, stop_check: Callable[[], bool] | None = None) -> dict:
        if self.model is None:
            self.load_model()

        stop_check = stop_check or (lambda: False)

        # Run inference in chunks
        all_predictions = []
        context = np.array(values, dtype=np.float32)
        days_predicted = 0
        quantiles_use = []

        while days_predicted < horizon:
            if stop_check():
                break

            tensor = [torch.tensor(
                context,
                dtype=torch.float32,
                device=next(self.model.parameters()).device
            )]

            with torch.no_grad():
                outputs = self.model(
                    past_values=tensor,
                    return_dict=True
                )

            chunk = outputs.mean_predictions.cpu().numpy()[0]
            quantiles = outputs.full_predictions.cpu().numpy()[0]

            remaining = horizon - days_predicted
            chunk_use = chunk[:min(128, remaining)]
            quantiles_use = quantiles[:min(128, remaining)]

            all_predictions.extend(chunk_use.tolist())
            days_predicted += len(chunk_use)
            context = np.concatenate([context, chunk_use])

        return {
            "predictions": all_predictions[:horizon],
            "lower_bound": [float(q[1]) for q in quantiles_use[:horizon]] if len(quantiles_use) else [],
            "upper_bound": [float(q[-2]) for q in quantiles_use[:horizon]] if len(quantiles_use) else [],
        }


# Single instance — loaded once at startup
forecaster = TimesFMForecaster() 