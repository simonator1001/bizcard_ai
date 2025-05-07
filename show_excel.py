import pandas as pd
import numpy as np

# Read both sheets from the Excel file
try:
    posts_df = pd.read_excel('tottori_xiaohongshu_data.xlsx', sheet_name='Tottori Posts')
    summary_df = pd.read_excel('tottori_xiaohongshu_data.xlsx', sheet_name='Summary')

    print("\n=== Summary Statistics ===")
    print(summary_df)

    print("\n=== Sample of Posts (First 3) ===")
    sample_posts = posts_df.head(3)
    print(sample_posts[['Title', 'Author', 'Likes', 'Comments', 'Saves', 'Publish Time']])

    print("\n=== Content Sample (First Post) ===")
    if len(posts_df) > 0:
        first_post_content = posts_df.iloc[0]
        print("\nTitle:", first_post_content.get('Title', 'No title available'))
        print("\nContent:", first_post_content.get('Content', 'No content available'))
        print("\nHashtags:", first_post_content.get('Hashtags', 'No hashtags available'))
        print("\nImages:", first_post_content.get('Number of Images', 0), "images")
        print("\nURL:", first_post_content.get('URL', 'No URL available'))
    else:
        print("No posts found in the Excel file")

except FileNotFoundError:
    print("Error: Could not find the Excel file 'tottori_xiaohongshu_data.xlsx'")
except Exception as e:
    print(f"Error occurred while processing the Excel file: {str(e)}") 