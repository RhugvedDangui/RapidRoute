"""
Quick script to test different models and compare their responses.
This helps you decide which model to use.
"""

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# Your OpenCode Zen API key
API_KEY = "sk-NJNksDMY8A99fPOTr7JrKWgxPJSLENWTMGFTGeIkIMwm3HnOljpdcs48Wm50Y0O0"
BASE_URL = "https://opencode.ai/zen/v1"

# Test prompt
SYSTEM = "You are a helpful AI assistant. Explain your reasoning step by step."
USER_QUERY = "If I have 3 apples and buy 2 more, then give 1 to my friend, how many do I have? Think through this carefully."

# Models to test
MODELS = [
    ("big-pickle", "Big Pickle (Current)"),
    ("gemini-2.0-flash-exp", "Gemini 2.0 Flash"),
    ("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet"),
    ("gpt-4o", "GPT-4o"),
    ("deepseek-r1", "DeepSeek R1"),
]

print("=" * 80)
print("MODEL COMPARISON TEST")
print("=" * 80)
print(f"\nQuestion: {USER_QUERY}\n")

for model_id, model_name in MODELS:
    print("=" * 80)
    print(f"Testing: {model_name} ({model_id})")
    print("=" * 80)
    
    try:
        llm = ChatOpenAI(
            model=model_id,
            api_key=API_KEY,
            base_url=BASE_URL,
            temperature=0.1,
            max_tokens=500,
            timeout=30,
        )
        
        messages = [
            SystemMessage(content=SYSTEM),
            HumanMessage(content=USER_QUERY),
        ]
        
        response = llm.invoke(messages)
        print(f"\n{response.content}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        if "not found" in str(e).lower() or "does not exist" in str(e).lower():
            print(f"   Model '{model_id}' might not be available on OpenCode Zen")
        print()

print("=" * 80)
print("COMPARISON COMPLETE")
print("=" * 80)
print("\nRecommendation:")
print("- For best intelligence: Use the model with the most detailed reasoning")
print("- For speed: Use the model that responded fastest")
print("- For cost: Big Pickle is cheapest, but may not be smartest")
print("\nTo change model, edit .env and set: LLM_MODEL=<model-id>")
