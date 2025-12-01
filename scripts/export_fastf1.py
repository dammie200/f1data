"""
Minimal FastF1 export helper.

This script turns FastF1 session data into the JSON shape consumed by the
Next.js app (see `data/fastf1/season-<year>.json`). It requires Python with the
`fastf1` and `pandas` packages installed.

Usage:
    python scripts/export_fastf1.py 2024 --cache .fastf1-cache --out data/fastf1/season-2024.json

Notes:
    - FastF1 downloads timing data the first time it runs; the `--cache` flag
      points to the cache directory so subsequent runs are quick.
    - Telemetry is intentionally skipped to keep exports light. You can extend
      the payload by adding additional fields to the `race_payload` dict.
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import fastf1
except ModuleNotFoundError as exc:  # pragma: no cover - guard for missing optional dependency
    raise SystemExit(
        "FastF1 is required to export data. Install Python deps with: "
        "python -m pip install -r scripts/requirements.txt"
    ) from exc


def export_season(season: int, out_path: Path, cache: Path | None = None):
    if cache:
        cache.mkdir(parents=True, exist_ok=True)
        fastf1.Cache.enable_cache(cache_dir=str(cache))

    schedule = fastf1.get_event_schedule(season, include_testing=False)

    races = []
    for _, event in schedule.iterrows():
        if event.get('EventFormat') == 'testing':
            continue

        session = fastf1.get_session(event['Year'], event['RoundNumber'], 'R')
        session.load(laps=False, weather=False, telemetry=False)

        results = []
        for row in session.results.itertuples():
            driver = {
                "driverId": str(row.DriverId),
                "code": row.Abbreviation,
                "givenName": row.FirstName,
                "familyName": row.LastName,
                "dateOfBirth": str(getattr(row, "DateOfBirth", "")),
                "nationality": row.Nationality,
            }
            constructor = {
                "constructorId": row.TeamName.lower().replace(" ", "_"),
                "name": row.TeamName,
                "nationality": row.TeamCountry,
            }
            results.append(
                {
                    "position": str(row.Position),
                    "points": str(row.Points),
                    "grid": str(getattr(row, "GridPosition", "")),
                    "laps": str(row.Laps),
                    "status": row.Status,
                    "Time": {"time": str(getattr(row, "Time", ""))} if getattr(row, "Time", None) else None,
                    "FastestLap": {
                        "rank": str(getattr(row, "FastestLapRank", "")),
                        "Time": {"time": str(getattr(row, "FastestLapTime", ""))},
                    }
                    if getattr(row, "FastestLapTime", None)
                    else None,
                    "Driver": driver,
                    "Constructor": constructor,
                }
            )

        quali = None
        try:
            quali_session = fastf1.get_session(event['Year'], event['RoundNumber'], 'Q')
            quali_session.load(laps=False, weather=False, telemetry=False)
            quali = []
            for row in quali_session.results.itertuples():
                driver = {
                    "driverId": str(row.DriverId),
                    "code": row.Abbreviation,
                    "givenName": row.FirstName,
                    "familyName": row.LastName,
                    "dateOfBirth": str(getattr(row, "DateOfBirth", "")),
                    "nationality": row.Nationality,
                }
                constructor = {
                    "constructorId": row.TeamName.lower().replace(" ", "_"),
                    "name": row.TeamName,
                    "nationality": row.TeamCountry,
                }
                quali.append(
                    {
                        "position": str(row.Position),
                        "Q1": str(getattr(row, "Q1", "")) or None,
                        "Q2": str(getattr(row, "Q2", "")) or None,
                        "Q3": str(getattr(row, "Q3", "")) or None,
                        "Driver": driver,
                        "Constructor": constructor,
                    }
                )
        except Exception:
            pass  # leave quali as None/empty if the session is missing

        race_payload = {
            "season": str(event['Year']),
            "round": str(event['RoundNumber']),
            "raceName": event['EventName'],
            "date": str(event['EventDate']),
            "Circuit": {
                "circuitId": str(event['Location']).lower().replace(" ", "_"),
                "circuitName": event['EventName'],
                "Location": {"locality": event['Location'], "country": event['Country']},
            },
            "Results": results,
            "QualifyingResults": quali or [],
        }
        races.append(race_payload)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open('w', encoding='utf-8') as f:
        json.dump({"season": season, "races": races}, f, indent=2)
    print(f"Exported {len(races)} races to {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Export FastF1 data to JSON")
    parser.add_argument("season", type=int)
    parser.add_argument("--out", type=Path, required=True, help="Output path for season JSON")
    parser.add_argument("--cache", type=Path, help="Cache directory for FastF1 downloads")
    args = parser.parse_args()

    try:
        export_season(args.season, args.out, cache=args.cache)
    except Exception as exc:
        print("Failed to export season", exc, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
