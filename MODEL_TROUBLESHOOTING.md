# Model Troubleshooting Guide

## Issue: "Model ID is not valid"

If you get an error that a model ID is not valid, here's how to fix it:

### Step 1: Check Available Models

Visit **https://openrouter.ai/models** to see all available models:
1. Filter by "Free" to see free options
2. Look for models with "vision" capability for image recognition
3. Copy the exact model ID (case-sensitive)

### Step 2: Update Model in Code

The model IDs in the code might be outdated. Open Router model names can change.

**Current free vision models (as of 2025):**
- `qwen/qwen-2-vl-7b-instruct` ← Most reliable free option
- `llava-hf/llava-v1.6-vicuna-13b-hf` (note: `v1.6` not `1.6`)
- `meta-llama/llama-3.2-11b-vision-instruct`

**Current free text models:**
- `meta-llama/llama-3.1-8b-instruct` ← Most reliable free option
- `mistralai/mistral-7b-instruct`
- `google/gemma-2-9b-it`
- `microsoft/phi-3-mini-128k-instruct`

### Step 3: Override in Environment Variables

You can override the model in `.env.local`:

```env
# Use a different free model
OPENROUTER_VISION_MODEL=qwen/qwen-2-vl-7b-instruct
OPENROUTER_TEXT_MODEL=meta-llama/llama-3.1-8b-instruct
```

### Step 4: Test the Model

1. Check the model page on Open Router
2. Verify it's marked as "Free"
3. Test with a simple request
4. Check server logs for model name being used

### Common Issues

**"Model not found"**
- Model ID might be wrong (check spelling, case, slashes)
- Model might have been removed from Open Router
- Try a different free model from the list

**"Rate limit exceeded"**
- You've used your free credits
- Wait a few minutes and try again
- Or try a different free model

**"Model not available"**
- Some models are temporarily unavailable
- Try an alternative from the free list
- Check Open Router status page

### Finding the Correct Model ID

1. Go to https://openrouter.ai/models
2. Search for "vision" or "llava" or "qwen"
3. Filter by "Free"
4. Click on a model to see its exact ID
5. Copy the ID exactly (including slashes and version numbers)

### Quick Fix

If you're getting model errors, try this in `.env.local`:

```env
# Most reliable free models
OPENROUTER_VISION_MODEL=qwen/qwen-2-vl-7b-instruct
OPENROUTER_TEXT_MODEL=meta-llama/llama-3.1-8b-instruct
```

These are the most stable free models on Open Router.

