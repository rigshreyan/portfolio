import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read gallery.ts and extract existing photo paths
const galleryPath = path.join(__dirname, '../src/data/gallery.ts');
const galleryContent = fs.readFileSync(galleryPath, 'utf-8');

// Extract all src paths from gallery.ts
const existingPhotos = new Set();
const srcMatches = galleryContent.matchAll(/src:\s*['"]([^'"]+)['"]/g);
for (const match of srcMatches) {
  existingPhotos.add(match[1]);
}

console.log(`Found ${existingPhotos.size} existing photos in gallery.ts\n`);

// Find all photos in gallery-source
const gallerySourcePath = path.join(__dirname, '../gallery-source');
const categories = ['abstract', 'architecture', 'bw', 'landscape', 'portrait', 'street'];

const newPhotos = [];

function findPhotosInCategory(category) {
  const categoryPath = path.join(gallerySourcePath, category);
  if (!fs.existsSync(categoryPath)) return;

  const files = fs.readdirSync(categoryPath);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const relativePath = `/gallery/${category}/${file}`;
      if (!existingPhotos.has(relativePath)) {
        newPhotos.push({
          category,
          file,
          path: relativePath
        });
      }
    }
  }
}

categories.forEach(findPhotosInCategory);

console.log(`Found ${newPhotos.length} NEW photos:\n`);
newPhotos.forEach(photo => {
  console.log(`  ${photo.category}: ${photo.file}`);
});

// Write the new photos list for reference
fs.writeFileSync(
  path.join(__dirname, 'new-photos.json'),
  JSON.stringify(newPhotos, null, 2)
);

console.log(`\nNew photos list saved to scripts/new-photos.json`);
