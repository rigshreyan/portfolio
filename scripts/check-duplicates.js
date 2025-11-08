#!/usr/bin/env node

/**
 * Duplicate Image Detector for Gallery
 * Scans gallery.ts and reports duplicate image entries
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GALLERY_PATH = join(__dirname, '../src/data/gallery.ts');

console.log('🔍 Scanning gallery for duplicates...\n');

try {
  const content = readFileSync(GALLERY_PATH, 'utf-8');

  // Extract all gallery items with their hrefs and categories
  const hrefRegex = /"href":\s*"([^"]+)"/g;
  const categoryRegex = /"category":\s*"([^"]+)"/g;

  const hrefs = [];
  const categories = [];

  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    hrefs.push(match[1]);
  }

  while ((match = categoryRegex.exec(content)) !== null) {
    categories.push(match[1]);
  }

  // Build a map of href => [categories]
  const imageMap = new Map();
  for (let i = 0; i < hrefs.length; i++) {
    const href = hrefs[i];
    const category = categories[i];

    if (!imageMap.has(href)) {
      imageMap.set(href, []);
    }
    imageMap.get(href).push(category);
  }

  // Find duplicates
  const duplicates = [];
  for (const [href, cats] of imageMap.entries()) {
    if (cats.length > 1) {
      duplicates.push({ href, categories: cats });
    }
  }

  // Report results
  console.log(`📊 Total gallery entries: ${hrefs.length}`);
  console.log(`🖼️  Unique images: ${imageMap.size}`);
  console.log(`⚠️  Duplicate images: ${duplicates.length}\n`);

  if (duplicates.length > 0) {
    console.log('Duplicate Details:');
    console.log('─'.repeat(80));

    duplicates.slice(0, 20).forEach(({ href, categories }, index) => {
      const filename = href.split('/').pop();
      console.log(`${index + 1}. ${filename}`);
      console.log(`   Categories: ${categories.join(', ')}`);
      console.log(`   Appears ${categories.length} times`);
      console.log('');
    });

    if (duplicates.length > 20) {
      console.log(`... and ${duplicates.length - 20} more duplicates`);
    }

    // Category breakdown
    const allCategoryCount = categories.filter(c => c === 'all').length;
    console.log('─'.repeat(80));
    console.log(`\n📁 Category Breakdown:`);
    console.log(`   "all" category: ${allCategoryCount} entries`);
    console.log(`   Other categories: ${categories.length - allCategoryCount} entries`);

    if (allCategoryCount === duplicates.length) {
      console.log(`\n💡 All duplicates are in the "all" category.`);
      console.log(`   Consider removing "all" entries and updating filter logic.`);
    }
  } else {
    console.log('✅ No duplicates found! All images are unique.');
  }

} catch (error) {
  console.error('❌ Error reading gallery file:', error.message);
  process.exit(1);
}
