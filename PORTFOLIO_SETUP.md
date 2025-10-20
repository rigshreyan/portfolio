# Portfolio Setup Guide

This guide will help you customize your Shreyan Sengupta portfolio website.

## Adding Portfolio Images

1. **Add your images** to the `public/gallery/` directory
2. **Update the gallery configuration** in `src/data/gallery.ts`:

```typescript
export const galleryItems: GalleryItem[] = [
  {
    label: "Your Project Name",
    href: "/gallery/your-image.jpg", // or .png
    category: "web" // web, design, mobile, etc.
  },
  // Add more projects...
];
```

## Updating Personal Information

Edit `src/consts.ts` to update:

- **Name and title**
- **Social media links** (GitHub, LinkedIn, Email)
- **Contact information**
- **About section** description

## Replacing Avatar Image

Replace `public/avatar.png` with your own profile picture (recommended: 600x600px)

## Customizing Categories

Add or modify categories in `src/data/gallery.ts`:

```typescript
export const categories = [
  { value: "all", label: "All" },
  { value: "web", label: "Web Development" },
  { value: "design", label: "Design" },
  { value: "mobile", label: "Mobile Apps" },
  // Add your categories...
];
```

## Building and Deploying

1. **Build the site**: `npm run build`
2. **Deploy to Cloudflare Workers**: `npx wrangler deploy`

## Development

- **Start dev server**: `npm run dev`
- **Check types**: `npm run prebuild`

The portfolio is optimized for Cloudflare Workers deployment with fast image loading and a clean, minimalist design.