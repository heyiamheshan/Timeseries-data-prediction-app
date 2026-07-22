import numpy as np
import pandas as pd
import torch
from transformers import TimesFm2_5ModelForPrediction


class TimesFMForecaster:
    def __init__(self):
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_model(self):
        print(f"Loading TimesFM model on {self.device}...")
        self.model = TimesFm2_5ModelForPrediction.from_pretrained(
            "google/timesfm-2.5-200m-transformers",
            device_map="auto",
        )
        print("TimesFM model loaded successfully")

    def predict(self, values: list, horizon: int = 1095) -> dict:
        if self.model is None:
            self.load_model()

        # Convert to tensor
        input_tensor = [torch.tensor(
            np.array(values, dtype=np.float32),
            dtype=torch.float32,
            device=next(self.model.parameters()).device
        )]

        # Run inference in chunks
        all_predictions = []
        context = np.array(values, dtype=np.float32)
        days_predicted = 0

        while days_predicted < horizon:
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
            "lower_bound": [float(q[1]) for q in quantiles_use[:horizon]] if len(all_predictions) <= 128 else [],
            "upper_bound": [float(q[-2]) for q in quantiles_use[:horizon]] if len(all_predictions) <= 128 else [],
        }


# Single instance — loaded once at startup
forecaster = TimesFMForecaster() 