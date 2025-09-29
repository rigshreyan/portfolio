# Cloudflare Workers Deployment Guide

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain**: Add `shreyansengupta.com` to your Cloudflare account
3. **Wrangler CLI**: Already installed in this project

## Quick Deployment

To deploy your portfolio to Cloudflare Workers:

```bash
# Build and deploy in one command
npm run deploy

# Or step by step:
npm run build
npx wrangler deploy
```

## First Time Setup

1. **Login to Cloudflare** (if not already done):
   ```bash
   npx wrangler login
   ```

2. **Deploy the site**:
   ```bash
   npm run deploy
   ```

3. **Configure custom domain** (in Cloudflare Dashboard):
   - Go to Workers & Pages → shreyansengupta-portfolio
   - Click "Custom domains" → "Add custom domain"
   - Add `shreyansengupta.com` and `www.shreyansengupta.com`

## Configuration Details

- **Project name**: `shreyansengupta-portfolio`
- **Static assets**: Served from `./dist/` directory
- **Compatibility date**: `2025-04-01` (latest features)

## Available Commands

- `npm run deploy:preview` - Test deployment without publishing
- `npm run deploy` - Build and deploy to production
- `npm run dev` - Local development server
- `npm run build` - Build static site

## Domain Setup

Once deployed, configure DNS in Cloudflare:

1. Go to DNS settings for `shreyansengupta.com`
2. Add CNAME records:
   - `shreyansengupta.com` → `shreyansengupta-portfolio.your-subdomain.workers.dev`
   - `www` → `shreyansengupta-portfolio.your-subdomain.workers.dev`

The portfolio will be live at `https://shreyansengupta.com` with global CDN caching and optimized image delivery.

## Benefits

- **Global CDN**: Images and assets served from 200+ locations worldwide
- **Fast loading**: Optimized static site generation
- **Image optimization**: Automatic WebP conversion and responsive images
- **No server costs**: Runs on Cloudflare's free tier
- **HTTPS**: Automatic SSL certificate