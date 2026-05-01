---
name: douyin-downloader
description: Extract Douyin video metadata (title, stats, creator) via browser snapshot fast path, or download + transcribe full videos via Playwright API interception.
---

# Skill: Douyin Video Downloader

## Summary
Two paths for Douyin (TikTok Chinese) videos:
- **⚡ Fast**: Read title, creator, stats, and description via `browser_navigate` to share URL — no installs, seconds.
- **🐢 Full**: Download video + transcribe audio via Playwright API interception + Whisper.

## ⚡ Fast Path: Metadata peek via share URL

Use when you just need to understand what a video says — no Playwright, no Python, no installs.

### Step 1: Resolve short link to video ID
```bash
curl -sL -o /dev/null -D - "https://v.douyin.com/SHORT_CODE/" --max-time 10 2>&1 | grep "^location:"
```
Extract the numeric ID from redirect URL. e.g. `https://www.iesdouyin.com/share/video/7628522061673925028/` → ID is `7628522061673925028`.

### Step 2: Navigate browser to share URL
```
browser_navigate → https://www.iesdouyin.com/share/video/VIDEO_ID/
```
Douyin redirects to `douyin.com/video/VIDEO_ID`. Page snapshot exposes all metadata as readable text — no login needed.

### Step 3: Extract from browser_snapshot
- `heading[level=1]` → full video description + hashtags
- `link` with creator name → creator handle, follower/like counts
- Interaction counts (likes, comments, saves, shares) appear as `StaticText` near clickable counters
- Post date and location in the page text

**Limitations:** Cannot play video or read comments without login. Metadata only.

## 🐢 Full Path: Download + Transcribe (Playwright)

### Step 1: Intercept API with Playwright

```python
python3 << 'EOF'
import asyncio
import json
from playwright.async_api import async_playwright

VIDEO_ID = "VIDEO_ID_HERE"

async def get_video_url():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        api_data = None
        
        async def handle_response(response):
            nonlocal api_data
            url = response.url
            if "aweme/v1/web/aweme/detail" in url:
                try:
                    json_data = await response.json()
                    api_data = json_data
                except:
                    pass
        
        page.on("response", handle_response)
        
        try:
            await page.goto(f"https://www.douyin.com/video/{VIDEO_ID}", timeout=25000)
            await page.wait_for_timeout(8000)
        except:
            pass
        
        if api_data:
            with open("/tmp/douyin_api_response.json", "w") as f:
                json.dump(api_data, f, indent=2, ensure_ascii=False)
        
        await browser.close()

asyncio.run(get_video_url())
EOF
```

### Step 2: Extract Video URL from JSON

```python
python3 << 'EOF'
import json

with open("/tmp/douyin_api_response.json", "r") as f:
    data = json.load(f)

aweme = data.get('aweme_detail', {})
video = aweme.get('video', {})

bitrates = video.get('bit_rate', [])
if bitrates:
    urls = bitrates[0].get('play_addr', {}).get('url_list', [])
    if urls:
        video_url = urls[0]
        print(video_url)
        with open("/tmp/video_url.txt", "w") as f:
            f.write(video_url)
EOF
```

### Step 3: Download Video

```bash
curl -L -o /tmp/douyin_video.mp4 "$VIDEO_URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Referer: https://www.douyin.com/"
```

### Step 4: Transcribe with Whisper

```bash
python3 -c "
from faster_whisper import WhisperModel
model = WhisperModel('base', device='cpu', compute_type='int8')
segments, info = model.transcribe('/tmp/douyin_video.mp4')
print(f'Language: {info.language}')
with open('/tmp/douyin_transcript.txt', 'w') as f:
    for segment in segments:
        print(segment.text, end='')
        f.write(segment.text + '\n')
"
```

## Requirements (Full Path only)

- `pip install playwright && playwright install chromium`
- `pip install faster-whisper`
- Chrome/Chromium browser
- ffmpeg (for Whisper audio processing)

## Notes

- Video URLs expire — download immediately after getting URL
- Highest quality URL is in `bit_rate[0]`
- Fast path works with any browser tool — no login, no API keys
- Share URL redirects may vary; always resolve the short link first
- **venv Python**: faster-whisper is installed in `~/AI/hermes-agent/venv/` — use full path `~/AI/hermes-agent/venv/bin/python3` for transcription; system `python3` won't find the module
- **Full archive workflow**: use `douyin-video-archiver` skill for the complete pipeline (download → audio extraction → transcript → metadata JSON → summary)
