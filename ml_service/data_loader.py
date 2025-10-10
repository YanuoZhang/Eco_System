# ml_service/data_loader.py
import pandas as pd
import psycopg2

def load_data():
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        dbname="ecopath",
        user="postgres",
        password="EcoPath2024!"
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
