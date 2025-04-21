import pandas as pd

# Data for the days we already have from our observations
data = [
    {
        'date': '2025年3月1日',
        'day_of_week': '星期六',
        'hk_residents_outbound': '442,614'
    },
    {
        'date': '2025年3月2日',
        'day_of_week': '星期日',
        'hk_residents_outbound': '301,960'
    }
]

# Create DataFrame
df = pd.DataFrame(data)

# Save to CSV
df.to_csv('data/hk_outbound_visitors_mar_2025_partial.csv', index=False)

# Print summary
print("\nSummary of Hong Kong Outbound Residents (March 2025 - Partial Data):")
print(f"Total days collected: {len(df)}")

# Convert string to numeric, removing commas
df['hk_residents_outbound'] = df['hk_residents_outbound'].str.replace(',', '').astype(int)

print(f"Total outbound Hong Kong residents: {df['hk_residents_outbound'].sum():,}")
print(f"Average daily outbound Hong Kong residents: {df['hk_residents_outbound'].mean():,.0f}")
print(f"Highest day: {df.loc[df['hk_residents_outbound'].idxmax(), 'date']} ({df['hk_residents_outbound'].max():,})")
print(f"Lowest day: {df.loc[df['hk_residents_outbound'].idxmin(), 'date']} ({df['hk_residents_outbound'].min():,})")

# Create a markdown table
print("\nMarkdown Table of Hong Kong Outbound Residents (March 2025 - Partial Data):")
markdown_table = "| Date | Day of Week | HK Residents Outbound |\n"
markdown_table += "| ---- | ----------- | --------------------- |\n"

for _, row in df.iterrows():
    markdown_table += f"| {row['date']} | {row['day_of_week']} | {row['hk_residents_outbound']:,} |\n"

print(markdown_table)

# Save the markdown table to a file
with open('data/hk_outbound_visitors_mar_2025_partial.md', 'w') as f:
    f.write(markdown_table)

print("Markdown table saved to 'data/hk_outbound_visitors_mar_2025_partial.md'")

# Let's also simulate what a full month might look like with extrapolation
# We have 2 days of data and 31 days in March 2025
average = df['hk_residents_outbound'].mean()
estimate_total = average * 31  # 31 days in March 2025

print("\nEstimates for full month (March 2025):")
print(f"Estimated total outbound Hong Kong residents: {estimate_total:,.0f}")
print(f"Based on average of {average:,.0f} per day across {len(df)} days of data") 