#!/usr/bin/env python3
"""
CashCore Batch Verification Script
Runs periodic verification of all pending accounts
"""

import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta
from bio_verifier import BioVerifier

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('verification.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class BatchVerifier:
    def __init__(self):
        self.verifier = BioVerifier()
        self.batch_size = int(os.getenv('BATCH_SIZE', '10'))
        self.verification_interval = int(os.getenv('VERIFICATION_INTERVAL_MINUTES', '60'))
        
    async def run_single_batch(self):
        """
        Run a single batch verification
        """
        logger.info("Starting batch verification...")
        
        try:
            results = await self.verifier.batch_verify_pending_accounts(self.batch_size)
            
            if not results:
                logger.info("No accounts need verification")
                return
            
            total_processed = len(results)
            total_verified = 0
            
            for discord_id, account_results in results.items():
                user_verified_count = sum(1 for result in account_results if result.verified)
                total_verified += user_verified_count
                
                logger.info(f"Discord user {discord_id}: {user_verified_count}/{len(account_results)} accounts verified")
                
                for result in account_results:
                    status = "VERIFIED" if result.verified else "NOT VERIFIED"
                    logger.info(f"  {result.platform}/{result.username}: {status}")
                    if result.code_found:
                        logger.info(f"    Code found: {result.code_found}")
                    if result.error:
                        logger.info(f"    Error: {result.error}")
            
            logger.info(f"Batch verification completed: {total_verified} accounts verified across {total_processed} Discord users")
            
        except Exception as e:
            logger.error(f"Error in batch verification: {str(e)}")
    
    async def run_continuous(self):
        """
        Run continuous verification with intervals
        """
        logger.info(f"Starting continuous verification (every {self.verification_interval} minutes)")
        
        while True:
            try:
                await self.run_single_batch()
                
                logger.info(f"Waiting {self.verification_interval} minutes until next verification...")
                await asyncio.sleep(self.verification_interval * 60)
                
            except KeyboardInterrupt:
                logger.info("Verification stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in continuous verification: {str(e)}")
                logger.info("Waiting 5 minutes before retry...")
                await asyncio.sleep(300)  # Wait 5 minutes before retry

async def main():
    """
    Main function - can run single batch or continuous verification
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='CashCore Batch Verification System')
    parser.add_argument('--continuous', action='store_true', help='Run continuous verification')
    parser.add_argument('--batch-size', type=int, default=10, help='Number of accounts to verify per batch')
    parser.add_argument('--interval', type=int, default=60, help='Verification interval in minutes (for continuous mode)')
    
    args = parser.parse_args()
    
    # Set environment variables
    os.environ['BATCH_SIZE'] = str(args.batch_size)
    os.environ['VERIFICATION_INTERVAL_MINUTES'] = str(args.interval)
    
    batch_verifier = BatchVerifier()
    
    if args.continuous:
        await batch_verifier.run_continuous()
    else:
        await batch_verifier.run_single_batch()

if __name__ == "__main__":
    asyncio.run(main())


