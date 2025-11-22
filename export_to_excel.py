import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
import openpyxl
from datetime import datetime
import os

# Connect to the database
conn = sqlite3.connect('hk_immigration_stats.db')

# Query the data
query = '''
SELECT date, day_of_week, outbound_residents 
FROM outbound_stats 
ORDER BY date
'''

# Read data into a pandas DataFrame
df = pd.read_sql_query(query, conn)

# Convert date to datetime
df['date'] = pd.to_datetime(df['date'])
df['month'] = df['date'].dt.strftime('%Y-%m')

# Create an Excel writer object
with pd.ExcelWriter('hk_outbound_stats_2025_q1.xlsx', engine='openpyxl') as writer:
    # Write the main data
    df.to_excel(writer, sheet_name='Daily Data', index=False)
    
    # Monthly statistics
    monthly_stats = df.groupby('month').agg({
        'outbound_residents': ['count', 'sum', 'mean', 'min', 'max']
    }).round(2)
    monthly_stats.columns = ['Days', 'Total Residents', 'Average Daily', 'Minimum', 'Maximum']
    monthly_stats.to_excel(writer, sheet_name='Monthly Summary')
    
    # Daily averages by month
    pivot_table = pd.pivot_table(
        df,
        values='outbound_residents',
        index='day_of_week',
        columns='month',
        aggfunc='mean'
    ).round(2)
    
    # Reorder days of week
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    pivot_table = pivot_table.reindex(day_order)
    
    pivot_table.to_excel(writer, sheet_name='Daily Averages by Month')
    
    # Create a chart of daily averages
    plt.figure(figsize=(12, 6))
    df.groupby('day_of_week')['outbound_residents'].mean().reindex(day_order).plot(kind='bar')
    plt.title('Average Daily Outbound Residents by Day of Week (Q1 2025)')
    plt.xlabel('Day of Week')
    plt.ylabel('Average Number of Residents')
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    # Save the chart to the Excel file
    plt.savefig('temp_chart.png')
    worksheet = writer.book.create_sheet('Charts')
    img = openpyxl.drawing.image.Image('temp_chart.png')
    worksheet.add_image(img, 'A1')
    
    # Format worksheets
    for sheet_name in writer.sheets:
        worksheet = writer.sheets[sheet_name]
        for column in worksheet.columns:
            max_length = 0
            column_name = openpyxl.utils.get_column_letter(column[0].column)
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2)
            worksheet.column_dimensions[column_name].width = adjusted_width

conn.close()

# Clean up temporary files
if os.path.exists('temp_chart.png'):
    os.remove('temp_chart.png')

print("Excel file 'hk_outbound_stats_2025_q1.xlsx' has been created successfully!") 