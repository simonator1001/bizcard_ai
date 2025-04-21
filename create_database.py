import sqlite3
from datetime import datetime

# Create a connection to the database
conn = sqlite3.connect('hk_immigration_stats.db')
cursor = conn.cursor()

# Create the table
cursor.execute('''
CREATE TABLE IF NOT EXISTS outbound_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    day_of_week TEXT NOT NULL,
    outbound_residents INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Data to insert
data = [
    ("2025-03-01", "Saturday", 442614),
    ("2025-03-02", "Sunday", 301960),
    ("2025-03-03", "Monday", 254445),
    ("2025-03-04", "Tuesday", 240487),
    ("2025-03-05", "Wednesday", 241669),
    ("2025-03-06", "Thursday", 251583),
    ("2025-03-07", "Friday", 347230),
    ("2025-03-08", "Saturday", 463831),
    ("2025-03-09", "Sunday", 313569),
    ("2025-03-10", "Monday", 267612),
    ("2025-03-11", "Tuesday", 258977),
    ("2025-03-12", "Wednesday", 257966),
    ("2025-03-13", "Thursday", 277278),
    ("2025-03-14", "Friday", 368063),
    ("2025-03-15", "Saturday", 458921),
    ("2025-03-16", "Sunday", 312445),
    ("2025-03-17", "Monday", 264778),
    ("2025-03-18", "Tuesday", 259632),
    ("2025-03-19", "Wednesday", 261897),
    ("2025-03-20", "Thursday", 278445),
    ("2025-03-21", "Friday", 371256),
    ("2025-03-22", "Saturday", 461408),
    ("2025-03-23", "Sunday", 308103),
    ("2025-03-24", "Monday", 265789),
    ("2025-03-25", "Tuesday", 257896),
    ("2025-03-26", "Wednesday", 262445),
    ("2025-03-27", "Thursday", 282914),
    ("2025-03-28", "Friday", 359402),
    ("2025-03-29", "Saturday", 453021),
    ("2025-03-30", "Sunday", 476558),
    ("2025-03-31", "Monday", 268778)
]

# Insert the data
cursor.executemany('''
INSERT INTO outbound_stats (date, day_of_week, outbound_residents)
VALUES (?, ?, ?)
''', data)

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Database created and data inserted successfully!") 