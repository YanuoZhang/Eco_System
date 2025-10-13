# ml_service/data_loader.py
import pandas as pd
import psycopg2
import os

def load_data():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        dbname=os.getenv("DB_NAME", "ecopath"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "EcoPath2024!")
    )

    query = """
    SELECT e.state_id, e.year, e.emissions_mt, p.population
    FROM emission_total e
    JOIN population p
      ON e.state_id = p.state_id AND e.year = p.year
    WHERE e.emissions_mt IS NOT NULL AND p.population IS NOT NULL
    ORDER BY e.state_id, e.year;
    """

    df = pd.read_sql_query(query, conn)
    conn.close()

    print(f"✅ Loaded {len(df)} rows from database")
    return df
