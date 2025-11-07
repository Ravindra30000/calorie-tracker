# Open Router Setup Guide

## Quick Start (5 minutes)

### Step 1: Get Your Free API Key

1. Visit **https://openrouter.ai/**
2. Click **"Sign Up"** (or log in if you have an account)
3. Go to **https://openrouter.ai/keys**
4. Click **"Create Key"**
5. Copy your key (it starts with `sk-or-v1-`)

### Step 2: Add to Environment Variables

Add this to your `.env.local` file:

```env
OPENROUTER_API_KEY=sk-or-v1-paste-your-key-here
```

### Step 3: Test It

1. Start your dev server: `npm run dev`
2. Go to Dashboard → Click **"Photo Meal"**
3. Upload a food image
4. Click **"Recognize Food"**

If it works, you're all set! 🎉

## Recommended Free Models

The app is configured to use these **FREE** models by default:

### For Image Recognition (Vision)
- **Default:** `llava-hf/llava-1.6-vicuna-13b-hf`
- **Alternative:** `llama-3.2-11b-vision-instruct`

### For Meal Suggestions (Text)
- **Default:** `meta-llama/llama-3.1-8b-instruct`
- **Alternative:** `mistralai/mistral-7b-instruct`

## How to Change Models

If you want to use different models, add to `.env.local`:

```env
# Use different vision model
OPENROUTER_VISION_MODEL=llama-3.2-11b-vision-instruct

# Use different text model
OPENROUTER_TEXT_MODEL=mistralai/mistral-7b-instruct
```

## Browse All Free Models

Visit **https://openrouter.ai/models** to see all available models:
- Filter by "Free" to see free options
- Check pricing for each model
- See model capabilities (vision, text, etc.)

## Cost

- **Free tier:** Open Router gives you free credits to start
- **After free tier:** Very cheap (~$0.0001-0.001 per request)
- **No credit card required** for free tier

## Troubleshooting

### "API key not configured" error
- Make sure you added `OPENROUTER_API_KEY` to `.env.local`
- Restart your dev server after adding the key
- Check the key starts with `sk-or-v1-`

### "Rate limit exceeded" error
- You've used your free credits
- Wait a few minutes and try again
- Or upgrade to paid tier (still very cheap)

### "Model not found" error
- The model name might be wrong
- Check https://openrouter.ai/models for correct names
- Try the default models listed above

### Image recognition not working
- Make sure you're using a vision-capable model
- Try `llava-hf/llava-1.6-vicuna-13b-hf` (default)
- Check the image format (JPG, PNG work best)

## Need Help?

- Open Router Docs: https://openrouter.ai/docs
- Model List: https://openrouter.ai/models
- Support: Check Open Router Discord or GitHub

