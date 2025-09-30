#!/usr/bin/env python3
"""
CashCore Verification Setup Script
Installs dependencies and sets up the verification system
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required Python packages"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def setup_environment():
    """Setup environment file"""
    print("🔧 Setting up environment configuration...")
    
    env_content = """# Supabase Configuration
SUPABASE_URL=https://whcwkuufssjoiktkpeen.supabase.co
SUPABASE_SERVICE_KEY=your_service_key_here

# YouTube API (optional - for future use)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Rate limiting settings
VERIFICATION_DELAY_SECONDS=1
MAX_CONCURRENT_REQUESTS=5
BATCH_SIZE=10
VERIFICATION_INTERVAL_MINUTES=60
"""
    
    if not os.path.exists('.env'):
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ Created .env file - please update with your Supabase service key!")
    else:
        print("⚠️ .env file already exists - skipping creation")

def test_verification():
    """Test the verification system"""
    print("🧪 Testing verification system...")
    
    try:
        # Test with a sample Instagram account
        import asyncio
        from bio_verifier import BioVerifier
        
        async def test():
            verifier = BioVerifier()
            # Test with a public Instagram account (you can change this)
            result = await verifier.verify_account('instagram', 'instagram')
            
            print(f"Test result: {result.verified}")
            if result.bio_text:
                print(f"Bio text length: {len(result.bio_text)} characters")
            if result.error:
                print(f"Error: {result.error}")
        
        asyncio.run(test())
        print("✅ Verification system test completed!")
        
    except Exception as e:
        print(f"⚠️ Verification test failed: {e}")
        print("This is normal if you haven't set up your Supabase service key yet.")

def main():
    """Main setup function"""
    print("🚀 CashCore Verification System Setup")
    print("=" * 40)
    
    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required!")
        sys.exit(1)
    
    print(f"✅ Python {sys.version.split()[0]} detected")
    
    # Install dependencies
    if not install_requirements():
        sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Test verification
    test_verification()
    
    print("\n🎉 Setup completed!")
    print("\nNext steps:")
    print("1. Update your .env file with your Supabase service key")
    print("2. Run the database migration: add_verification_columns.sql")
    print("3. Test verification: python bio_verifier.py --platform instagram --username instagram")
    print("4. Run batch verification: python batch_verifier.py")
    print("5. For continuous verification: python batch_verifier.py --continuous")

if __name__ == "__main__":
    main()


