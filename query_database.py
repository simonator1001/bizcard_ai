import sqlite3

# Connect to the database
conn = sqlite3.connect('hk_immigration_stats.db')
cursor = conn.cursor()

# Query to get all records
cursor.execute('''
SELECT date, day_of_week, outbound_residents 
FROM outbound_stats 
ORDER BY date
''')

# Fetch all records
records = cursor.fetchall()

# Print the records in a formatted way
print("\nHong Kong Outbound Residents Statistics - March 2025")
print("-" * 60)
print(f"{'Date':<12} {'Day':<10} {'Outbound Residents':>20}")
print("-" * 60)

for record in records:
    date, day, residents = record
    print(f"{date:<12} {day:<10} {residents:>20,}")

# Calculate some statistics
cursor.execute('SELECT COUNT(*) from outbound_stats')
total_days = cursor.fetchone()[0]

cursor.execute('SELECT SUM(outbound_residents) from outbound_stats')
total_residents = cursor.fetchone()[0]

cursor.execute('SELECT AVG(outbound_residents) from outbound_stats')
avg_residents = cursor.fetchone()[0]

cursor.execute('''
SELECT day_of_week, AVG(outbound_residents) 
FROM outbound_stats 
GROUP BY day_of_week
ORDER BY 
    CASE day_of_week 
        WHEN 'Monday' THEN 1 
        WHEN 'Tuesday' THEN 2 
        WHEN 'Wednesday' THEN 3 
        WHEN 'Thursday' THEN 4 
        WHEN 'Friday' THEN 5 
        WHEN 'Saturday' THEN 6 
        WHEN 'Sunday' THEN 7 
    END
''')
daily_averages = cursor.fetchall()

print("\nSummary Statistics:")
print("-" * 60)
print(f"Total Days: {total_days}")
print(f"Total Outbound Residents: {total_residents:,}")
print(f"Average Daily Outbound Residents: {avg_residents:,.2f}")

print("\nAverage by Day of Week:")
print("-" * 60)
for day, avg in daily_averages:
    print(f"{day:<10}: {avg:,.2f}")

conn.close() 