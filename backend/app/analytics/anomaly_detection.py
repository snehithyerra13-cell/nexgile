from typing import List
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from app.models.emissions import EmissionRecord
from app.models.facilities import Facility
from app.schemas.analytics import AnomalyItem

def detect_emissions_anomalies(db: Session) -> List[AnomalyItem]:
    """
    Detects monthly emission anomalies using IsolationForest and Z-Score statistics.
    Evaluates facilities and categories across time.
    """
    records = db.query(EmissionRecord).all()
    if not records:
        return []

    # Map facility IDs to names
    facilities = {f.id: f.name for f in db.query(Facility).all()}

    data = []
    for r in records:
        data.append({
            "id": r.id,
            "facility_id": r.facility_id,
            "facility_name": facilities.get(r.facility_id, f"Facility #{r.facility_id}"),
            "year": r.reporting_year,
            "month": r.reporting_month,
            "scope": r.scope,
            "category": r.category,
            "activity_type": r.activity_type,
            "amount": r.activity_amount,
            "emissions": r.calculated_emissions,
            "unit": r.activity_unit
        })

    df = pd.DataFrame(data)
    if len(df) < 5:
        return []

    anomalies: List[AnomalyItem] = []

    # Group by facility and category to detect localized anomalies
    for (fac_name, cat), group in df.groupby(["facility_name", "category"]):
        if len(group) < 3:
            continue

        values = group["emissions"].values
        mean_val = float(np.mean(values))
        std_val = float(np.std(values))
        if std_val == 0:
            continue

        # Z-scores
        z_scores = (values - mean_val) / std_val

        # Isolation forest if enough points
        if len(values) >= 6:
            iso = IsolationForest(contamination=0.15, random_state=42)
            preds = iso.fit_predict(values.reshape(-1, 1))
        else:
            preds = np.where(np.abs(z_scores) > 1.6, -1, 1)

        for idx, (_, row) in enumerate(group.iterrows()):
            z = z_scores[idx]
            is_anomaly = preds[idx] == -1 or abs(z) > 1.8

            if is_anomaly and row["emissions"] > mean_val: # Focus primarily on abnormal upward emission spikes
                deviation = ((row["emissions"] - mean_val) / mean_val) * 100
                severity = "High" if deviation > 40 or z > 2.2 else "Medium"
                
                # Context-aware probable cause and recommendation heuristics
                cause = "Unusual surge detected relative to facility historical baseline."
                rec = "Conduct facility equipment audit and inspect sub-meter data."
                
                if "Combustion" in cat or "Diesel" in row["activity_type"]:
                    cause = "Spike in stationary combustion during grid outage or backup generator testing."
                    rec = "Verify maintenance schedules and explore battery energy storage systems (BESS)."
                elif "Electricity" in cat:
                    cause = "High cooling load or unoptimized HVAC scheduling during peak tariff hours."
                    rec = "Review smart thermostat setpoints and optimize building management system (BMS)."
                elif "Transportation" in cat or "Travel" in cat:
                    cause = "Expedited air freight logistics or unbundled supplier shipments."
                    rec = "Transition to consolidated multi-modal ground freight and review travel policies."
                elif "Goods" in cat:
                    cause = "Batch procurement spike in carbon-intensive raw materials."
                    rec = "Engage Tier-1 vendor on product carbon footprint (PCF) specifications."

                anomalies.append(AnomalyItem(
                    id=f"ANOM-{row['id']}",
                    facility=fac_name,
                    month=f"{int(row['year'])}-{int(row['month']):02d}",
                    category=cat,
                    actual_value=round(row["emissions"], 2),
                    expected_value=round(mean_val, 2),
                    unit="tCO2e",
                    deviation_pct=round(deviation, 1),
                    severity=severity,
                    probable_cause=cause,
                    recommendation=rec
                ))

    # Sort by deviation descending
    anomalies.sort(key=lambda a: a.deviation_pct, reverse=True)
    return anomalies[:10]
