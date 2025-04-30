import requests
import json
import pandas as pd
from datetime import datetime
import os
import time
from urllib.parse import urlparse, parse_qs

def get_xiaohongshu_content(note_id):
    # API endpoint (this is a sample structure)
    url = f"https://www.xiaohongshu.com/api/sns/web/v1/feed/{note_id}"
    
    # Headers to mimic browser behavior
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.xiaohongshu.com',
        'Referer': 'https://www.xiaohongshu.com/'
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to fetch content for note {note_id}: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching content for note {note_id}: {e}")
        return None

def get_note_id_from_url(url):
    """Extract note ID from a Xiaohongshu URL."""
    try:
        path = urlparse(url).path
        note_id = path.split('/')[-1]
        return note_id
    except:
        return None

def get_full_content(note_id):
    """Fetch full content from Xiaohongshu API with proper headers."""
    if not note_id:
        return None
        
    url = f"https://www.xiaohongshu.com/api/sns/web/v1/feed/{note_id}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.xiaohongshu.com',
        'Referer': f'https://www.xiaohongshu.com/explore/{note_id}',
        'Cookie': 'your_cookie_here'  # You'll need to add your own cookie
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return data.get('data', {}).get('noteDetailMap', {}).get(note_id, {}).get('desc')
        elif response.status_code == 429:
            print(f"Rate limited for note {note_id}, waiting 60 seconds...")
            time.sleep(60)
            return get_full_content(note_id)  # Retry after waiting
        else:
            print(f"Failed to fetch content for note {note_id}: {response.status_code}")
        return None
    except Exception as e:
        print(f"Error fetching content for note {note_id}: {str(e)}")
        return None

# Read the JSON data
with open('tottori_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Create directory for images
os.makedirs('tottori_images', exist_ok=True)

# Prepare lists to store the extracted data
extracted_data = []

for item in data:
    try:
        # Extract note card information
        note_card = item.get('note_card', {})
        note_id = note_card.get('id', '')
        
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
        image_urls = []
        image_local_paths = []
        
        # Create directory for this post's images
        post_dir = f'tottori_images/{note_id}'
        os.makedirs(post_dir, exist_ok=True)
        
        for idx, img in enumerate(image_list):
            img_url = img.get('file_id', '')
            if img_url:
                image_urls.append(img_url)
                local_path = f'{post_dir}/image_{idx + 1}.jpg'
                image_local_paths.append(local_path)
                
                # Download image
                try:
                    img_response = requests.get(img_url)
                    if img_response.status_code == 200:
                        with open(local_path, 'wb') as f:
                            f.write(img_response.content)
                except Exception as e:
                    print(f"Error downloading image {img_url}: {e}")

        # Try to get full content
        full_content = desc
        api_content = get_xiaohongshu_content(note_id)
        if api_content:
            full_content = api_content.get('data', {}).get('content', desc)

        # Get URL
        url = f"https://www.xiaohongshu.com/explore/{note_id}"
        
        # Append to our data list
        extracted_data.append({
            'Title': title,
            'Full Content': full_content,
            'Author': author,
            'Likes': likes,
            'Comments': comments,
            'Saves': collected,
            'Publish Time': publish_time,
            'Image URLs': '\n'.join(image_urls),
            'Local Image Paths': '\n'.join(image_local_paths),
            'Post URL': url
        })
        
        # Add a small delay between requests
        time.sleep(2)
        
    except Exception as e:
        print(f"Error processing item: {e}")

# Create DataFrame
df = pd.DataFrame(extracted_data)

# Save to Excel with adjusted column widths
with pd.ExcelWriter('tottori_xiaohongshu_data.xlsx', engine='openpyxl') as writer:
    df.to_excel(writer, index=False, sheet_name='Tottori Posts')
    worksheet = writer.sheets['Tottori Posts']
    
    # Adjust column widths
    for idx, col in enumerate(df.columns):
        max_length = max(
            df[col].astype(str).apply(len).max(),  # length of values
            len(col)  # length of column name
        )
        worksheet.column_dimensions[chr(65 + idx)].width = min(max_length + 2, 100)  # limit to 100

print(f"Data has been saved to tottori_xiaohongshu_data.xlsx")
print(f"Images have been saved to the tottori_images directory")

# Read existing Excel file
df = pd.read_excel('tottori_xiaohongshu_data.xlsx', sheet_name='Tottori Posts')

# Add full content column
df['Full Content'] = None

# Fetch full content for each post
for index, row in df.iterrows():
    url = row['Post URL']
    if pd.isna(url):
        continue
        
    note_id = get_note_id_from_url(url)
    if note_id:
        print(f"Fetching content for post {note_id}")
        content = get_full_content(note_id)
        if content:
            df.at[index, 'Full Content'] = content
        time.sleep(2)  # Add delay between requests

# Save updated data back to Excel
with pd.ExcelWriter('tottori_xiaohongshu_data.xlsx', engine='openpyxl', mode='a') as writer:
    # Remove the existing Full Content sheet if it exists
    if 'Full Content' in writer.book.sheetnames:
        idx = writer.book.sheetnames.index('Full Content')
        writer.book.remove(writer.book.worksheets[idx])
    
    # Write the updated data
    df.to_excel(writer, sheet_name='Full Content', index=False)
    
    # Adjust column widths
    worksheet = writer.sheets['Full Content']
    for idx, col in enumerate(df.columns):
        max_length = max(
            df[col].astype(str).apply(len).max(),
            len(str(col))
        )
        adjusted_width = min(max_length + 2, 50)
        worksheet.column_dimensions[chr(65 + idx)].width = adjusted_width

print("Full content has been fetched and saved to the Excel file") 