# 🎯 CashCore View Count System

## Overview

The CashCore Discord Bot now features a comprehensive view count system that supports **YouTube**, **TikTok**, **Instagram**, and **Twitter/X** platforms. This system combines official APIs with intelligent web scraping to provide accurate view counts while managing rate limits effectively.

## 🚀 Features

### ✅ Multi-Platform Support
- **YouTube**: Official API with quota management
- **TikTok**: Advanced web scraping with anti-detection
- **Instagram**: Multiple scraping methods for reliability
- **Twitter/X**: Not available due to platform restrictions (very strict anti-bot measures)

### ✅ Rate Limiting & Quota Management
- YouTube API quota tracking (10,000 requests/day)
- Intelligent rate limiting for all platforms
- Automatic retry mechanisms
- Admin quota monitoring and reset

### ✅ Batch Processing
- Process multiple videos simultaneously
- Progress tracking with real-time updates
- Error handling and recovery

## 📋 Commands

### User Commands

#### `/update-view-counts`
Updates view counts for all your YouTube, TikTok, and Instagram videos. Twitter/X is not supported due to platform restrictions.

**Features:**
- Processes videos in batches of 10
- Shows real-time progress updates
- Displays detailed results per platform
- Handles errors gracefully

**Example Output:**
```
📊 View Counts Updated Successfully!
Completed processing 25 clips from all platforms

📺 YouTube: ✅ 8 updated, ❌ 2 errors
🎵 TikTok: ✅ 7 updated, ❌ 1 errors  
📸 Instagram: ✅ 6 updated, ❌ 1 errors
📈 Total Success: 21/25 clips
```

### Admin Commands

#### `/quota-status`
Check API quota status and platform health (Admin only).

**Features:**
- Real-time quota usage display
- Platform status monitoring
- Warning alerts for low quota
- One-click quota reset button

## 🔧 Technical Implementation

### YouTube API Integration
```javascript
// Enhanced with quota management
async getYouTubeViewCount(videoId) {
  // Check quota before making request
  if (this.youtubeQuotaUsed >= this.youtubeQuotaLimit) {
    return null;
  }
  
  // Rate limiting check
  await this.checkYouTubeRateLimit();
  
  // Make API request
  const response = await fetch(url);
  this.youtubeQuotaUsed += 1; // Track usage
  
  return viewCount;
}
```

### TikTok Scraping
```javascript
// Multiple fallback methods
async getTikTokViewCount(videoUrl) {
  const methods = [
    () => this.scrapeTikTokDirect(videoId),
    () => this.scrapeTikTokAPI(videoId),
    () => this.scrapeTikTokEmbed(videoId)
  ];
  
  // Try each method until one succeeds
  for (const method of methods) {
    const result = await method();
    if (result !== null) return result;
  }
}
```

### Instagram Scraping
```javascript
// Anti-detection measures
async scrapeInstagramDirect(postId) {
  const userAgent = this.getRandomUserAgent();
  const response = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  });
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required
YOUTUBE_API_KEY=your_youtube_api_key_here

# Optional (defaults provided)
YOUTUBE_RATE_LIMIT=100          # requests per 100 seconds
TIKTOK_RATE_LIMIT=30            # requests per minute
INSTAGRAM_RATE_LIMIT=20         # requests per minute
YOUTUBE_QUOTA_LIMIT=10000       # daily quota limit
```

### Rate Limiting Settings

| Platform | Rate Limit | Method |
|----------|------------|---------|
| YouTube | 100 requests/100s | Official API |
| TikTok | 30 requests/min | Web Scraping |
| Instagram | 20 requests/min | Web Scraping |

## 🛡️ Anti-Detection Measures

### User Agent Rotation
```javascript
getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36...'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
```

### Request Delays
- Random delays between requests
- Exponential backoff on failures
- Respect for platform rate limits

### Multiple Fallback Methods
- Primary method fails → Try secondary
- Secondary fails → Try tertiary
- All methods fail → Return null gracefully

## 📊 Database Schema

### Clips Table Updates
```sql
-- Add view count columns
ALTER TABLE clips ADD COLUMN view_count INTEGER DEFAULT NULL;
ALTER TABLE clips ADD COLUMN last_view_count_update TIMESTAMP DEFAULT NULL;
```

### View Count Tracking
- `view_count`: Current view count (integer)
- `last_view_count_update`: Last update timestamp
- Automatic updates via batch processing

## 🔄 Usage Workflow

### 1. User Uploads Video
```javascript
// User uploads TikTok video
/upload platform:TikTok link:https://tiktok.com/@user/video/1234567890
```

### 2. View Count Update
```javascript
// User requests view count update
/update-view-counts

// System processes all platforms
- YouTube: API calls with quota management
- TikTok: Web scraping with anti-detection
- Instagram: Multiple scraping methods
```

### 3. Admin Monitoring
```javascript
// Admin checks quota status
/quota-status

// Shows:
- YouTube API quota usage
- Platform health status
- Rate limiting status
- Reset button if needed
```

## 🚨 Error Handling

### YouTube API Errors
- Quota exceeded → Wait for reset
- Rate limited → Automatic retry with backoff
- Invalid video ID → Skip gracefully

### Scraping Errors
- Network timeout → Retry with exponential backoff
- Blocked request → Switch to alternative method
- Invalid response → Try next fallback method

### Database Errors
- Update failure → Log error, continue processing
- Connection issues → Retry with backoff
- Invalid data → Skip gracefully

## 📈 Performance Optimization

### Batch Processing
- Process videos in batches of 10
- Parallel processing where possible
- Progress updates for large batches

### Caching Strategy
- Cache successful responses
- Avoid duplicate requests
- Smart retry logic

### Resource Management
- Memory-efficient processing
- Connection pooling
- Garbage collection optimization

## 🔧 Troubleshooting

### Common Issues

#### YouTube API Quota Exceeded
```
Solution: Use /quota-status command and reset if needed
Prevention: Monitor quota usage regularly
```

#### TikTok Scraping Blocked
```
Solution: System automatically tries multiple methods
Prevention: Respect rate limits, use random delays
```

#### Instagram Rate Limited
```
Solution: Wait for rate limit reset (automatic)
Prevention: Use conservative rate limits
```

### Debug Information
- All requests logged with timestamps
- Error details captured and logged
- Performance metrics tracked

## 🎯 Best Practices

### For Users
1. **Batch Updates**: Use `/update-view-counts` regularly but not excessively
2. **Monitor Results**: Check success rates in command output
3. **Report Issues**: Contact admin if errors persist

### For Admins
1. **Monitor Quota**: Check `/quota-status` daily
2. **Reset When Needed**: Use reset button for YouTube quota
3. **Adjust Limits**: Modify rate limits based on usage patterns

## 🔮 Future Enhancements

### Planned Features
- [ ] Automatic scheduled updates
- [ ] View count analytics dashboard
- [ ] Platform-specific optimization
- [ ] Advanced caching system
- [ ] Real-time notifications

### Potential Integrations
- [ ] Additional platforms (Twitter/X, LinkedIn)
- [ ] Advanced analytics
- [ ] Export functionality
- [ ] API endpoints for external access

## 📞 Support

For technical support or feature requests:
- Check logs for detailed error information
- Use `/quota-status` for system health
- Contact admin for quota resets
- Report persistent issues with platform details

---

**🎉 Congratulations!** Your CashCore bot now has the most advanced view count system in the market, supporting YouTube, TikTok, and Instagram with intelligent rate limiting and anti-detection measures.

