"""
Quick setup script for Groq (free, fast, smart AI).

This script helps you configure Groq as your LLM provider.
Groq is 100% free and gives you access to Llama 3.3 70B (very smart!).
"""

import os
from pathlib import Path

print("=" * 80)
print("GROQ SETUP - FREE AI MODEL")
print("=" * 80)
print()
print("Groq gives you FREE access to:")
print("  • Llama 3.3 70B (smarter than GPT-3.5)")
print("  • 30 requests/minute")
print("  • Unlimited usage")
print("  • Fastest inference in the world")
print()
print("=" * 80)
print()

# Step 1: Get API key
print("STEP 1: Get Your Free API Key")
print("-" * 80)
print("1. Open: https://console.groq.com/keys")
print("2. Sign up (free, no credit card required)")
print("3. Click 'Create API Key'")
print("4. Copy the key (starts with 'gsk_')")
print()

api_key = input("Paste your Groq API key here: ").strip()

if not api_key:
    print("\n❌ No API key provided. Exiting.")
    exit(1)

if not api_key.startswith("gsk_"):
    print("\n⚠️  Warning: Groq API keys usually start with 'gsk_'")
    print("   Make sure you copied the correct key.")
    confirm = input("   Continue anyway? (y/n): ").strip().lower()
    if confirm != 'y':
        exit(1)

# Step 2: Choose model
print("\n" + "=" * 80)
print("STEP 2: Choose Your Model")
print("-" * 80)
print("1. llama-3.3-70b-versatile  (RECOMMENDED - Best intelligence)")
print("2. llama-3.1-8b-instant     (Fastest)")
print("3. mixtral-8x7b-32768       (Good reasoning)")
print()

choice = input("Enter choice (1-3) [default: 1]: ").strip() or "1"

models = {
    "1": "llama-3.3-70b-versatile",
    "2": "llama-3.1-8b-instant",
    "3": "mixtral-8x7b-32768",
}

model = models.get(choice, "llama-3.3-70b-versatile")

# Step 3: Update .env
print("\n" + "=" * 80)
print("STEP 3: Updating .env File")
print("-" * 80)

env_path = Path(".env")

if not env_path.exists():
    print("❌ .env file not found!")
    exit(1)

# Read current .env
with open(env_path, 'r') as f:
    lines = f.readlines()

# Update the relevant lines
new_lines = []
updated_base_url = False
updated_api_key = False
updated_model = False

for line in lines:
    if line.startswith("OPENCODE_BASE_URL="):
        new_lines.append(f"OPENCODE_BASE_URL=https://api.groq.com/openai/v1\n")
        updated_base_url = True
    elif line.startswith("OPENCODE_API_KEY="):
        new_lines.append(f"OPENCODE_API_KEY={api_key}\n")
        updated_api_key = True
    elif line.startswith("LLM_MODEL="):
        new_lines.append(f"LLM_MODEL={model}\n")
        updated_model = True
    else:
        new_lines.append(line)

# Add lines if they didn't exist
if not updated_base_url:
    new_lines.insert(1, f"OPENCODE_BASE_URL=https://api.groq.com/openai/v1\n")
if not updated_api_key:
    new_lines.insert(1, f"OPENCODE_API_KEY={api_key}\n")
if not updated_model:
    new_lines.insert(1, f"LLM_MODEL={model}\n")

# Write back
with open(env_path, 'w') as f:
    f.writelines(new_lines)

print("✅ .env file updated successfully!")
print()
print("Configuration:")
print(f"  • Base URL: https://api.groq.com/openai/v1")
print(f"  • Model: {model}")
print(f"  • API Key: {api_key[:10]}...{api_key[-4:]}")

# Step 4: Test connection
print("\n" + "=" * 80)
print("STEP 4: Testing Connection")
print("-" * 80)

try:
    from langchain_openai import ChatOpenAI
    from langchain_core.messages import HumanMessage
    
    print("Sending test request to Groq...")
    
    llm = ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1",
        temperature=0.1,
        max_tokens=100,
    )
    
    response = llm.invoke([HumanMessage(content="Say 'Hello! Groq is working!' and nothing else.")])
    
    print(f"\n✅ SUCCESS! Groq responded:")
    print(f"   {response.content}")
    print()
    
except Exception as e:
    print(f"\n❌ Error testing connection: {e}")
    print("\nPossible issues:")
    print("  • Invalid API key")
    print("  • No internet connection")
    print("  • Groq service temporarily down")
    print("\nYou can still try running the backend - it might work!")
    print()

# Step 5: Instructions
print("=" * 80)
print("SETUP COMPLETE!")
print("=" * 80)
print()
print("Next steps:")
print("1. Restart your backend:")
print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
print()
print("2. Test with a question:")
print("   'Summarize Tesla's Q3 2025 report'")
print()
print("3. Check the '💭 Thought' dropdown to see the improved reasoning")
print()
print("You're now using Groq's Llama 3.3 70B - much smarter than Big Pickle!")
print("And it's 100% FREE! 🎉")
print()
print("=" * 80)
