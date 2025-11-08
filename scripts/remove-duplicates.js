#!/usr/bin/env node

/**
 * Remove Duplicate Entries from Gallery
 * Removes all entries where category === "all" and originalCategory exists
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GALLERY_PATH = join(__dirname, '../src/data/gallery.ts');
const BACKUP_PATH = join(__dirname, '../src/data/gallery.ts.backup');

console.log('🔍 Reading gallery file...\n');

try {
  const content = readFileSync(GALLERY_PATH, 'utf-8');

  // Create backup
  writeFileSync(BACKUP_PATH, content);
  console.log(`✅ Backup created at: ${BACKUP_PATH}\n`);

  // Parse the galleryItems array
  const galleryItemsMatch = content.match(/export const galleryItems: GalleryItem\[\] = (\[[\s\S]*?\]);/);
  if (!galleryItemsMatch) {
    throw new Error('Could not find galleryItems array in file');
  }

  const arrayContent = galleryItemsMatch[1];

  // Split into individual items (simple approach - look for },\n  {)
  const items = [];
  let currentItem = '';
  let braceCount = 0;
  let inItem = false;

  for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i];

    if (char === '{') {
      braceCount++;
      inItem = true;
    }

    if (inItem) {
      currentItem += char;
    }

    if (char === '}') {
      braceCount--;
      if (braceCount === 0 && inItem) {
        items.push(currentItem.trim());
        currentItem = '';
        inItem = false;
      }
    }
  }

  console.log(`📊 Found ${items.length} total items`);

  // Filter out items where category === "all"
  const filteredItems = items.filter(item => {
    const categoryMatch = item.match(/"category":\s*"([^"]+)"/);
    if (categoryMatch && categoryMatch[1] === 'all') {
      return false; // Remove this item
    }
    return true; // Keep this item
  });

  const removedCount = items.length - filteredItems.length;
  console.log(`❌ Removing ${removedCount} duplicate entries (category="all")`);
  console.log(`✅ Keeping ${filteredItems.length} unique entries\n`);

  // Reconstruct the file
  const newArrayContent = '[\n  ' + filteredItems.join(',\n  ') + '\n]';
  const newContent = content.replace(
    /export const galleryItems: GalleryItem\[\] = \[[\s\S]*?\];/,
    `export const galleryItems: GalleryItem[] = ${newArrayContent};`
  );

  // Write the new file
  writeFileSync(GALLERY_PATH, newContent);
  console.log('✅ Successfully updated gallery.ts');
  console.log(`\n📝 Summary:`);
  console.log(`   - Original: ${items.length} entries`);
  console.log(`   - Removed: ${removedCount} duplicates`);
  console.log(`   - Final: ${filteredItems.length} unique entries`);
  console.log(`\n💾 Backup saved at: gallery.ts.backup`);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n🔄 Restoring from backup...');

  try {
    const backup = readFileSync(BACKUP_PATH, 'utf-8');
    writeFileSync(GALLERY_PATH, backup);
    console.log('✅ Restored from backup');
  } catch (restoreError) {
    console.error('❌ Could not restore from backup:', restoreError.message);
  }

  process.exit(1);
}
