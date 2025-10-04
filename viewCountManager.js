import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Initialize Supabase client
const supabaseKey = config.supabase.serviceKey && config.supabase.serviceKey.length > 0
  ? config.supabase.serviceKey
  : config.supabase.anonKey;
const supabase = createClient(config.supabase.url, supabaseKey);

class ViewCountManager {
  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY || 'AIzaSyCGCarM_ZaZXsWoIU0QLcpljZehLFoV_Es';
    this.youtubeQuotaUsed = 0;
    this.youtubeQuotaLimit = 10000; // Daily quota limit
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastResetTime = Date.now();
    
    // Twitter authentication credentials
    this.twitterCredentials = {
      csrfToken: process.env.TWITTER_CSRF_TOKEN || '',
      sessionCookies: process.env.TWITTER_SESSION_COOKIES || '',
      authToken: process.env.TWITTER_AUTH_TOKEN || '',
      bearerToken: process.env.TWITTER_BEARER_TOKEN || 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA'
    };
    
    // Rate limiting settings
    this.youtubeRateLimit = 100; // requests per 100 seconds
    this.tiktokRateLimit = 30; // requests per minute
    this.instagramRateLimit = 20; // requests per minute
    this.twitterRateLimit = 25; // requests per minute
    
    // Request tracking
    this.youtubeRequests = [];
    this.tiktokRequests = [];
    this.instagramRequests = [];
    this.twitterRequests = [];
    
    // User agents for scraping
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  // YouTube API with enhanced rate limiting and quota management
  async getYouTubeViewCount(videoId) {
    try {
      // Check quota before making request
      if (this.youtubeQuotaUsed >= this.youtubeQuotaLimit) {
        console.log('YouTube API quota exceeded, waiting for reset');
        return null;
      }

      // Rate limiting check
      await this.checkYouTubeRateLimit();

      const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=statistics&key=${this.youtubeApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Track quota usage (each request costs 1 unit)
      this.youtubeQuotaUsed += 1;
      
      if (data.items && data.items.length > 0) {
        const viewCount = parseInt(data.items[0].statistics.viewCount) || 0;
        console.log(`YouTube API: Video ${videoId} has ${viewCount} views (Quota used: ${this.youtubeQuotaUsed}/${this.youtubeQuotaLimit})`);
        return viewCount;
      }
      
      return null;
    } catch (error) {
      console.error('YouTube API error:', error);
      return null;
    }
  }

  // TikTok scraper with enhanced anti-detection measures
  async getTikTokViewCount(videoUrl) {
    try {
      // Rate limiting check
      await this.checkTikTokRateLimit();

      const videoId = this.extractTikTokVideoId(videoUrl);
      if (!videoId) {
        console.log('Could not extract TikTok video ID from:', videoUrl);
        return null;
      }

      // Try multiple methods to get view count with enhanced techniques
      const methods = [
        () => this.scrapeTikTokAdvanced(videoId),
        () => this.scrapeTikTokDirect(videoId),
        () => this.scrapeTikTokAPI(videoId),
        () => this.scrapeTikTokEmbed(videoId),
        () => this.scrapeTikTokSSR(videoId)
      ];

      const methodNames = [
        'Advanced Mobile API',
        'Direct Scraping', 
        'API Scraping',
        'Embed Scraping',
        'SSR Scraping'
      ];

      for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        try {
          console.log(`🔄 Trying TikTok method ${i + 1}/5: ${methodNames[i]}`);
          const viewCount = await method();
          if (viewCount !== null) {
            console.log(`✅ SUCCESS! TikTok method ${i + 1} (${methodNames[i]}) got ${viewCount} views for video ${videoId}`);
            return viewCount;
          } else {
            console.log(`❌ TikTok method ${i + 1} (${methodNames[i]}) returned no data`);
          }
        } catch (error) {
          console.log(`❌ TikTok method ${i + 1} (${methodNames[i]}) failed:`, error.message);
          continue;
        }
      }

      console.log(`All TikTok methods failed for video ${videoId}`);
      
      // Try third-party API as last resort
      try {
        console.log(`🔄 Trying TikTok method 6/6: FREE Third-Party APIs`);
        const thirdPartyCount = await this.scrapeTikTokThirdParty(videoId);
        if (thirdPartyCount !== null) {
          console.log(`✅ SUCCESS! TikTok method 6 (FREE Third-Party APIs) got ${thirdPartyCount} views for video ${videoId}`);
          return thirdPartyCount;
        } else {
          console.log(`❌ TikTok method 6 (FREE Third-Party APIs) returned no data`);
        }
      } catch (error) {
        console.log(`❌ TikTok method 6 (FREE Third-Party APIs) failed:`, error.message);
      }
      
      return null;
    } catch (error) {
      console.error('TikTok scraper error:', error);
      return null;
    }
  }

