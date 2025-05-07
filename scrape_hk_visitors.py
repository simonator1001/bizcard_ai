import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from datetime import datetime, timedelta

def get_data_for_date(date_str):
    """
    Fetch data for a specific date from the HK Immigration Department website
    """
    url = f"https://www.immd.gov.hk/hkt/facts/passenger-statistics.html?d={date_str}"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the date in the table
    date_row = soup.find('table').find_all('tr')[1]
    date = date_row.find('td').text.strip()
    
    # Find the day of week in the table
    day_row = soup.find('table').find_all('tr')[2]
    day_of_week = day_row.find('td').text.strip()
    
    # Find the total row (last row)
    total_row = soup.find('table').find_all('tr')[-1]
    cells = total_row.find_all('td')
    
    # Get outbound data (Hong Kong residents)
    hk_residents_outbound = cells[5].text.strip()
    
    return {
        'date': date,
        'day_of_week': day_of_week,
        'hk_residents_outbound': hk_residents_outbound
    }

def main():
    # Start date: March 1, 2025
    start_date = datetime(2025, 3, 1)
    
    # End date: March 31, 2025
    end_date = datetime(2025, 3, 31)
    
    all_data = []
    
    # Loop through each day in March 2025
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y%m%d")
        print(f"Fetching data for {date_str}...")
        
        try:
            data = get_data_for_date(date_str)
            all_data.append(data)
            print(f"Successfully fetched data for {date_str}")
        except Exception as e:
            print(f"Error fetching data for {date_str}: {e}")
        
        # Add a small delay to be respectful of the server
        time.sleep(1)
        
        # Move to the next day
        current_date += timedelta(days=1)
    
    # Convert to DataFrame and save to CSV
    df = pd.DataFrame(all_data)
    df.to_csv('data/hk_outbound_visitors_mar_2025.csv', index=False)
    
    print("Data collection complete. Results saved to 'data/hk_outbound_visitors_mar_2025.csv'")
    
    # Print a simple summary
    print("\nSummary of Hong Kong Outbound Residents (March 2025):")
    print(f"Total days collected: {len(df)}")
    
    # Convert string to numeric, removing commas
    df['hk_residents_outbound'] = df['hk_residents_outbound'].str.replace(',', '').astype(int)
    
    print(f"Total outbound Hong Kong residents: {df['hk_residents_outbound'].sum():,}")
    print(f"Average daily outbound Hong Kong residents: {df['hk_residents_outbound'].mean():,.0f}")
    print(f"Highest day: {df.loc[df['hk_residents_outbound'].idxmax(), 'date']} ({df['hk_residents_outbound'].max():,})")
    print(f"Lowest day: {df.loc[df['hk_residents_outbound'].idxmin(), 'date']} ({df['hk_residents_outbound'].min():,})")
    
    # Create a markdown table
    print("\nMarkdown Table of Hong Kong Outbound Residents (March 2025):")
    markdown_table = "| Date | Day of Week | HK Residents Outbound |\n"
    markdown_table += "| ---- | ----------- | --------------------- |\n"
    
    for _, row in df.iterrows():
        markdown_table += f"| {row['date']} | {row['day_of_week']} | {row['hk_residents_outbound']} |\n"
    
    print(markdown_table)
    
    # Save the markdown table to a file
    with open('data/hk_outbound_visitors_mar_2025.md', 'w') as f:
        f.write(markdown_table)
    
    print("Markdown table saved to 'data/hk_outbound_visitors_mar_2025.md'")

if __name__ == "__main__":
    main() 