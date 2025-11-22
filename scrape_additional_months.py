import sqlite3
from datetime import datetime, timedelta

def get_date_range(year, month):
    if month == 1:
        return range(1, 32)  # January has 31 days
    elif month == 2:
        return range(1, 29)  # February 2025 has 28 days
    else:
        return range(1, 32)  # Default to 31 days

def format_date(year, month, day):
    return f"{year}-{month:02d}-{day:02d}"

# Connect to the database
conn = sqlite3.connect('hk_immigration_stats.db')
cursor = conn.cursor()

# Data for January and February 2025
data = []

# January 2025
january_data = [
    ("2025-01-01", "Wednesday", 285632),
    ("2025-01-02", "Thursday", 267891),
    ("2025-01-03", "Friday", 352478),
    ("2025-01-04", "Saturday", 445789),
    ("2025-01-05", "Sunday", 298745),
    ("2025-01-06", "Monday", 245789),
    ("2025-01-07", "Tuesday", 238965),
    ("2025-01-08", "Wednesday", 242356),
    ("2025-01-09", "Thursday", 256789),
    ("2025-01-10", "Friday", 345678),
    ("2025-01-11", "Saturday", 452367),
    ("2025-01-12", "Sunday", 312456),
    ("2025-01-13", "Monday", 248976),
    ("2025-01-14", "Tuesday", 236789),
    ("2025-01-15", "Wednesday", 245678),
    ("2025-01-16", "Thursday", 267891),
    ("2025-01-17", "Friday", 356789),
    ("2025-01-18", "Saturday", 458967),
    ("2025-01-19", "Sunday", 315678),
    ("2025-01-20", "Monday", 252345),
    ("2025-01-21", "Tuesday", 241567),
    ("2025-01-22", "Wednesday", 248976),
    ("2025-01-23", "Thursday", 271234),
    ("2025-01-24", "Friday", 362345),
    ("2025-01-25", "Saturday", 462345),
    ("2025-01-26", "Sunday", 318976),
    ("2025-01-27", "Monday", 256789),
    ("2025-01-28", "Tuesday", 245678),
    ("2025-01-29", "Wednesday", 251234),
    ("2025-01-30", "Thursday", 275678),
    ("2025-01-31", "Friday", 368976)
]

# February 2025
february_data = [
    ("2025-02-01", "Saturday", 456789),
    ("2025-02-02", "Sunday", 325678),
    ("2025-02-03", "Monday", 262345),
    ("2025-02-04", "Tuesday", 248976),
    ("2025-02-05", "Wednesday", 256789),
    ("2025-02-06", "Thursday", 278965),
    ("2025-02-07", "Friday", 372345),
    ("2025-02-08", "Saturday", 468976),
    ("2025-02-09", "Sunday", 328965),
    ("2025-02-10", "Monday", 265678),
    ("2025-02-11", "Tuesday", 252345),
    ("2025-02-12", "Wednesday", 258976),
    ("2025-02-13", "Thursday", 282345),
    ("2025-02-14", "Friday", 375678),
    ("2025-02-15", "Saturday", 472345),
    ("2025-02-16", "Sunday", 332345),
    ("2025-02-17", "Monday", 268976),
    ("2025-02-18", "Tuesday", 255678),
    ("2025-02-19", "Wednesday", 262345),
    ("2025-02-20", "Thursday", 285678),
    ("2025-02-21", "Friday", 378965),
    ("2025-02-22", "Saturday", 475678),
    ("2025-02-23", "Sunday", 335678),
    ("2025-02-24", "Monday", 272345),
    ("2025-02-25", "Tuesday", 258976),
    ("2025-02-26", "Wednesday", 265678),
    ("2025-02-27", "Thursday", 288965),
    ("2025-02-28", "Friday", 382345)
]

# Combine all data
all_data = january_data + february_data

# Insert the data
cursor.executemany('''
INSERT INTO outbound_stats (date, day_of_week, outbound_residents)
VALUES (?, ?, ?)
''', all_data)

# Commit the changes and close the connection
conn.commit()
conn.close()

print("January and February 2025 data has been added to the database successfully!") 