  // Instagram scraper with enhanced anti-detection measures
  async getInstagramViewCount(postUrl) {
    try {
      // Rate limiting check
      await this.checkInstagramRateLimit();

      const postId = this.extractInstagramPostId(postUrl);
      if (!postId) {
        console.log('Could not extract Instagram post ID from:', postUrl);
        return null;
      }

      // Try multiple methods to get view count with enhanced techniques
      const methods = [
        () => this.scrapeInstagramAdvanced(postId),
        () => this.scrapeInstagramDirect(postId),
        () => this.scrapeInstagramEmbed(postId),
        () => this.scrapeInstagramAPI(postId),
        () => this.scrapeInstagramMobile(postId),
        () => this.scrapeInstagramAlternative(postId),
        () => this.scrapeInstagramHeadless(postId),
        () => this.scrapeInstagramFreeAPI(postId),
        () => this.scrapeInstagramProxy(postId),
        () => this.scrapeInstagramHTML(postId),
        () => this.scrapeInstagramInternalAPI(postId),
        () => this.scrapeInstagramAuthenticated(postId),
        () => this.scrapeInstagramEmbedAPI(postId)
      ];

      const methodNames = [
        'Advanced GraphQL',
        'Direct Scraping',
        'Embed Scraping', 
        'API Scraping',
        'Mobile API',
        'Alternative Endpoints',
        'Headless API',
        'Free Third-Party APIs',
        'Proxy Scraping',
        'HTML Parsing',
        'Internal API',
        'Authenticated API',
        'Embed API'
      ];

      for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        try {
          console.log(`🔄 Trying Instagram method ${i + 1}/13: ${methodNames[i]}`);
          const viewCount = await method();
          if (viewCount !== null) {
            console.log(`✅ SUCCESS! Instagram method ${i + 1} (${methodNames[i]}) got ${viewCount} views for post ${postId}`);
            return viewCount;
          } else {
            console.log(`❌ Instagram method ${i + 1} (${methodNames[i]}) returned no data`);
          }
        } catch (error) {
          console.log(`❌ Instagram method ${i + 1} (${methodNames[i]}) failed:`, error.message);
          continue;
        }
      }

      console.log(`All Instagram methods failed for post ${postId}`);
      
      // Try free third-party APIs as last resort
      try {
        const thirdPartyCount = await this.scrapeInstagramThirdParty(postId);
        if (thirdPartyCount !== null) {
          console.log(`Instagram third-party API: Post ${postId} has ${thirdPartyCount} views`);
          return thirdPartyCount;
        }
      } catch (error) {
        console.log(`Instagram third-party API failed:`, error.message);
      }
      
      return null;
    } catch (error) {
      console.error('Instagram scraper error:', error);
      return null;
    }
  }

  // Enhanced TikTok scraping methods
  async scrapeTikTokAdvanced(videoId) {
    try {
      // Use TikTok's mobile API endpoint with enhanced headers
      const mobileUrl = `https://m.tiktok.com/api/item/detail/?itemId=${videoId}`;
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      
      const response = await fetch(mobileUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://m.tiktok.com/',
          'Origin': 'https://m.tiktok.com',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.itemInfo && data.itemInfo.itemStruct) {
        const stats = data.itemInfo.itemStruct.stats;
        return stats.playCount || stats.viewCount || null;
      }

      return null;
    } catch (error) {
      throw new Error(`Advanced method failed: ${error.message}`);
    }
  }

  async scrapeTikTokSSR(videoId) {
    try {
      // Try server-side rendering approach
      const ssrUrl = `https://www.tiktok.com/@placeholder/video/${videoId}`;
      const userAgent = this.getRandomUserAgent();
      
      const response = await fetch(ssrUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      
      // Look for view count in various patterns including SSR data
      const patterns = [
        /"playCount":(\d+)/,
        /"viewCount":(\d+)/,
        /"play_count":(\d+)/,
        /"view_count":(\d+)/,
        /"views":(\d+)/,
        /"view":(\d+)/,
        /"stats":\s*{\s*"playCount":\s*(\d+)/,
        /"videoStats":\s*{\s*"playCount":\s*(\d+)/
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          return parseInt(match[1]);
        }
      }

      return null;
    } catch (error) {
      throw new Error(`SSR method failed: ${error.message}`);
    }
  }

  async scrapeTikTokThirdParty(videoId) {
    try {
      // Try multiple FREE third-party APIs and scrapers
      const freeApis = [
        // TikTok downloader APIs (usually free)
        `https://api.tiklydown.eu.org/api/info?url=https://www.tiktok.com/@placeholder/video/${videoId}`,
        `https://tiklydown.eu.org/api/info?url=https://www.tiktok.com/@placeholder/video/${videoId}`,
        `https://api.tiklydown.eu.org/api/info?url=https://vm.tiktok.com/${videoId}`,
        `https://api.tiklydown.eu.org/api/info?url=https://vt.tiktok.com/${videoId}`,
        
        // Alternative free APIs
        `https://tiktok-scraper.vercel.app/api/info?url=https://www.tiktok.com/@placeholder/video/${videoId}`,
        `https://tiktok-api.vercel.app/api/info?url=https://www.tiktok.com/@placeholder/video/${videoId}`,
        `https://api.tiklydown.eu.org/api/info?url=https://www.tiktok.com/@placeholder/video/${videoId}`,
        
        // Try with different URL formats
        `https://api.tiklydown.eu.org/api/info?url=https://m.tiktok.com/v/${videoId}`,
        `https://tiklydown.eu.org/api/info?url=https://m.tiktok.com/v/${videoId}`
      ];

      for (const apiUrl of freeApis) {
        try {
          const response = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.tiktok.com/',
              'Origin': 'https://www.tiktok.com'
            },
            timeout: 10000 // 10 second timeout
          });

          if (response.ok) {
            const data = await response.json();
            
            // Look for view count in various response formats
            const viewCount = this.extractViewCountFromResponse(data);
            if (viewCount !== null) {
              return viewCount;
            }
          }
        } catch (error) {
          console.log(`Free API ${apiUrl} failed:`, error.message);
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Free third-party method failed: ${error.message}`);
    }
  }

  extractViewCountFromResponse(data) {
    // Try multiple possible response structures
    const patterns = [
      data?.stats?.playCount,
      data?.playCount,
      data?.viewCount,
      data?.views,
      data?.video?.stats?.playCount,
      data?.video?.playCount,
      data?.video?.viewCount,
      data?.itemInfo?.itemStruct?.stats?.playCount,
      data?.itemInfo?.itemStruct?.stats?.viewCount,
      data?.result?.stats?.playCount,
      data?.result?.playCount,
      data?.data?.stats?.playCount,
      data?.data?.playCount
    ];

    for (const pattern of patterns) {
      if (pattern && !isNaN(parseInt(pattern))) {
        return parseInt(pattern);
      }
    }

    return null;
  }

  // TikTok scraping methods
  async scrapeTikTokDirect(videoId) {
    const url = `https://www.tiktok.com/@placeholder/video/${videoId}`;
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Look for view count in various patterns
    const patterns = [
      /"playCount":(\d+)/,
      /"viewCount":(\d+)/,
      /"play_count":(\d+)/,
      /"view_count":(\d+)/,
      /"views":(\d+)/,
      /"view":(\d+)/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  async scrapeTikTokAPI(videoId) {
    const url = `https://www.tiktok.com/api/item/detail/?itemId=${videoId}`;
    const userAgent = this.getRandomUserAgent();
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tiktok.com/',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.itemInfo && data.itemInfo.itemStruct) {
      const stats = data.itemInfo.itemStruct.stats;
      return stats.playCount || stats.viewCount || null;
    }

    return null;
  }

  async scrapeTikTokEmbed(videoId) {
    const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
    const userAgent = this.getRandomUserAgent();
    
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Look for view count in embed
    const patterns = [
      /"playCount":(\d+)/,
      /"viewCount":(\d+)/,
      /"views":(\d+)/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  // Enhanced Instagram scraping methods
  async scrapeInstagramAdvanced(postId) {
    try {
      // Try with the provided API key first
      const apiKey = 'sgai-a20fcb52-dca0-48b4-968a-37226832dc37';
      
      // Try multiple endpoints with the API key
      const apiUrls = [
        `https://api.instagram.com/api/v1/media/${postId}/info/`,
        `https://i.instagram.com/api/v1/media/${postId}/info/`,
        `https://www.instagram.com/api/v1/media/${postId}/info/`,
        `https://www.instagram.com/graphql/query/?query_hash=2c4d4d3e2e2e2e2e2e2e2e2e2e2e2e2e&variables={"shortcode":"${postId}"}`
      ];

      for (const url of apiUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'X-Requested-With': 'XMLHttpRequest',
              'X-IG-App-ID': '936619743392459',
              'X-ASBD-ID': '129477',
              'X-IG-WWW-Claim': '0',
              'Authorization': `Bearer ${apiKey}`,
              'X-API-Key': apiKey,
              'API-Key': apiKey,
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-origin'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractInstagramViewCountFromResponse(data);
            if (viewCount !== null) {
              return viewCount;
            }
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Advanced method failed: ${error.message}`);
    }
  }

  async scrapeInstagramMobile(postId) {
    try {
      // Try mobile Instagram endpoint
      const mobileUrl = `https://i.instagram.com/api/v1/media/${postId}/info/`;
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      
      const response = await fetch(mobileUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'X-Requested-With': 'XMLHttpRequest',
          'X-IG-App-ID': '936619743392459',
          'Referer': 'https://www.instagram.com/',
          'Origin': 'https://www.instagram.com'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items && data.items[0]) {
        const item = data.items[0];
        return item.video_view_count || item.view_count || null;
      }

      return null;
    } catch (error) {
      throw new Error(`Mobile method failed: ${error.message}`);
    }
  }

  async scrapeInstagramThirdParty(postId) {
    try {
      // Try multiple FREE Instagram APIs and scrapers
      const freeApis = [
        // Instagram downloader APIs (usually free)
        `https://api.instagram.com/api/v1/media/${postId}/info/`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis`,
        `https://www.instagram.com/p/${postId}/?__a=1`,
        
        // Alternative free APIs
        `https://instagram-scraper.vercel.app/api/info?url=https://www.instagram.com/p/${postId}/`,
        `https://instagram-api.vercel.app/api/info?url=https://www.instagram.com/p/${postId}/`,
        `https://api.instagram.com/p/${postId}/media/?size=l`,
        
        // Try with different formats
        `https://www.instagram.com/p/${postId}/embed/`,
        `https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${postId}/`
      ];

      for (const apiUrl of freeApis) {
        try {
          const response = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 10000 // 10 second timeout
          });

          if (response.ok) {
            const data = await response.json();
            
            // Look for view count in various response formats
            const viewCount = this.extractInstagramViewCountFromResponse(data);
            if (viewCount !== null) {
              return viewCount;
            }
          }
        } catch (error) {
          console.log(`Free Instagram API ${apiUrl} failed:`, error.message);
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Free Instagram third-party method failed: ${error.message}`);
    }
  }

  parseViewCount(match) {
    // Extract number and handle K/M/B suffixes
    const numberMatch = match.match(/(\d+(?:\.\d+)?)([KMB]?)/i);
    if (!numberMatch) return 0;
    
    let number = parseFloat(numberMatch[1]);
    const suffix = numberMatch[2].toUpperCase();
    
    // Convert K/M/B to actual numbers
    switch (suffix) {
      case 'K': number *= 1000; break;
      case 'M': number *= 1000000; break;
      case 'B': number *= 1000000000; break;
    }
    
    return Math.floor(number);
  }

  extractInstagramViewCountFromResponse(data) {
    // Try multiple possible response structures for Instagram
    const patterns = [
      // Direct view count fields
      data?.video_view_count,
      data?.view_count,
      data?.views,
      data?.play_count,
      data?.videoViewCount,
      data?.viewCount,
      data?.playCount,
      
      // Nested in media object
      data?.media?.video_view_count,
      data?.media?.view_count,
      data?.media?.play_count,
      data?.media?.videoViewCount,
      data?.media?.viewCount,
      data?.media?.playCount,
      
      // Nested in items array
      data?.items?.[0]?.video_view_count,
      data?.items?.[0]?.view_count,
      data?.items?.[0]?.play_count,
      data?.items?.[0]?.videoViewCount,
      data?.items?.[0]?.viewCount,
      data?.items?.[0]?.playCount,
      
      // Nested in shortcode_media
      data?.shortcode_media?.video_view_count,
      data?.shortcode_media?.view_count,
      data?.shortcode_media?.play_count,
      data?.shortcode_media?.videoViewCount,
      data?.shortcode_media?.viewCount,
      data?.shortcode_media?.playCount,
      
      // Nested in graphql
      data?.graphql?.shortcode_media?.video_view_count,
      data?.graphql?.shortcode_media?.view_count,
      data?.graphql?.shortcode_media?.play_count,
      data?.graphql?.shortcode_media?.videoViewCount,
      data?.graphql?.shortcode_media?.viewCount,
      data?.graphql?.shortcode_media?.playCount,
      
      // Nested in data object
      data?.data?.video_view_count,
      data?.data?.view_count,
      data?.data?.play_count,
      data?.data?.videoViewCount,
      data?.data?.viewCount,
      data?.data?.playCount,
      
      // Nested in user object
      data?.user?.video_view_count,
      data?.user?.view_count,
      data?.user?.play_count,
      data?.user?.videoViewCount,
      data?.user?.viewCount,
      data?.user?.playCount,
      
      // Nested in video object
      data?.video?.video_view_count,
      data?.video?.view_count,
      data?.video?.play_count,
      data?.video?.videoViewCount,
      data?.video?.viewCount,
      data?.video?.playCount,
      
      // Nested in carousel_media
      data?.carousel_media?.[0]?.video_view_count,
      data?.carousel_media?.[0]?.view_count,
      data?.carousel_media?.[0]?.play_count,
      data?.carousel_media?.[0]?.videoViewCount,
      data?.carousel_media?.[0]?.viewCount,
      data?.carousel_media?.[0]?.playCount
    ];

    // First try to find the highest valid number (likely the real view count)
    let maxViewCount = 0;
    for (const pattern of patterns) {
      if (pattern && !isNaN(parseInt(pattern))) {
        const count = parseInt(pattern);
        if (count > maxViewCount) {
          maxViewCount = count;
        }
      }
    }

    // If we found a reasonable view count, return it
    if (maxViewCount > 0) {
      return maxViewCount;
    }

    // If no reasonable count found, try to find any number that might be a view count
    for (const pattern of patterns) {
      if (pattern && !isNaN(parseInt(pattern))) {
        const count = parseInt(pattern);
        // Only return if it's a reasonable view count (not 1, 2, 3, etc.)
        if (count > 10) {
          return count;
        }
      }
    }

    return null;
  }

  async scrapeInstagramAlternative(postId) {
    try {
      // Try alternative Instagram endpoints and techniques
      const alternativeUrls = [
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis`,
        `https://www.instagram.com/p/${postId}/?__a=1`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis&max_id=0`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis&max_id=0&count=1`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis&max_id=0&count=1&max_id=0`
      ];

      for (const url of alternativeUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'X-Requested-With': 'XMLHttpRequest',
              'X-IG-App-ID': '936619743392459',
              'X-IG-WWW-Claim': '0',
              'X-Instagram-AJAX': '1',
              'X-CSRFToken': 'missing',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractInstagramViewCountFromResponse(data);
            if (viewCount !== null) {
              return viewCount;
            }
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Alternative method failed: ${error.message}`);
    }
  }

  async scrapeInstagramHeadless(postId) {
    try {
      // Try to get view count from Instagram's headless/API endpoints
      const headlessUrls = [
        `https://www.instagram.com/api/v1/media/${postId}/info/`,
        `https://i.instagram.com/api/v1/media/${postId}/info/`,
        `https://www.instagram.com/p/${postId}/media/?size=l`,
        `https://www.instagram.com/p/${postId}/media/?size=m`,
        `https://www.instagram.com/p/${postId}/media/?size=s`
      ];

      for (const url of headlessUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'X-Requested-With': 'XMLHttpRequest',
              'X-IG-App-ID': '936619743392459',
              'X-IG-WWW-Claim': '0',
              'X-Instagram-AJAX': '1',
              'X-CSRFToken': 'missing'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractInstagramViewCountFromResponse(data);
            if (viewCount !== null) {
              return viewCount;
            }
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Headless method failed: ${error.message}`);
    }
  }

  async scrapeInstagramFreeAPI(postId) {
    try {
      // Try multiple FREE Instagram APIs and scrapers
      const freeApis = [
        // Instagram downloader APIs (usually free)
        `https://instagram-scraper.vercel.app/api/info?url=https://www.instagram.com/p/${postId}/`,
        `https://instagram-api.vercel.app/api/info?url=https://www.instagram.com/p/${postId}/`,
        `https://api.instagram.com/p/${postId}/media/?size=l`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis`,
        `https://www.instagram.com/p/${postId}/?__a=1`,
        
        // Alternative free APIs
        `https://instagram-scraper-api.vercel.app/api/info?url=https://www.instagram.com/p/${postId}/`,
        `https://instagram-downloader.vercel.app/api/info?url=https://www.instagram.com/p/${postId}/`,
        `https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${postId}/`,
        
        // Try with different formats
        `https://www.instagram.com/p/${postId}/embed/`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis&max_id=0`
      ];

      for (const apiUrl of freeApis) {
        try {
          const response = await fetch(apiUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 10000 // 10 second timeout
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractInstagramViewCountFromResponse(data);
            if (viewCount !== null) {
              return viewCount;
            }
          }
        } catch (error) {
          console.log(`Free Instagram API ${apiUrl} failed:`, error.message);
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Free Instagram API method failed: ${error.message}`);
    }
  }

  async scrapeInstagramProxy(postId) {
    try {
      // Try using proxy-like techniques to bypass Instagram's restrictions
      const proxyUrls = [
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis&max_id=0&count=1`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis&max_id=0&count=1&max_id=0`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis&max_id=0&count=1&max_id=0&count=1`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis&max_id=0&count=1&max_id=0&count=1&max_id=0`
      ];

      for (const url of proxyUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'X-Requested-With': 'XMLHttpRequest',
              'X-IG-App-ID': '936619743392459',
              'X-ASBD-ID': '129477',
              'X-IG-WWW-Claim': '0',
              'X-Instagram-AJAX': '1',
              'X-CSRFToken': 'missing',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-origin',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            timeout: 15000 // 15 second timeout
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractInstagramViewCountFromResponse(data);
            if (viewCount !== null) {
              return viewCount;
            }
          }
        } catch (error) {
          console.log(`Proxy Instagram method ${url} failed:`, error.message);
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Proxy Instagram method failed: ${error.message}`);
    }
  }

  async scrapeInstagramHTML(postId) {
    try {
      // Try to scrape view count from HTML content with multiple patterns
      const htmlUrls = [
        `https://www.instagram.com/p/${postId}/`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis`,
        `https://www.instagram.com/p/${postId}/?__a=1`,
        `https://m.instagram.com/p/${postId}/`,
        `https://www.instagram.com/p/${postId}/embed/`
      ];

      for (const url of htmlUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'same-origin',
              'Upgrade-Insecure-Requests': '1',
              // Add Instagram cookies to HTML parsing method
              'Cookie': 'csrftoken=KEIqGvA53EZ7gbGGGS8auO; datr=1y7YaOdHgL81oKp88NwudL1w; ig_did=B55ECA23-E976-4C26-AAD8-34B6EAFA02B7; mid=aNgu1wALAAHefCSvrvXiw5Gy0NZb; ds_user_id=53153567088; ps_l=1; ps_n=1; oo=v1; sessionid=53153567088%3Ax7DaJEcB2kOb2w%3A9%3AAYj0lszphEHWWj3QQygX6G0egK_IJOR6RkIVI3SISal; rur="HIL\\05453153567088\\0541791131177:01fe2f9ee32bd597789bb56661e1147b32f680eb119213970483363c843307aa30e29ead"; wd=755x945'
            },
            timeout: 15000
          });

          if (response.ok) {
            const html = await response.text();
            
            // Try multiple regex patterns to find view count
            const patterns = [
              // JSON patterns (most reliable)
              /"video_view_count":(\d+)/g,
              /"view_count":(\d+)/g,
              /"views":(\d+)/g,
              /"play_count":(\d+)/g,
              /video_view_count["\s]*:["\s]*(\d+)/g,
              /view_count["\s]*:["\s]*(\d+)/g,
              /views["\s]*:["\s]*(\d+)/g,
              /play_count["\s]*:["\s]*(\d+)/g,
              /"videoViewCount":(\d+)/g,
              /"viewCount":(\d+)/g,
              /"playCount":(\d+)/g,
              /videoViewCount["\s]*:["\s]*(\d+)/g,
              /viewCount["\s]*:["\s]*(\d+)/g,
              /playCount["\s]*:["\s]*(\d+)/g,
              
              // Look for numbers with K/M suffixes first (most likely to be view counts)
              /(\d+(?:\.\d+)?[KMB])\s*views?\s*(?![a-zA-Z])/gi,
              // Skip plays for now as they might be false matches
              // /(\d+(?:\.\d+)?[KMB])\s*plays?/gi,
              /(\d+(?:\.\d+)?[KMB])\s*viewers?\s*(?![a-zA-Z])/gi,
              
              // Look for large numbers that could be view counts
              /(\d{4,})\s*views?\s*(?![a-zA-Z])/gi,
              // Skip plays for now as they might be false matches
              // /(\d{4,})\s*plays?/gi,
              /(\d{4,})\s*viewers?\s*(?![a-zA-Z])/gi,
              
              // Look for specific Instagram view count patterns
              /"video_view_count":\s*(\d+)/g,
              /"view_count":\s*(\d+)/g,
              /video_view_count["\s]*:["\s]*(\d+)/g,
              /view_count["\s]*:["\s]*(\d+)/g,
              
              // More flexible text patterns (but avoid "3View" type matches)
              /(\d+)\s+views?\s*(?![a-zA-Z])/gi,
              /(\d+)\s+plays?\s*(?![a-zA-Z])/gi,
              /(\d+)\s+viewers?\s*(?![a-zA-Z])/gi,
              /(\d+)\s+times?\s+viewed/gi,
              /viewed\s+(\d+)\s+times/gi,
              
              // Fallback: any number with "views" but not "View" (capital V)
              /(\d+)\s+views?/gi
            ];

            for (const pattern of patterns) {
              const matches = html.match(pattern);
              if (matches) {
                console.log(`🔍 DEBUG: Found matches for pattern ${pattern}:`, matches);
                for (const match of matches) {
                  // Skip obvious false matches like "3View" (no space before View)
                  if (match.match(/\d+View/)) {
                    console.log(`🔍 DEBUG: Skipping false match: ${match}`);
                    continue;
                  }
                  
                  let viewCount = this.parseViewCount(match);
                  console.log(`🔍 DEBUG: Extracted view count: ${viewCount} from match: ${match}`);
                  
                  // Only return if it's a reasonable view count (not 1, 2, 3, etc.)
                  if (viewCount > 10) {
                    return viewCount;
                  }
                }
              }
            }

            // Try to find JSON data in script tags
            const scriptMatches = html.match(/<script[^>]*>.*?window\._sharedData\s*=\s*({.*?});.*?<\/script>/s);
            if (scriptMatches) {
              try {
                const jsonStr = scriptMatches[1];
                console.log(`🔍 DEBUG: Found window._sharedData JSON data`);
                const data = JSON.parse(jsonStr);
                const viewCount = this.extractInstagramViewCountFromResponse(data);
                if (viewCount !== null) {
                  console.log(`✅ Found view count in JSON: ${viewCount}`);
                  return viewCount;
                }
              } catch (error) {
                console.log(`❌ Failed to parse JSON data:`, error.message);
                continue;
              }
            }

            // Try to find JSON data in other script tags
            const jsonMatches = html.match(/"video_view_count":(\d+)/g);
            if (jsonMatches) {
              for (const match of jsonMatches) {
                const viewCount = parseInt(match.replace(/\D/g, ''));
                if (viewCount > 0) {
                  return viewCount;
                }
              }
            }
          }
        } catch (error) {
          console.log(`HTML parsing method ${url} failed:`, error.message);
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`HTML parsing method failed: ${error.message}`);
    }
  }

  async scrapeInstagramInternalAPI(postId) {
    try {
      // Use Instagram's internal API with the exact headers from the working code
      const internalUrls = [
        `https://i.instagram.com/api/v1/media/${postId}/info/`,
        `https://www.instagram.com/api/v1/media/${postId}/info/`,
        `https://i.instagram.com/api/v1/media/${postId}/`,
        `https://www.instagram.com/api/v1/media/${postId}/`
      ];

      for (const url of internalUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'x-ig-app-id': '936619743392459',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'Accept': '*/*',
              'X-Requested-With': 'XMLHttpRequest',
              'X-IG-WWW-Claim': '0',
              'X-Instagram-AJAX': '1',
              'X-CSRFToken': 'missing',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-origin'
            },
            timeout: 15000
          });

          if (response.ok) {
            const data = await response.json();
            
            // DEBUG: Log the entire response to see what we're getting
            console.log(`🔍 DEBUG: Instagram Internal API response for post ${postId}:`, JSON.stringify(data, null, 2));
            
            const viewCount = this.extractInstagramViewCountFromResponse(data);
            if (viewCount !== null) {
              console.log(`✅ Found view count: ${viewCount} for post ${postId}`);
              return viewCount;
            } else {
              console.log(`❌ No view count found in response for post ${postId}`);
            }
          }
        } catch (error) {
          console.log(`Internal API method ${url} failed:`, error.message);
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Internal API method failed: ${error.message}`);
    }
  }

  async scrapeInstagramAuthenticated(postId) {
    try {
      // Try Instagram's authenticated endpoints (requires session cookies)
      const authenticatedUrls = [
        `https://www.instagram.com/api/v1/media/${postId}/info/`,
        `https://i.instagram.com/api/v1/media/${postId}/info/`,
        `https://www.instagram.com/graphql/query/?query_hash=2c4d4d3e2e2e2e2e2e2e2e2e2e2e2e2e&variables={"shortcode":"${postId}"}`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis`
      ];

      for (const url of authenticatedUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'x-ig-app-id': '936619743392459',
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'X-Requested-With': 'XMLHttpRequest',
              'X-IG-WWW-Claim': '0',
              'X-Instagram-AJAX': '1',
              'X-CSRFToken': 'missing',
              'X-ASBD-ID': '129477',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-origin',
              // Add session cookies here if you have them
              'Cookie': 'csrftoken=KEIqGvA53EZ7gbGGGS8auO; datr=1y7YaOdHgL81oKp88NwudL1w; ig_did=B55ECA23-E976-4C26-AAD8-34B6EAFA02B7; mid=aNgu1wALAAHefCSvrvXiw5Gy0NZb; ds_user_id=53153567088; ps_l=1; ps_n=1; oo=v1; sessionid=53153567088%3Ax7DaJEcB2kOb2w%3A9%3AAYj0lszphEHWWj3QQygX6G0egK_IJOR6RkIVI3SISal; rur="HIL\\05453153567088\\0541791131177:01fe2f9ee32bd597789bb56661e1147b32f680eb119213970483363c843307aa30e29ead"; wd=755x945'
            },
            timeout: 15000
          });

          if (response.ok) {
            const data = await response.json();
            
            // DEBUG: Log the response to see what we get
            console.log(`🔍 DEBUG: Instagram Authenticated API response for post ${postId}:`, JSON.stringify(data, null, 2));
            
            const viewCount = this.extractInstagramViewCountFromResponse(data);
            if (viewCount !== null) {
              console.log(`✅ Found view count: ${viewCount} for post ${postId}`);
              return viewCount;
            } else {
              console.log(`❌ No view count found in authenticated response for post ${postId}`);
            }
          } else {
            console.log(`❌ Authenticated API returned status: ${response.status}`);
          }
        } catch (error) {
          console.log(`Authenticated API method ${url} failed:`, error.message);
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Authenticated API method failed: ${error.message}`);
    }
  }

  async scrapeInstagramEmbedAPI(postId) {
    try {
      // Try Instagram's oEmbed API and other public endpoints
      const embedUrls = [
        `https://www.instagram.com/p/${postId}/embed/`,
        `https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${postId}/`,
        `https://www.instagram.com/p/${postId}/?__a=1&__d=dis`,
        `https://www.instagram.com/p/${postId}/?__a=1`,
        `https://www.instagram.com/p/${postId}/media/?size=l`,
        `https://www.instagram.com/p/${postId}/media/?size=m`,
        `https://www.instagram.com/p/${postId}/media/?size=s`
      ];

      for (const url of embedUrls) {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/html, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.instagram.com/',
              'Origin': 'https://www.instagram.com',
              'X-Requested-With': 'XMLHttpRequest',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            timeout: 15000
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              // Try to parse as JSON
              try {
                const data = await response.json();
                console.log(`🔍 DEBUG: Instagram Embed API JSON response for post ${postId}:`, JSON.stringify(data, null, 2));
                
                const viewCount = this.extractInstagramViewCountFromResponse(data);
                if (viewCount !== null) {
                  console.log(`✅ Found view count in JSON: ${viewCount}`);
                  return viewCount;
                }
              } catch (error) {
                console.log(`Failed to parse JSON from ${url}:`, error.message);
              }
            } else {
              // Try to parse as HTML
              const html = await response.text();
              console.log(`🔍 DEBUG: Instagram Embed API HTML response for post ${postId} (first 500 chars):`, html.substring(0, 500));
              
              // Look for view count in HTML
              const patterns = [
                /"video_view_count":\s*(\d+)/g,
                /"view_count":\s*(\d+)/g,
                /video_view_count["\s]*:["\s]*(\d+)/g,
                /view_count["\s]*:["\s]*(\d+)/g,
                /(\d{4,})\s*views?/gi,
                /(\d+(?:\.\d+)?[KMB])\s*views?/gi
              ];

              for (const pattern of patterns) {
                const matches = html.match(pattern);
                if (matches) {
                  console.log(`🔍 DEBUG: Found matches for pattern ${pattern}:`, matches);
                  for (const match of matches) {
                    const viewCount = this.parseViewCount(match);
                    if (viewCount > 10) {
                      console.log(`✅ Found view count in HTML: ${viewCount}`);
                      return viewCount;
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.log(`Embed API method ${url} failed:`, error.message);
          continue;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Embed API method failed: ${error.message}`);
    }
  }

  // Instagram scraping methods
  async scrapeInstagramDirect(postId) {
    const url = `https://www.instagram.com/p/${postId}/`;
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Look for view count in various patterns
    const patterns = [
      /"video_view_count":(\d+)/,
      /"view_count":(\d+)/,
      /"videoViewCount":(\d+)/,
      /"viewCount":(\d+)/,
      /"views":(\d+)/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  async scrapeInstagramEmbed(postId) {
    const embedUrl = `https://www.instagram.com/p/${postId}/embed/`;
    const userAgent = this.getRandomUserAgent();
    
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Look for view count in embed
    const patterns = [
      /"video_view_count":(\d+)/,
      /"view_count":(\d+)/,
      /"views":(\d+)/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  async scrapeInstagramAPI(postId) {
    // Try Instagram's internal API endpoints
    const endpoints = [
      `https://www.instagram.com/api/v1/media/${postId}/info/`,
      `https://www.instagram.com/graphql/query/?query_hash=2c4d4d3e2e2e2e2e2e2e2e2e2e2e2e2e&variables={"shortcode":"${postId}"}`
    ];

    for (const endpoint of endpoints) {
      try {
        const userAgent = this.getRandomUserAgent();
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Parse different response formats
          if (data.items && data.items[0]) {
            const item = data.items[0];
            return item.video_view_count || item.view_count || null;
          }
          
          if (data.data && data.data.shortcode_media) {
            const media = data.data.shortcode_media;
            return media.video_view_count || media.view_count || null;
          }
        }
      } catch (error) {
        console.log(`Instagram API endpoint failed: ${endpoint}`, error.message);
        continue;
      }
    }

    return null;
  }

  // Rate limiting methods
  async checkYouTubeRateLimit() {
    const now = Date.now();
    this.youtubeRequests = this.youtubeRequests.filter(time => now - time < 100000); // 100 seconds
    
    if (this.youtubeRequests.length >= this.youtubeRateLimit) {
      const waitTime = 100000 - (now - this.youtubeRequests[0]);
      console.log(`YouTube rate limit reached, waiting ${Math.ceil(waitTime/1000)} seconds`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.youtubeRequests.push(now);
  }

  async checkTikTokRateLimit() {
    const now = Date.now();
    this.tiktokRequests = this.tiktokRequests.filter(time => now - time < 60000); // 1 minute
    
    if (this.tiktokRequests.length >= this.tiktokRateLimit) {
      const waitTime = 60000 - (now - this.tiktokRequests[0]);
      console.log(`TikTok rate limit reached, waiting ${Math.ceil(waitTime/1000)} seconds`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.tiktokRequests.push(now);
  }

  async checkInstagramRateLimit() {
    const now = Date.now();
    this.instagramRequests = this.instagramRequests.filter(time => now - time < 60000); // 1 minute
    
    if (this.instagramRequests.length >= this.instagramRateLimit) {
      const waitTime = 60000 - (now - this.instagramRequests[0]);
      console.log(`Instagram rate limit reached, waiting ${Math.ceil(waitTime/1000)} seconds`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.instagramRequests.push(now);
  }

  // Utility methods
  extractTikTokVideoId(url) {
    const patterns = [
      /tiktok\.com\/@[^\/]+\/video\/(\d+)/,
      /tiktok\.com\/video\/(\d+)/,
      /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
      /vt\.tiktok\.com\/([A-Za-z0-9]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  extractInstagramPostId(url) {
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  // Twitter/X scraper with enhanced anti-detection measures
  async getTwitterViewCount(tweetUrl) {
    try {
      // Rate limiting check
      await this.checkTwitterRateLimit();

      const tweetId = this.extractTwitterTweetId(tweetUrl);
      if (!tweetId) {
        console.log('Could not extract Twitter tweet ID from:', tweetUrl);
        return null;
      }

      // Try multiple methods to get view count (prioritize authenticated methods)
      const methods = [
        () => this.scrapeTwitterAuthenticated(tweetId),
        () => this.scrapeTwitterAdvanced(tweetId),
        () => this.scrapeTwitterDirect(tweetId),
        () => this.scrapeTwitterAPI(tweetId),
        () => this.scrapeTwitterMobile(tweetId),
        () => this.scrapeTwitterEmbed(tweetId),
        () => this.scrapeTwitterHTML(tweetId),
        () => this.scrapeTwitterFreeAPI(tweetId),
        () => this.scrapeTwitterProxy(tweetId),
        () => this.scrapeTwitterAlternative(tweetId),
        () => this.scrapeTwitterHeadless(tweetId)
      ];

      for (let i = 0; i < methods.length; i++) {
        try {
          console.log(`🔄 Trying Twitter method ${i + 1}/${methods.length}`);
          const result = await methods[i]();
          if (result && result > 0) {
            console.log(`✅ SUCCESS! Twitter method ${i + 1} got ${result} views for tweet ${tweetId}`);
            return result;
          }
        } catch (error) {
          console.log(`❌ Twitter method ${i + 1} failed:`, error.message);
        }
      }

      console.log('❌ All Twitter methods failed');
      
      // Return a fallback message for Twitter since it's very difficult to scrape
      console.log('⚠️ Twitter view counts are not available due to platform restrictions');
      return 'Twitter view counts are not available. Twitter/X has very strict anti-bot measures that prevent free scraping. Consider using YouTube, TikTok, or Instagram for view count tracking.';
    } catch (error) {
      console.error('Error in getTwitterViewCount:', error);
      return null;
    }
  }

  // Authenticated Twitter scraping method (most effective)
  async scrapeTwitterAuthenticated(tweetId) {
    try {
      // Check if we have credentials
      if (!this.twitterCredentials.csrfToken || !this.twitterCredentials.sessionCookies) {
        console.log('Twitter credentials not provided, skipping authenticated method');
        throw new Error('No Twitter credentials provided');
      }

      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      // Try authenticated API endpoints
      const authenticatedUrls = [
        `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&include_entities=true&tweet_mode=extended`,
        `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
        `https://twitter.com/i/api/2/timeline/conversation/${tweetId}.json`,
        `https://twitter.com/i/api/graphql/tweet_detail/${tweetId}`
      ];

      for (const url of authenticatedUrls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': userAgent,
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Authorization': `Bearer ${this.twitterCredentials.bearerToken}`,
              'X-Twitter-Active-User': 'yes',
              'X-Twitter-Client-Language': 'en',
              'X-Csrf-Token': this.twitterCredentials.csrfToken,
              'Cookie': this.twitterCredentials.sessionCookies,
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractTwitterViewCountFromResponse(data);
            if (viewCount) {
              console.log(`✅ Authenticated Twitter method succeeded with ${viewCount} views`);
              return viewCount;
            }
          }
        } catch (error) {
          console.log(`Authenticated method ${url} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log(`Authenticated Twitter method failed:`, error.message);
    }
    throw new Error('Authenticated Twitter method failed');
  }

  // Twitter scraping methods with authentication
  async scrapeTwitterAdvanced(tweetId) {
    try {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      
      // Use authenticated headers with your credentials
      const response = await fetch(`https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA',
          'X-Twitter-Active-User': 'yes',
          'X-Twitter-Client-Language': 'en',
          'X-Csrf-Token': this.twitterCredentials.csrfToken,
          'Cookie': this.twitterCredentials.sessionCookies
        }
      });

      if (response.ok) {
        const data = await response.json();
        const viewCount = this.extractTwitterViewCountFromResponse(data);
        if (viewCount) return viewCount;
      }
    } catch (error) {
      console.log(`Advanced Twitter method failed:`, error.message);
    }
    throw new Error('Advanced Twitter method failed');
  }

  async scrapeTwitterDirect(tweetId) {
    try {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      const response = await fetch(`https://twitter.com/i/api/2/timeline/conversation/${tweetId}.json`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA',
          'X-Twitter-Active-User': 'yes',
          'X-Twitter-Client-Language': 'en',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const viewCount = this.extractTwitterViewCountFromResponse(data);
        if (viewCount) return viewCount;
      }
    } catch (error) {
      console.log(`Direct Twitter method failed:`, error.message);
    }
    throw new Error('Direct Twitter method failed');
  }

  async scrapeTwitterAPI(tweetId) {
    try {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      
      const response = await fetch(`https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const viewCount = this.extractTwitterViewCountFromResponse(data);
        if (viewCount) return viewCount;
      }
    } catch (error) {
      console.log(`API Twitter method failed:`, error.message);
    }
    throw new Error('API Twitter method failed');
  }

  async scrapeTwitterMobile(tweetId) {
    try {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      
      const response = await fetch(`https://mobile.twitter.com/i/web/status/${tweetId}`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'max-age=0'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const viewCount = this.extractTwitterViewCountFromHTML(html);
        if (viewCount) return viewCount;
      }
    } catch (error) {
      console.log(`Mobile Twitter method failed:`, error.message);
    }
    throw new Error('Mobile Twitter method failed');
  }

  async scrapeTwitterEmbed(tweetId) {
    try {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      const response = await fetch(`https://publish.twitter.com/oembed?url=https://twitter.com/i/web/status/${tweetId}`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const viewCount = this.extractTwitterViewCountFromResponse(data);
        if (viewCount) return viewCount;
      }
    } catch (error) {
      console.log(`Embed Twitter method failed:`, error.message);
    }
    throw new Error('Embed Twitter method failed');
  }

  async scrapeTwitterHTML(tweetId) {
    try {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      
      const response = await fetch(`https://twitter.com/i/web/status/${tweetId}`, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'max-age=0'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const viewCount = this.extractTwitterViewCountFromHTML(html);
        if (viewCount) return viewCount;
      }
    } catch (error) {
      console.log(`HTML Twitter method failed:`, error.message);
    }
    throw new Error('HTML Twitter method failed');
  }

  // Twitter helper methods
  extractTwitterTweetId(url) {
    const patterns = [
      /twitter\.com\/.*\/status\/(\d+)/,
      /x\.com\/.*\/status\/(\d+)/,
      /t\.co\/\w+/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  extractTwitterViewCountFromResponse(data) {
    try {
      // Try to find view count in various possible locations
      const possiblePaths = [
        'data.public_metrics.impression_count',
        'data.public_metrics.view_count',
        'data.organic_metrics.impression_count',
        'data.non_public_metrics.impression_count',
        'public_metrics.impression_count',
        'public_metrics.view_count',
        'organic_metrics.impression_count',
        'non_public_metrics.impression_count',
        'impression_count',
        'view_count',
        'views',
        'impressions',
        'data.views',
        'data.impressions',
        'data.impression_count',
        'data.view_count'
      ];

      for (const path of possiblePaths) {
        const value = this.getNestedValue(data, path);
        if (value && typeof value === 'number' && value > 0) {
          return value;
        }
      }

      // Try to find in nested objects with more comprehensive checking
      if (data.data) {
        const tweetData = data.data;
        
        // Check public_metrics
        if (tweetData.public_metrics) {
          const metrics = tweetData.public_metrics;
          if (metrics.impression_count) return metrics.impression_count;
          if (metrics.view_count) return metrics.view_count;
        }
        
        // Check organic_metrics
        if (tweetData.organic_metrics) {
          const metrics = tweetData.organic_metrics;
          if (metrics.impression_count) return metrics.impression_count;
          if (metrics.view_count) return metrics.view_count;
        }
        
        // Check non_public_metrics
        if (tweetData.non_public_metrics) {
          const metrics = tweetData.non_public_metrics;
          if (metrics.impression_count) return metrics.impression_count;
          if (metrics.view_count) return metrics.view_count;
        }
      }

      // Check if data is an array (timeline response)
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.public_metrics) {
            const metrics = item.public_metrics;
            if (metrics.impression_count) return metrics.impression_count;
            if (metrics.view_count) return metrics.view_count;
          }
        }
      }

      // Check for timeline responses
      if (data.timeline && data.timeline.instructions) {
        for (const instruction of data.timeline.instructions) {
          if (instruction.addEntries && instruction.addEntries.entries) {
            for (const entry of instruction.addEntries.entries) {
              if (entry.content && entry.content.item && entry.content.item.content) {
                const content = entry.content.item.content;
                if (content.tweet && content.tweet.public_metrics) {
                  const metrics = content.tweet.public_metrics;
                  if (metrics.impression_count) return metrics.impression_count;
                  if (metrics.view_count) return metrics.view_count;
                }
              }
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.log('Error extracting Twitter view count from response:', error);
      return null;
    }
  }

  extractTwitterViewCountFromHTML(html) {
    try {
      // Look for view count patterns in HTML with more aggressive patterns
      const patterns = [
        // Standard view count patterns
        /(\d+(?:,\d+)*)\s*views?/gi,
        /(\d+(?:,\d+)*)\s*impressions?/gi,
        /"impression_count":(\d+)/gi,
        /"view_count":(\d+)/gi,
        /"views":(\d+)/gi,
        /"impressions":(\d+)/gi,
        
        // Twitter-specific patterns
        /"public_metrics":\s*\{[^}]*"impression_count":\s*(\d+)/gi,
        /"public_metrics":\s*\{[^}]*"view_count":\s*(\d+)/gi,
        /"organic_metrics":\s*\{[^}]*"impression_count":\s*(\d+)/gi,
        /"non_public_metrics":\s*\{[^}]*"impression_count":\s*(\d+)/gi,
        
        // HTML data attributes
        /data-impression-count="(\d+)"/gi,
        /data-view-count="(\d+)"/gi,
        /data-views="(\d+)"/gi,
        /data-impressions="(\d+)"/gi,
        
        // JSON in script tags
        /"impression_count":\s*(\d+)/gi,
        /"view_count":\s*(\d+)/gi,
        /"views":\s*(\d+)/gi,
        /"impressions":\s*(\d+)/gi,
        
        // Twitter timeline patterns
        /"timeline":\s*\{[^}]*"impression_count":\s*(\d+)/gi,
        /"tweet":\s*\{[^}]*"impression_count":\s*(\d+)/gi,
        
        // Generic number patterns (be careful with these)
        /(\d{4,})\s*(?:views?|impressions?|views|impressions)/gi,
        /(\d{4,})\s*(?:view|impression)/gi
      ];

      let maxViewCount = 0;
      for (const pattern of patterns) {
        const matches = html.match(pattern);
        if (matches) {
          for (const match of matches) {
            const numberMatch = match.match(/(\d+(?:,\d+)*)/);
            if (numberMatch) {
              const count = parseInt(numberMatch[1].replace(/,/g, ''));
              // Only accept reasonable view counts (1000+ to avoid false positives)
              if (count > 1000 && count > maxViewCount) {
                maxViewCount = count;
              }
            }
          }
        }
      }

      return maxViewCount > 0 ? maxViewCount : null;
    } catch (error) {
      console.log('Error extracting Twitter view count from HTML:', error);
      return null;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Additional Twitter scraping methods
  async scrapeTwitterFreeAPI(tweetId) {
    try {
      // Try free third-party APIs for Twitter
      const freeAPIs = [
        `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}`,
        `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
        `https://cdn.syndication.twitter.com/timeline/profile?screen_name=twitter&id=${tweetId}`,
        `https://publish.twitter.com/oembed?url=https://twitter.com/i/web/status/${tweetId}`,
        `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&include_entities=true`
      ];

      for (const apiUrl of freeAPIs) {
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractTwitterViewCountFromResponse(data);
            if (viewCount) return viewCount;
          }
        } catch (error) {
          console.log(`Free API ${apiUrl} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log(`Free API method failed:`, error.message);
    }
    throw new Error('Free API method failed');
  }

  async scrapeTwitterProxy(tweetId) {
    try {
      // Try proxy-like techniques to bypass restrictions
      const proxyUrls = [
        `https://twitter.com/i/web/status/${tweetId}`,
        `https://mobile.twitter.com/i/web/status/${tweetId}`,
        `https://t.co/${tweetId}`,
        `https://x.com/i/web/status/${tweetId}`
      ];

      for (const url of proxyUrls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });

          if (response.ok) {
            const html = await response.text();
            const viewCount = this.extractTwitterViewCountFromHTML(html);
            if (viewCount) return viewCount;
          }
        } catch (error) {
          console.log(`Proxy method ${url} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log(`Proxy method failed:`, error.message);
    }
    throw new Error('Proxy method failed');
  }

  async scrapeTwitterAlternative(tweetId) {
    try {
      // Try alternative endpoints and techniques
      const alternativeUrls = [
        `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&include_entities=true&tweet_mode=extended`,
        `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,non_public_metrics,organic_metrics`,
        `https://twitter.com/i/api/2/timeline/conversation/${tweetId}.json`,
        `https://twitter.com/i/api/graphql/tweet_detail/${tweetId}`,
        `https://api.twitter.com/1.1/statuses/lookup.json?id=${tweetId}`
      ];

      for (const url of alternativeUrls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'X-Twitter-Active-User': 'yes',
              'X-Twitter-Client-Language': 'en',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractTwitterViewCountFromResponse(data);
            if (viewCount) return viewCount;
          }
        } catch (error) {
          console.log(`Alternative method ${url} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log(`Alternative method failed:`, error.message);
    }
    throw new Error('Alternative method failed');
  }

  async scrapeTwitterHeadless(tweetId) {
    try {
      // Try headless/API endpoints
      const headlessUrls = [
        `https://twitter.com/i/api/2/timeline/conversation/${tweetId}.json?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&skip_status=1&cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_quote_count=true&include_reply_count=1&tweet_mode=extended&include_entities=true&include_user_entities=true&include_ext_media_color=true&include_ext_media_availability=true&send_error_codes=true&simple_quoted_tweet=true&count=20&include_ext_has_binding_values=true&requestContext=launch&include_ext_media_color=true&include_ext_has_binding_values=true&include_ext_media_availability=true&include_ext_sensitive_media_warning=true&include_ext_trusted_friends_metadata=true&ext=mediaColor%2ChasBindingValues%2CmediaAvailability%2CsensitiveMediaWarning%2CtrustedFriendsMetadata`,
        `https://twitter.com/i/api/graphql/tweet_detail/${tweetId}`,
        `https://api.twitter.com/1.1/statuses/show.json?id=${tweetId}&include_entities=true&include_my_retweet=true&include_rts=true&tweet_mode=extended`
      ];

      for (const url of headlessUrls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'X-Twitter-Active-User': 'yes',
              'X-Twitter-Client-Language': 'en',
              'X-Requested-With': 'XMLHttpRequest',
              'X-Twitter-Auth-Type': 'OAuth2Session'
            }
          });

          if (response.ok) {
            const data = await response.json();
            const viewCount = this.extractTwitterViewCountFromResponse(data);
            if (viewCount) return viewCount;
          }
        } catch (error) {
          console.log(`Headless method ${url} failed:`, error.message);
        }
      }
    } catch (error) {
      console.log(`Headless method failed:`, error.message);
    }
    throw new Error('Headless method failed');
  }

  // Twitter rate limiting
  async checkTwitterRateLimit() {
    const now = Date.now();
    this.twitterRequests = this.twitterRequests.filter(time => now - time < 60000); // Keep last minute
    
    if (this.twitterRequests.length >= this.twitterRateLimit) {
      const waitTime = 60000 - (now - this.twitterRequests[0]);
      if (waitTime > 0) {
        console.log(`Twitter rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.twitterRequests.push(now);
  }

  extractYouTubeVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  // Batch processing for multiple videos
  async updateViewCountsBatch(clips) {
    const results = {
      youtube: { updated: 0, errors: 0 },
      tiktok: { updated: 0, errors: 0 },
      instagram: { updated: 0, errors: 0 },
      twitter: { updated: 0, errors: 0 },
      x: { updated: 0, errors: 0 }
    };

    for (const clip of clips) {
      try {
        let viewCount = null;
        
        switch (clip.platform) {
          case 'YouTube':
            const youtubeId = this.extractYouTubeVideoId(clip.video_link);
            if (youtubeId) {
              viewCount = await this.getYouTubeViewCount(youtubeId);
            }
            break;
            
          case 'TikTok':
            viewCount = await this.getTikTokViewCount(clip.video_link);
            break;
            
          case 'Instagram':
            viewCount = await this.getInstagramViewCount(clip.video_link);
            break;
            
          case 'Twitter':
          case 'X':
            viewCount = await this.getTwitterViewCount(clip.video_link);
            break;
        }

        if (viewCount !== null) {
          // Update database
          const { error: updateError } = await supabase
            .from('clips')
            .update({ 
              view_count: viewCount,
              last_view_count_update: new Date().toISOString()
            })
            .eq('id', clip.id);

          if (!updateError) {
            const platformKey = clip.platform.toLowerCase() === 'x' ? 'twitter' : clip.platform.toLowerCase();
            results[platformKey].updated++;
            console.log(`Updated ${clip.platform} clip ${clip.id}: ${viewCount} views`);
          } else {
            const platformKey = clip.platform.toLowerCase() === 'x' ? 'twitter' : clip.platform.toLowerCase();
            results[platformKey].errors++;
            console.error(`Error updating ${clip.platform} clip ${clip.id}:`, updateError);
          }
        } else {
          const platformKey = clip.platform.toLowerCase() === 'x' ? 'twitter' : clip.platform.toLowerCase();
          results[platformKey].errors++;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Error processing ${clip.platform} clip ${clip.id}:`, error);
        results[clip.platform.toLowerCase()].errors++;
      }
    }

    return results;
  }

  // Get quota status
  getQuotaStatus() {
    return {
      youtube: {
        used: this.youtubeQuotaUsed,
        limit: this.youtubeQuotaLimit,
        remaining: this.youtubeQuotaLimit - this.youtubeQuotaUsed,
        percentage: Math.round((this.youtubeQuotaUsed / this.youtubeQuotaLimit) * 100)
      }
    };
  }

  // Reset quota (call this daily)
  resetQuota() {
    this.youtubeQuotaUsed = 0;
    this.lastResetTime = Date.now();
    console.log('YouTube API quota reset');
  }
}

export default ViewCountManager;

