// Safe Twitter Token Extractor
// Run this in your browser console on twitter.com

console.log('🔐 Safe Twitter Token Extractor');
console.log('===============================');

// Get CSRF Token (ct0)
const csrfToken = document.cookie.split(';').find(c => c.trim().startsWith('ct0='));
if (csrfToken) {
    console.log('✅ CSRF Token:');
    console.log(csrfToken.split('=')[1]);
} else {
    console.log('❌ CSRF Token not found');
}

// Get Auth Token (safer method)
const authToken = document.cookie.split(';').find(c => c.trim().startsWith('auth_token='));
if (authToken) {
    console.log('✅ Auth Token:');
    console.log(authToken.split('=')[1]);
} else {
    console.log('❌ Auth Token not found');
}

// Get Full Cookie String
console.log('✅ Full Cookie String:');
console.log(document.cookie);

// Get Bearer Token (default)
console.log('✅ Bearer Token (default):');
console.log('AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cKjh5ZKhSlQABPA');

console.log('===============================');
console.log('📋 Copy the values above to your .env file');


