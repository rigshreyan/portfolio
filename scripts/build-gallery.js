import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import exifr from 'exifr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gallery directory path
const galleryDir = path.join(__dirname, '../public/gallery');
const outputFile = path.join(__dirname, '../src/data/gallery.ts');

// Supported image extensions
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

// Category mappings
const categories = [
  { folder: 'street', value: 'street', label: 'Street Photography' },
  { folder: 'landscape', value: 'landscape', label: 'Landscape' },
  { folder: 'architecture', value: 'architecture', label: 'Architecture' },
  { folder: 'portrait', value: 'portrait', label: 'Portrait' },
  { folder: 'abstract', value: 'abstract', label: 'Abstract' },
  { folder: 'bw', value: 'bw', label: 'B&W' }
];

// EXIF formatting functions
function formatCameraName(make, model) {
  if (!make && !model) return 'Unknown Camera';
  if (!make) return model || 'Unknown Camera';
  if (!model) return make || 'Unknown Camera';

  // Clean up duplicated brand names
  const cleanModel = model.replace(new RegExp(`^${make}\\s*`, 'i'), '');
  return `${make} ${cleanModel}`.trim();
}

function formatLensName(lens) {
  if (!lens) return 'Unknown Lens';
  return lens.toString();
}

function formatFocalLength(focalLength) {
  if (!focalLength) return 'Unknown';
  return `${Math.round(focalLength)}mm`;
}

function formatAperture(fNumber) {
  if (!fNumber) return 'Unknown';
  return `f/${fNumber}`;
}

function formatShutterSpeed(exposureTime) {
  if (!exposureTime) return 'Unknown';
  if (exposureTime >= 1) {
    return `${exposureTime}s`;
  } else {
    return `1/${Math.round(1 / exposureTime)}s`;
  }
}

function formatISO(iso) {
  if (!iso) return 'Unknown';
  return iso.toString();
}

function getDefaultMetadata() {
  return {
    camera: 'Unknown Camera',
    lens: 'Unknown Lens',
    focalLength: 'Unknown',
    aperture: 'Unknown',
    shutterSpeed: 'Unknown',
    iso: 'Unknown'
  };
}

async function buildGallery() {
  console.log('🔍 Scanning gallery folders...');

  const galleryItems = [];
  const photoTracker = new Map(); // Track photos across categories
  const metadataTracker = new Map(); // Track EXIF metadata
  let totalPhotos = 0;

  // First pass: collect all photos and their categories
  for (const category of categories) {
    const categoryPath = path.join(galleryDir, category.folder);

    if (fs.existsSync(categoryPath)) {
      const files = fs.readdirSync(categoryPath);
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      });

      console.log(`📁 ${category.label}: ${imageFiles.length} photos`);

      for (const file of imageFiles) {
        const fileName = path.parse(file).name;
        const filePath = path.join(categoryPath, file);

        if (!photoTracker.has(fileName)) {
          photoTracker.set(fileName, {
            file: file,
            categories: [],
            primaryFolder: category.folder,
            filePath: filePath
          });

          // Extract EXIF metadata from the image
          try {
            const exifData = await exifr.parse(filePath, {
              pick: ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO']
            });

            const metadata = {
              camera: formatCameraName(exifData?.Make, exifData?.Model),
              lens: formatLensName(exifData?.LensModel),
              focalLength: formatFocalLength(exifData?.FocalLength),
              aperture: formatAperture(exifData?.FNumber),
              shutterSpeed: formatShutterSpeed(exifData?.ExposureTime),
              iso: formatISO(exifData?.ISO)
            };

            metadataTracker.set(fileName, metadata);
            console.log(`📷 EXIF extracted for ${fileName}:`, metadata);
          } catch (error) {
            console.warn(`⚠️  Could not extract EXIF for ${fileName}:`, error.message);
            metadataTracker.set(fileName, getDefaultMetadata());
          }
        }

        photoTracker.get(fileName).categories.push(category.value);
      }

      totalPhotos += imageFiles.length;
    } else {
      console.log(`📁 ${category.label}: 0 photos (folder doesn't exist)`);
    }
  }

  // Second pass: create gallery items (unique photos plus category-specific entries)
  let uniquePhotos = 0;

  // First, create unique photo entries for "all" category
  const uniqueGalleryItems = [];
  const categoryGalleryItems = [];

  for (const [fileName, photoData] of photoTracker) {
    const cleanName = fileName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    // Create one unique entry for the "all" filter (using primary category)
    const primaryCategory = photoData.categories[0]; // Use first category as primary

    // Skip B&W copies (files with format "DSCxxxx-#") from the "all" category
    const isBWCopy = /^DSC\d+-\d+$/.test(fileName);

    if (!isBWCopy) {
      uniqueGalleryItems.push({
        label: cleanName,
        href: `/gallery/${photoData.primaryFolder}/${photoData.file}`,
        category: 'all',
        originalCategory: primaryCategory,
        metadata: metadataTracker.get(fileName)
      });
    }

    // Create category-specific entries for individual category filters
    photoData.categories.forEach(category => {
      categoryGalleryItems.push({
        label: cleanName,
        href: `/gallery/${photoData.primaryFolder}/${photoData.file}`,
        category: category,
        metadata: metadataTracker.get(fileName)
      });
    });

    uniquePhotos++;

    // Log multi-category photos
    if (photoData.categories.length > 1) {
      console.log(`🔄 "${fileName}" appears in: ${photoData.categories.join(', ')}`);
    }
  }

  // Combine unique photos first, then category-specific ones
  galleryItems.push(...uniqueGalleryItems);
  galleryItems.push(...categoryGalleryItems);

  console.log(`\n📸 Total photo files: ${totalPhotos}`);
  console.log(`📸 Unique photos: ${uniquePhotos}`);

  // Generate the TypeScript file content
  const tsContent = `export interface GalleryItem {
  label: string;
  href: string;
  category?: string;
}

// This file is auto-generated by scripts/build-gallery.js
// Run: npm run build:gallery to regenerate
export const galleryItems: GalleryItem[] = ${JSON.stringify(galleryItems, null, 2)};

export const categories = [
  { value: "all", label: "All" },
  { value: "street", label: "Street Photography" },
  { value: "landscape", label: "Landscape" },
  { value: "architecture", label: "Architecture" },
  { value: "portrait", label: "Portrait" },
  { value: "abstract", label: "Abstract" },
  { value: "bw", label: "B&W" }
];
`;

  // Write the file
  fs.writeFileSync(outputFile, tsContent, 'utf8');
  console.log(`\n✅ Gallery data updated: ${outputFile}`);
  console.log('🚀 Your portfolio is ready!');
}

// Run the script
buildGallery();