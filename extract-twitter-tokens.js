// Twitter Token Extractor
// Run this in your browser console on twitter.com

console.log('🔐 Twitter Token Extractor');
console.log('========================');

// Extract CSRF Token
const csrfToken = document.cookie.split(';').find(c => c.trim().startsWith('ct0='));
if (csrfToken) {
    console.log('✅ CSRF Token found:');
    console.log('TWITTER_CSRF_TOKEN=' + csrfToken.split('=')[1]);
} else {
    console.log('❌ CSRF Token not found');
}

// Extract Auth Token
const authToken = document.cookie.split(';').find(c => c.trim().startsWith('auth_token='));
if (authToken) {
    console.log('✅ Auth Token found:');
    console.log('TWITTER_AUTH_TOKEN=' + authToken.split('=')[1]);
} else {
    console.log('❌ Auth Token not found');
}

// Extract Full Cookie String
const fullCookie = document.cookie;
if (fullCookie) {
    console.log('✅ Full Cookie String found:');
    console.log('TWITTER_SESSION_COOKIES=' + fullCookie);
} else {
    console.log('❌ Cookie String not found');
}

// Extract Bearer Token (if available)
const bearerToken = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA';
console.log('✅ Bearer Token (default):');
console.log('TWITTER_BEARER_TOKEN=' + bearerToken);

console.log('========================');
console.log('📋 Copy these values to your .env file');
console.log('🔄 Restart your bot after adding the tokens');
console.log('🧪 Test with /test-views command');


