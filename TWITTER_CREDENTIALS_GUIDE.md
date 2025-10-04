# 🔐 Twitter Credentials Setup Guide

## How to Get Your Twitter Credentials

### Step 1: Open Twitter in Browser
1. Go to [twitter.com](https://twitter.com) and log in to your account
2. Open Developer Tools (F12 or right-click → Inspect)
3. Go to the **Network** tab
4. Refresh the page (F5)

### Step 2: Find the Credentials
1. Look for any request to `api.twitter.com` or `twitter.com/i/api`
2. Click on one of these requests
3. In the **Headers** section, look for:

#### Required Headers:
- **Cookie**: Copy the entire cookie string (starts with `auth_token=...`)
- **X-Csrf-Token**: Copy the CSRF token value
- **Authorization**: Copy the Bearer token (if present)

### Step 3: Set Environment Variables
Add these to your `.env` file:

```env
# Twitter Authentication Credentials
TWITTER_CSRF_TOKEN=your_csrf_token_here
TWITTER_SESSION_COOKIES=your_full_cookie_string_here
TWITTER_AUTH_TOKEN=your_auth_token_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### Step 4: Example Values
Your credentials should look like this:

```env
TWITTER_CSRF_TOKEN=abc123def456
TWITTER_SESSION_COOKIES=auth_token=xyz789; ct0=abc123def456; _twitter_sess=...
TWITTER_AUTH_TOKEN=your_auth_token_value
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA
```

## 🔍 How to Find Each Value:

### Cookie String:
- Look for the `Cookie` header in any Twitter API request
- Copy the entire value (it's usually very long)
- Should contain `auth_token`, `ct0`, `_twitter_sess`, etc.

### CSRF Token:
- Look for `X-Csrf-Token` header
- Or look for `ct0` in the cookie string
- Usually a short alphanumeric string

### Auth Token:
- Look for `auth_token` in the cookie string
- Or look for `Authorization` header with Bearer token

## ⚠️ Important Notes:
- **Keep these credentials secure** - don't share them publicly
- **Credentials expire** - you may need to refresh them periodically
- **Use your own account** - don't use someone else's credentials
- **Test first** - try the `/test-views` command with a Twitter link

## 🧪 Testing:
Once you've added the credentials, restart the bot and try:
```
/test-views link:https://twitter.com/username/status/1234567890
```

The authenticated method should work much better than the free methods!


