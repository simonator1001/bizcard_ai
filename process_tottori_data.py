import json
import pandas as pd
from datetime import datetime

# Read the JSON data
with open('tottori_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Prepare lists to store the extracted data
extracted_data = []

for item in data:
    try:
        # Extract note card information
        note_card = item.get('note_card', {})
        
        # Get basic information
        title = note_card.get('title', '')
        desc = note_card.get('desc', '')
        
        # Get user information
        user_info = note_card.get('user', {})
        author = user_info.get('nickname', '')
        
        # Get interaction stats
        likes = note_card.get('liked_count', 0)
        comments = note_card.get('comment_count', 0)
        collected = note_card.get('collected_count', 0)
        
        # Get publish time
        publish_time = note_card.get('time', '')
        if publish_time:
            try:
                publish_time = datetime.fromtimestamp(publish_time).strftime('%Y-%m-%d %H:%M:%S')
            except:
                pass
        
        # Get images
        image_list = note_card.get('image_list', [])
        image_urls = [img.get('file_id', '') for img in image_list]
        image_urls = '\n'.join(image_urls)
        
        # Get URL
        url = f"https://www.xiaohongshu.com/explore/{note_card.get('id', '')}"
        
        # Append to our data list
        extracted_data.append({
            'Title': title,
            'Description': desc,
            'Author': author,
            'Likes': likes,
            'Comments': comments,
            'Saves': collected,
            'Publish Time': publish_time,
            'Image URLs': image_urls,
            'Post URL': url
        })
        
    except Exception as e:
        print(f"Error processing item: {e}")

# Create DataFrame
df = pd.DataFrame(extracted_data)

# Save to Excel
excel_filename = 'tottori_xiaohongshu_data.xlsx'
df.to_excel(excel_filename, index=False, engine='openpyxl')

print(f"Data has been saved to {excel_filename}") 