// Find Auth Token - Run this in browser console on twitter.com

console.log('🔍 Looking for Auth Token...');
console.log('============================');

// Method 1: Check all cookies for auth_token
const allCookies = document.cookie;
const authTokenMatch = allCookies.match(/auth_token=([^;]+)/);
if (authTokenMatch) {
    console.log('✅ Auth Token found in cookies:');
    console.log(authTokenMatch[1]);
} else {
    console.log('❌ Auth Token not found in cookies');
}

// Method 2: Check localStorage
const localStorage = window.localStorage;
let foundInStorage = false;
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    if (key.includes('auth') || key.includes('token') || value.includes('auth_token')) {
        console.log('✅ Found in localStorage:');
        console.log(key + ':', value);
        foundInStorage = true;
    }
}
if (!foundInStorage) {
    console.log('❌ No auth tokens found in localStorage');
}

// Method 3: Check sessionStorage
const sessionStorage = window.sessionStorage;
let foundInSession = false;
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    if (key.includes('auth') || key.includes('token') || value.includes('auth_token')) {
        console.log('✅ Found in sessionStorage:');
        console.log(key + ':', value);
        foundInSession = true;
    }
}
if (!foundInSession) {
    console.log('❌ No auth tokens found in sessionStorage');
}

// Method 4: Check if you're logged in
console.log('🔍 Checking login status...');
if (document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]') || 
    document.querySelector('[aria-label="Account menu"]') ||
    document.querySelector('[data-testid="AppTabBar_Profile_Link"]')) {
    console.log('✅ You appear to be logged in');
} else {
    console.log('❌ You might not be logged in');
}

console.log('============================');
console.log('💡 If no auth_token found, try:');
console.log('1. Make sure you are logged in to Twitter');
console.log('2. Refresh the page and try again');
console.log('3. Check if you have any ad blockers that might be blocking cookies');


