import sqlite3
import pandas as pd
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('hk_immigration_stats.db')

# Query data for Jan-Mar
df = pd.read_sql_query('''
    SELECT 
        strftime('%Y-%m', date) as month,
        COUNT(*) as days,
        SUM(outbound_residents) as total_residents,
        AVG(outbound_residents) as avg_daily_residents,
        MIN(outbound_residents) as min_residents,
        MAX(outbound_residents) as max_residents
    FROM outbound_stats
    WHERE strftime('%m', date) IN ('01', '02', '03')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month
''', conn)

# Query daily averages for Jan-Mar
daily_avg = pd.read_sql_query('''
    SELECT 
        day_of_week,
        strftime('%Y-%m', date) as month,
        AVG(outbound_residents) as avg_residents
    FROM outbound_stats
    WHERE strftime('%m', date) IN ('01', '02', '03')
    GROUP BY day_of_week, strftime('%Y-%m', date)
    ORDER BY 
        month,
        CASE day_of_week 
            WHEN 'Monday' THEN 1 
            WHEN 'Tuesday' THEN 2 
            WHEN 'Wednesday' THEN 3 
            WHEN 'Thursday' THEN 4 
            WHEN 'Friday' THEN 5 
            WHEN 'Saturday' THEN 6 
            WHEN 'Sunday' THEN 7 
        END
''', conn)

# Print monthly summary
print("\nMonthly Summary for Jan-Mar")
print("=" * 80)
for _, row in df.iterrows():
    print(f"\nMonth: {row['month']}")
    print("-" * 40)
    print(f"Total Days: {row['days']}")
    print(f"Total Outbound Residents: {row['total_residents']:,}")
    print(f"Average Daily Residents: {row['avg_daily_residents']:,.2f}")
    print(f"Minimum Daily Residents: {row['min_residents']:,}")
    print(f"Maximum Daily Residents: {row['max_residents']:,}")

# Print daily averages by month
print("\n\nDaily Averages by Month")
print("=" * 80)
for month in daily_avg['month'].unique():
    print(f"\nMonth: {month}")
    print("-" * 40)
    month_data = daily_avg[daily_avg['month'] == month]
    for _, row in month_data.iterrows():
        print(f"{row['day_of_week']:<10}: {row['avg_residents']:,.2f}")

# Calculate Jan-Mar summary
quarter_summary = pd.read_sql_query('''
    SELECT 
        COUNT(*) as total_days,
        SUM(outbound_residents) as total_residents,
        AVG(outbound_residents) as avg_daily_residents,
        MIN(outbound_residents) as min_residents,
        MAX(outbound_residents) as max_residents
    FROM outbound_stats
    WHERE strftime('%m', date) IN ('01', '02', '03')
''', conn)

print("\n\nJan-Mar Summary")
print("=" * 80)
print(f"Total Days: {quarter_summary['total_days'].iloc[0]}")
print(f"Total Outbound Residents: {quarter_summary['total_residents'].iloc[0]:,}")
print(f"Average Daily Residents: {quarter_summary['avg_daily_residents'].iloc[0]:,.2f}")
print(f"Minimum Daily Residents: {quarter_summary['min_residents'].iloc[0]:,}")
print(f"Maximum Daily Residents: {quarter_summary['max_residents'].iloc[0]:,}")

conn.close() 