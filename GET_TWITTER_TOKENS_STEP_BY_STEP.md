# 🔐 How to Get Twitter Tokens - Step by Step

## Method 1: Using Browser Developer Tools (Easiest)

### Step 1: Open Twitter and Login
1. Go to [twitter.com](https://twitter.com) in your browser
2. **Log in to your account**
3. Make sure you're on the main Twitter page

### Step 2: Open Developer Tools
1. **Right-click anywhere** on the page
2. Select **"Inspect"** or **"Inspect Element"**
3. Or press **F12** on your keyboard
4. Click on the **"Network"** tab at the top

### Step 3: Refresh the Page
1. Press **F5** or **Ctrl+R** to refresh the page
2. You should see many requests loading in the Network tab
3. Wait for the page to fully load

### Step 4: Find Twitter API Requests
1. In the Network tab, look for requests that contain:
   - `api.twitter.com`
   - `twitter.com/i/api`
   - `twitter.com/i/web`
2. **Click on any of these requests**

### Step 5: Get the Headers
1. In the request details, click on **"Headers"**
2. Look for these specific headers:

#### 🍪 Cookie (Most Important)
- Look for **"Cookie"** in the Request Headers
- Copy the **entire value** (it's very long)
- Should look like: `auth_token=abc123; ct0=def456; _twitter_sess=ghi789...`

#### 🔑 CSRF Token
- Look for **"X-Csrf-Token"** in Request Headers
- Or find **"ct0"** in the Cookie value
- Copy this value

#### 🎫 Authorization Token
- Look for **"Authorization"** header
- Copy the Bearer token value
- Or find **"auth_token"** in the Cookie

## Method 2: Using Browser Console (Alternative)

### Step 1: Open Console
1. Go to twitter.com and login
2. Press **F12** to open Developer Tools
3. Click on **"Console"** tab

### Step 2: Run JavaScript Commands
Copy and paste these commands one by one:

```javascript
// Get CSRF Token
document.cookie.split(';').find(c => c.trim().startsWith('ct0=')).split('=')[1]

// Get Auth Token
document.cookie.split(';').find(c => c.trim().startsWith('auth_token=')).split('=')[1]

// Get Full Cookie String
document.cookie
```

## Method 3: Using Browser Extensions

### Step 1: Install Cookie Editor Extension
1. Go to Chrome Web Store
2. Search for "Cookie Editor" or "EditThisCookie"
3. Install the extension

### Step 2: Extract Cookies
1. Go to twitter.com and login
2. Click on the Cookie Editor extension
3. Look for these cookies:
   - `auth_token`
   - `ct0`
   - `_twitter_sess`

## 📝 What You Need to Copy:

### 1. CSRF Token (X-Csrf-Token)
- **Where to find**: Request Headers → X-Csrf-Token
- **Or**: Cookie → ct0 value
- **Example**: `abc123def456ghi789`

### 2. Session Cookies (Cookie)
- **Where to find**: Request Headers → Cookie
- **Example**: `auth_token=xyz789; ct0=abc123; _twitter_sess=jkl012...`

### 3. Auth Token
- **Where to find**: Cookie → auth_token value
- **Or**: Authorization header
- **Example**: `xyz789abc123def456`

### 4. Bearer Token (Optional)
- **Where to find**: Request Headers → Authorization
- **Example**: `AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA`

## 🔧 How to Add to Your Bot:

### Step 1: Open .env file
1. Open the `.env` file in your bot folder
2. Add these lines:

```env
# Twitter Authentication
TWITTER_CSRF_TOKEN=your_csrf_token_here
TWITTER_SESSION_COOKIES=your_full_cookie_string_here
TWITTER_AUTH_TOKEN=your_auth_token_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### Step 2: Replace the Values
Replace the placeholder text with your actual tokens:

```env
TWITTER_CSRF_TOKEN=abc123def456
TWITTER_SESSION_COOKIES=auth_token=xyz789; ct0=abc123; _twitter_sess=jkl012; other_cookies=...
TWITTER_AUTH_TOKEN=xyz789abc123
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA
```

## 🧪 Testing Your Tokens:

### Step 1: Restart the Bot
1. Stop the bot (Ctrl+C)
2. Start it again: `node index.js`

### Step 2: Test with a Twitter Link
1. Use the `/test-views` command
2. Try with a Twitter link: `/test-views link:https://twitter.com/username/status/1234567890`
3. Check if it shows view counts instead of "not available"

## ⚠️ Important Notes:

- **Keep tokens secure** - Don't share them publicly
- **Tokens expire** - You may need to refresh them every few days
- **Use your own account** - Don't use someone else's tokens
- **Test regularly** - Check if tokens are still working

## 🆘 If You Can't Find the Tokens:

1. **Try a different browser** (Chrome, Firefox, Edge)
2. **Clear cookies and login again**
3. **Use incognito/private mode**
4. **Try the console method** (Method 2 above)

## 📞 Need Help?

If you're still having trouble, you can:
1. **Take a screenshot** of the Network tab
2. **Share the request details** (without the actual token values)
3. **Ask for help** with the specific step you're stuck on

The most important tokens are:
- **CSRF Token** (ct0)
- **Session Cookies** (full cookie string)
- **Auth Token** (auth_token)

Once you have these, Twitter scraping should work much better!


