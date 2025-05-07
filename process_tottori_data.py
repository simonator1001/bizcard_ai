import requests
import json
import pandas as pd
from datetime import datetime
import os
import time
from urllib.parse import urlparse, parse_qs
from collections import Counter
import urllib.request

def extract_hashtags(text):
    if not isinstance(text, str):
        return []
    words = text.split()
    return [word[1:] for word in words if word.startswith('#')]

def download_image(url, folder_path, post_id, index):
    try:
        # Create a filename based on post ID and image index
        filename = f"{post_id}_{index}.jpg"
        filepath = os.path.join(folder_path, filename)
        
        # Check if file already exists
        if os.path.exists(filepath):
            print(f"Image already exists: {filename}")
            return filepath
        
        # Download the image
        urllib.request.urlretrieve(url, filepath)
        print(f"Downloaded image: {filename}")
        time.sleep(0.5)  # Add a small delay between downloads
        return filepath
    except Exception as e:
        print(f"Error downloading image {url}: {e}")
        return None

def get_xiaohongshu_content(note_id):
    url = f"https://www.xiaohongshu.com/api/sns/web/v1/feed/{note_id}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.xiaohongshu.com',
        'Referer': f'https://www.xiaohongshu.com/explore/{note_id}'
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
            return get_xiaohongshu_content(note_id)  # Retry after waiting
        else:
            print(f"Failed to fetch content for note: {response.status_code}")
        return None
    except Exception as e:
        print(f"Error fetching content for note {note_id}: {str(e)}")
        return None

# Create images directory if it doesn't exist
images_dir = "tottori_images"
if not os.path.exists(images_dir):
    os.makedirs(images_dir)

# Read the JSON data
with open('tottori_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Initialize lists to store data
posts = []
total_likes = 0
total_comments = 0
total_saves = 0
total_shares = 0
max_likes = 0
max_saves = 0
all_hashtags = []

# Process each post
for item in data:
    try:
        # Extract note card information - handle both data structures
        note_card = None
        if 'item' in item and 'note_card' in item['item']:
            note_card = item['item']['note_card']
            post_id = item['item']['id']
            post_url = item.get('link', '')
        else:
            note_card = item.get('note_card', {})
            post_id = note_card.get('id', '')
            post_url = f"https://www.xiaohongshu.com/explore/{post_id}" if post_id else ''
        
        if not note_card:
            print(f"Skipping item - no note card found")
            continue
        
        # Extract basic information
        display_title = note_card.get('display_title', '')
        title = display_title
        content = display_title  # Use display_title for content since that's where the actual content is stored
        
        print(f"\nDebug - Post {post_id}:")
        print(f"display_title: {display_title}")
        
        # Extract user information
        user = note_card.get('user', {})
        author = user.get('nickname', '')
        
        # Extract interaction data - handle both data structures
        interact_info = note_card.get('interact_info', {})
        likes = int(interact_info.get('liked_count', note_card.get('liked_count', 0)))
        comments = int(interact_info.get('comment_count', note_card.get('comment_count', 0)))
        collects = int(interact_info.get('collected_count', note_card.get('collected_count', 0)))
        shares = int(interact_info.get('shared_count', note_card.get('share_count', 0)))
        
        # Update totals
        total_likes += likes
        total_comments += comments
        total_saves += collects
        total_shares += shares
        max_likes = max(max_likes, likes)
        max_saves = max(max_saves, collects)
        
        # Extract publish time
        publish_time = None
        if 'corner_tag_info' in note_card:
            publish_time = next((tag['text'] for tag in note_card['corner_tag_info'] 
                               if tag.get('type') == 'publish_time'), None)
        if not publish_time:
            publish_time = note_card.get('time', 'Unknown')
        
        # Process images
        image_list = note_card.get('image_list', [])
        image_urls = []
        local_image_paths = []
        
        for idx, image in enumerate(image_list):
            image_url = None
            if 'info_list' in image:
                # Try to get the highest quality image URL
                for scene in ['WB_PRV', 'WB_DFT']:
                    image_url = next((info['url'] for info in image['info_list'] 
                                    if info.get('image_scene') == scene), None)
                    if image_url:
                        break
            else:
                # Try alternate image URL field
                image_url = image.get('file_id', image.get('url', None))
            
            if image_url:
                image_urls.append(image_url)
                # Download the image
                local_path = download_image(image_url, images_dir, post_id, idx)
                if local_path:
                    local_image_paths.append(local_path)
        
        # Extract hashtags from both title and content
        hashtags = extract_hashtags(title)
        if content:
            hashtags.extend(extract_hashtags(content))
        hashtags = list(set(hashtags))  # Remove duplicates
        all_hashtags.extend(hashtags)
        
        # Create post entry
        post = {
            'Title': title,
            'Content': content,
            'Author': author,
            'Likes': likes,
            'Comments': comments,
            'Saves': collects,
            'Shares': shares,
            'Publish Time': publish_time,
            'Hashtags': ', '.join(hashtags),
            'Image URLs': '\n'.join(image_urls),
            'Local Image Paths': '\n'.join(local_image_paths),
            'Number of Images': len(local_image_paths),
            'Post URL': post_url,
            'Post ID': post_id
        }
        
        posts.append(post)
        print(f"Processed post {post_id} with {len(local_image_paths)} images")
        
    except Exception as e:
        print(f"Error processing post: {str(e)}")

# Create DataFrame
df = pd.DataFrame(posts)

# Create summary data
hashtag_counts = Counter(all_hashtags)
summary_data = {
    'Metric': [
        'Total Posts',
        'Total Likes',
        'Total Comments',
        'Total Saves',
        'Total Shares',
        'Total Images',
        'Most Popular Post (by Likes)',
        'Most Saved Post',
        'Most Common Hashtags'
    ],
    'Value': [
        len(df),
        total_likes,
        total_comments,
        total_saves,
        total_shares,
        df['Number of Images'].sum(),
        f"{df.loc[df['Likes'].idxmax(), 'Title']} ({df.loc[df['Likes'].idxmax(), 'Likes']} likes)",
        f"{df.loc[df['Saves'].idxmax(), 'Title']} ({df.loc[df['Saves'].idxmax(), 'Saves']} saves)",
        ', '.join([f"{tag} ({count})" for tag, count in hashtag_counts.most_common(5)])
    ]
}
summary_df = pd.DataFrame(summary_data)

# Save to Excel
with pd.ExcelWriter('tottori_xiaohongshu_data.xlsx', engine='openpyxl') as writer:
    df.to_excel(writer, sheet_name='Tottori Posts', index=False)
    summary_df.to_excel(writer, sheet_name='Summary', index=False)
    
    # Adjust column widths
    for sheet in writer.sheets.values():
        for column in sheet.columns:
            max_length = 0
            column = [cell for cell in column]
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = (max_length + 2)
            sheet.column_dimensions[column[0].column_letter].width = min(adjusted_width, 100)

print("Data saved to tottori_xiaohongshu_data.xlsx with full content and statistics")
print("Images downloaded to tottori_images directory") 