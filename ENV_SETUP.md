# Environment Variables Setup

## Required for Basic Features

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Your app URL (for Open Router headers)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Required for AI Features (FREE with Open Router)

For image recognition and meal suggestions, use **Open Router** (free tier available):

```env
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
```

### Getting Open Router API Key (FREE)

1. Go to https://openrouter.ai/
2. Sign up for a free account
3. Go to https://openrouter.ai/keys
4. Click "Create Key"
5. Copy the key (starts with `sk-or-v1-`)
6. Add it to `.env.local` as `OPENROUTER_API_KEY`

### Free Models Used

The app uses these **FREE** models by default:

- **Vision (Image Recognition):** `llava-hf/llava-1.6-vicuna-13b-hf`
  - Free tier available
  - Great for food image analysis
  
- **Text (Meal Suggestions):** `meta-llama/llama-3.1-8b-instruct`
  - Free tier available
  - Fast and accurate for text generation

### Optional: Customize Models (FREE ONLY)

You can override the default models in `.env.local`, but **only free models are allowed**:

```env
# Optional: Use different FREE models only
OPENROUTER_VISION_MODEL=llama-3.2-11b-vision-instruct
OPENROUTER_TEXT_MODEL=mistralai/mistral-7b-instruct
```

**⚠️ Important:** The code will automatically fall back to free models if you try to use a paid model.

### Available FREE Model Options

**Vision Models (Image Recognition):**
- `llava-hf/llava-1.6-vicuna-13b-hf` ← **Default** (best free option)
- `llama-3.2-11b-vision-instruct` (alternative)
- `qwen/qwen-2-vl-7b-instruct` (alternative)

**Text Models (Meal Suggestions):**
- `meta-llama/llama-3.1-8b-instruct` ← **Default** (best free option)
- `mistralai/mistral-7b-instruct` (alternative)
- `google/gemma-2-9b-it` (alternative)
- `microsoft/phi-3-mini-128k-instruct` (alternative)

**Note:** Only these models are allowed. The app will reject any paid models to ensure you never get charged.

### Cost

- **Free tier:** Open Router provides free credits for testing
- **After free tier:** Very cheap (~$0.0001-0.001 per request)
- **No credit card required** for free tier

### Troubleshooting

If you get rate limit errors:
1. Check your Open Router dashboard for usage limits
2. Try a different free model
3. Wait a few minutes and try again

If models don't work:
1. Check the model name is correct on https://openrouter.ai/models
2. Some models may be temporarily unavailable
3. Try the alternative models listed above
