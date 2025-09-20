#!/usr/bin/env python3
"""
CashCore Bio Verification System
Verifies user account ownership by checking for verification codes in social media bios
"""

import asyncio
import aiohttp
import re
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os
from dataclasses import dataclass
from supabase import create_client, Client
import logging
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class VerificationResult:
    platform: str
    username: str
    verified: bool
    code_found: Optional[str] = None
    bio_text: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime = None

class BioVerifier:
    def __init__(self):
        # Initialize Supabase client
        self.supabase_url = os.getenv('SUPABASE_URL', 'https://whcwkuufssjoiktkpeen.supabase.co')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_KEY', '')
        if self.supabase_key:
            self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        else:
            logger.warning("No Supabase service key provided")
            self.supabase = None
        
        # Initialize YouTube API
        self.youtube_api_key = os.getenv('YOUTUBE_API_KEY', 'AIzaSyCGCarM_ZaZXsWoIU0QLcpljZehLFoV_Es')
        if self.youtube_api_key:
            try:
                self.youtube_service = build('youtube', 'v3', developerKey=self.youtube_api_key)
                logger.info("YouTube API initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize YouTube API: {e}")
                self.youtube_service = None
        else:
            logger.warning("No YouTube API key provided")
            self.youtube_service = None
        
        # User agents for web scraping (for Instagram/TikTok)
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ]
        
        # Verification code pattern
        self.verification_pattern = re.compile(r'cashcore\d{6}', re.IGNORECASE)

    async def verify_account(self, platform: str, username: str, expected_code: str = None, discord_id: str = None) -> VerificationResult:
        """
        Verify a single account by checking its bio for verification code
        """
        try:
            # If no expected code provided, try to get it from database
            if not expected_code and discord_id and self.supabase:
                try:
                    db_result = self.supabase.table('user_accounts').select('verification_code').eq('discord_id', discord_id).eq('platform', platform).eq('username', username).single().execute()
                    if db_result.data and db_result.data.get('verification_code'):
                        expected_code = db_result.data['verification_code']
                        logger.info(f"Retrieved verification code from database: {expected_code}")
                except Exception as e:
                    logger.warning(f"Could not retrieve verification code from database: {e}")
            
            bio_text = await self._get_bio_text(platform, username)
            
            if bio_text is None:
                return VerificationResult(
                    platform=platform,
                    username=username,
                    verified=False,
                    error="Could not fetch bio"
                )
            
            # Look for any cashcore verification code
            codes_found = self.verification_pattern.findall(bio_text)
            
            result = VerificationResult(
                platform=platform,
                username=username,
                bio_text=bio_text,
                timestamp=datetime.now()
            )
            
            if codes_found:
                result.verified = True
                result.code_found = codes_found[0]
                
                # If specific code was expected, check if it matches
                if expected_code and expected_code.lower() not in [code.lower() for code in codes_found]:
                    result.verified = False
                    result.error = f"Expected code {expected_code} not found, found: {', '.join(codes_found)}"
            else:
                result.verified = False
                result.error = "No verification code found in bio"
            
            return result
            
        except Exception as e:
            logger.error(f"Error verifying {platform}/{username}: {str(e)}")
            return VerificationResult(
                platform=platform,
                username=username,
                verified=False,
                error=str(e)
            )

    async def _get_bio_text(self, platform: str, username: str) -> Optional[str]:
        """
        Get bio text from different platforms
        """
        platform = platform.lower()
        
        if platform == 'instagram':
            return await self._get_instagram_bio(username)
        elif platform == 'tiktok':
            return await self._get_tiktok_bio(username)
        elif platform == 'youtube':
            return await self._get_youtube_bio(username)
        else:
            logger.error(f"Unsupported platform: {platform}")
            return None

    async def _get_instagram_bio(self, username: str) -> Optional[str]:
        """
        Scrape Instagram bio using web scraping
        """
        try:
            url = f"https://www.instagram.com/{username}/"
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    'User-Agent': self.user_agents[0],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
                
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        html = await response.text()
                        
                        # Extract bio from Instagram page
                        # Instagram stores bio in a JSON script tag
                        bio_match = re.search(r'"biography":"([^"]*)"', html)
                        if bio_match:
                            bio_text = bio_match.group(1)
                            # Decode escaped characters
                            bio_text = bio_text.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                            return bio_text
                        else:
                            logger.warning(f"Could not extract bio from Instagram page for {username}")
                            return None
                    else:
                        logger.warning(f"Instagram returned status {response.status} for {username}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error scraping Instagram bio for {username}: {str(e)}")
            return None

    async def _get_tiktok_bio(self, username: str) -> Optional[str]:
        """
        Scrape TikTok bio using web scraping
        """
        try:
            url = f"https://www.tiktok.com/@{username}"
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    'User-Agent': self.user_agents[0],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
                
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        html = await response.text()
                        
                        # Extract bio from TikTok page
                        # TikTok stores user data in a JSON script tag
                        bio_match = re.search(r'"signature":"([^"]*)"', html)
                        if bio_match:
                            bio_text = bio_match.group(1)
                            # Decode escaped characters
                            bio_text = bio_text.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                            return bio_text
                        else:
                            logger.warning(f"Could not extract bio from TikTok page for {username}")
                            return None
                    else:
                        logger.warning(f"TikTok returned status {response.status} for {username}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error scraping TikTok bio for {username}: {str(e)}")
            return None

    async def _get_youtube_bio(self, username: str) -> Optional[str]:
        """
        Get YouTube channel bio using YouTube Data API
        """
        try:
            if not self.youtube_service:
                logger.warning("YouTube API service not initialized, falling back to web scraping")
                return await self._get_youtube_bio_scraping(username)
            
            # First, try to get channel by username (handle)
            try:
                # Search for channel by username
                search_response = self.youtube_service.search().list(
                    part='snippet',
                    q=username,
                    type='channel',
                    maxResults=1
                ).execute()
                
                if not search_response.get('items'):
                    logger.warning(f"No YouTube channel found for username: {username}")
                    return None
                
                channel_id = search_response['items'][0]['snippet']['channelId']
                
            except HttpError as e:
                logger.error(f"YouTube API error searching for channel {username}: {e}")
                return None
            
            # Get channel details
            try:
                channel_response = self.youtube_service.channels().list(
                    part='snippet,statistics',
                    id=channel_id
                ).execute()
                
                if not channel_response.get('items'):
                    logger.warning(f"No YouTube channel details found for ID: {channel_id}")
                    return None
                
                channel_info = channel_response['items'][0]
                bio_text = channel_info['snippet'].get('description', '')
                
                if bio_text:
                    logger.info(f"Successfully retrieved YouTube bio for {username} (length: {len(bio_text)})")
                    return bio_text
                else:
                    logger.info(f"YouTube channel {username} has no bio/description")
                    return ""
                    
            except HttpError as e:
                logger.error(f"YouTube API error getting channel details for {username}: {e}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting YouTube bio for {username}: {str(e)}")
            return None

    async def _get_youtube_bio_scraping(self, username: str) -> Optional[str]:
        """
        Fallback method: Get YouTube channel bio using web scraping
        """
        try:
            url = f"https://www.youtube.com/@{username}/about"
            
            async with aiohttp.ClientSession() as session:
                headers = {
                    'User-Agent': self.user_agents[0],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
                
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        html = await response.text()
                        
                        # Extract description from YouTube channel about page
                        # YouTube stores channel data in JSON-LD
                        desc_match = re.search(r'"description":"([^"]*)"', html)
                        if desc_match:
                            bio_text = desc_match.group(1)
                            # Decode escaped characters
                            bio_text = bio_text.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                            return bio_text
                        else:
                            logger.warning(f"Could not extract bio from YouTube page for {username}")
                            return None
                    else:
                        logger.warning(f"YouTube returned status {response.status} for {username}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error scraping YouTube bio for {username}: {str(e)}")
            return None

    async def verify_user_accounts(self, discord_id: str) -> Dict[str, List[VerificationResult]]:
        """
        Verify all accounts for a specific Discord user
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return {}
        
        try:
            # Get user's linked accounts
            result = self.supabase.table('user_accounts').select('*').eq('discord_id', discord_id).execute()
            
            if not result.data:
                logger.info(f"No linked accounts found for Discord user {discord_id}")
                return {}
            
            verification_results = {}
            
            for account in result.data:
                platform = account['platform']
                username = account['username']
                
                logger.info(f"Verifying {platform}/{username} for Discord user {discord_id}")
                
                verification_result = await self.verify_account(platform, username)
                
                if platform not in verification_results:
                    verification_results[platform] = []
                
                verification_results[platform].append(verification_result)
                
                # Update verification status in database
                await self._update_verification_status(account['id'], verification_result)
            
            return verification_results
            
        except Exception as e:
            logger.error(f"Error verifying accounts for Discord user {discord_id}: {str(e)}")
            return {}

    async def _update_verification_status(self, account_id: str, result: VerificationResult):
        """
        Update verification status in the database
        """
        if not self.supabase:
            return
        
        try:
            update_data = {
                'verified': result.verified,
                'verification_code_found': result.code_found,
                'last_verification_attempt': result.timestamp.isoformat(),
                'verification_error': result.error
            }
            
            self.supabase.table('user_accounts').update(update_data).eq('id', account_id).execute()
            logger.info(f"Updated verification status for account {account_id}")
            
        except Exception as e:
            logger.error(f"Error updating verification status: {str(e)}")

    async def batch_verify_pending_accounts(self, limit: int = 10) -> Dict[str, List[VerificationResult]]:
        """
        Verify all accounts that haven't been verified recently
        """
        if not self.supabase:
            logger.error("Supabase client not initialized")
            return {}
        
        try:
            # Get accounts that need verification (never verified or verified more than 24 hours ago)
            cutoff_time = (datetime.now() - timedelta(hours=24)).isoformat()
            
            result = self.supabase.table('user_accounts').select('*').or_(
                f'last_verification_attempt.is.null,last_verification_attempt.lt.{cutoff_time}'
            ).limit(limit).execute()
            
            if not result.data:
                logger.info("No accounts need verification")
                return {}
            
            all_results = {}
            
            for account in result.data:
                discord_id = account['discord_id']
                platform = account['platform']
                username = account['username']
                
                logger.info(f"Batch verifying {platform}/{username} for Discord user {discord_id}")
                
                verification_result = await self.verify_account(platform, username)
                
                if discord_id not in all_results:
                    all_results[discord_id] = []
                
                all_results[discord_id].append(verification_result)
                
                # Update verification status
                await self._update_verification_status(account['id'], verification_result)
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(1)
            
            return all_results
            
        except Exception as e:
            logger.error(f"Error in batch verification: {str(e)}")
            return {}

# CLI interface
async def main():
    """
    Command line interface for bio verification
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='CashCore Bio Verification System')
    parser.add_argument('--discord-id', help='Discord user ID (for retrieving stored verification codes or batch verification)')
    parser.add_argument('--platform', help='Platform to verify (instagram, tiktok, youtube)')
    parser.add_argument('--username', help='Username to verify')
    parser.add_argument('--batch', action='store_true', help='Run batch verification for pending accounts')
    parser.add_argument('--limit', type=int, default=10, help='Limit for batch verification')
    
    args = parser.parse_args()
    
    verifier = BioVerifier()
    
    if args.discord_id:
        # Verify all accounts for a Discord user
        results = await verifier.verify_user_accounts(args.discord_id)
        
        print(f"\nVerification results for Discord user {args.discord_id}:")
        for platform, platform_results in results.items():
            print(f"\n{platform.upper()}:")
            for result in platform_results:
                status = "✅ VERIFIED" if result.verified else "❌ NOT VERIFIED"
                print(f"  {result.username}: {status}")
                if result.code_found:
                    print(f"    Code found: {result.code_found}")
                if result.error:
                    print(f"    Error: {result.error}")
    
    elif args.platform and args.username:
        # Verify single account
        result = await verifier.verify_account(args.platform, args.username, discord_id=args.discord_id)
        
        print(f"\nVerification result for {args.platform}/{args.username}:")
        status = "✅ VERIFIED" if result.verified else "❌ NOT VERIFIED"
        print(f"Status: {status}")
        if result.code_found:
            print(f"Code found: {result.code_found}")
        if result.bio_text:
            print(f"Bio: {result.bio_text[:200]}...")
        if result.error:
            print(f"Error: {result.error}")
    
    elif args.batch:
        # Batch verify pending accounts
        print("Running batch verification...")
        results = await verifier.batch_verify_pending_accounts(args.limit)
        
        print(f"\nBatch verification completed. Processed {len(results)} Discord users:")
        for discord_id, user_results in results.items():
            print(f"\nDiscord user {discord_id}:")
            for result in user_results:
                status = "✅ VERIFIED" if result.verified else "❌ NOT VERIFIED"
                print(f"  {result.platform}/{result.username}: {status}")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    asyncio.run(main())
