import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import exifr from 'exifr';
import sharp from 'sharp';

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

// Function to generate clean photo labels from filenames
function generatePhotoLabel(fileName) {
  return fileName
    .replace(/#\w+/g, '')           // Remove category tags like #street #bw
    .replace(/[-_]/g, ' ')          // Replace hyphens and underscores with spaces
    .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
    .replace(/^\w/, c => c.toUpperCase()) // Capitalize first letter
    .trim() || 'Untitled';          // Fallback to 'Untitled' if empty
}

// Function to determine photo orientation and aspect ratio
function getPhotoOrientation(width, height) {
  const aspectRatio = width / height;
  const aspectRatioString = `${width}:${height}`;

  if (Math.abs(aspectRatio - 1) < 0.1) {
    return { orientation: 'square', aspectRatio: aspectRatioString };
  } else if (aspectRatio > 1.2) {
    return { orientation: 'landscape', aspectRatio: aspectRatioString };
  } else {
    return { orientation: 'portrait', aspectRatio: aspectRatioString };
  }
}

async function optimizeImage(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Calculate dimensions to fit within 1500x1000 while maintaining aspect ratio
    let { width, height } = metadata;
    const maxWidth = 1500;
    const maxHeight = 1000;

    // Get orientation before resizing
    const orientationData = getPhotoOrientation(width, height);

    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);

      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true,
        mozjpeg: true // Use mozjpeg for better compression
      })
      .toFile(outputPath);

    return { width, height, optimized: true, ...orientationData };
  } catch (error) {
    console.warn(`⚠️  Could not optimize image ${inputPath}:`, error.message);
    return { optimized: false };
  }
}

async function generateThumbnail(inputPath, outputPath) {
  try {
    const image = sharp(inputPath);

    // Generate super-fast loading thumbnail (400x300 max)
    await image
      .resize(400, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 70,
        progressive: true,
        mozjpeg: true
      })
      .toFile(outputPath);

    return { optimized: true };
  } catch (error) {
    console.warn(`⚠️  Could not generate thumbnail ${inputPath}:`, error.message);
    return { optimized: false };
  }
}

async function buildGallery() {
  console.log('🔍 Scanning gallery folders for photos with #category naming...');

  const galleryItems = [];
  const photoTracker = new Map(); // Track photos with their categories from filename
  const metadataTracker = new Map(); // Track EXIF metadata
  let totalPhotos = 0;

  // Function to extract categories from filename
  function extractCategoriesFromFilename(fileName) {
    const categoryMatches = fileName.match(/#(\w+)/g);
    if (categoryMatches) {
      return categoryMatches.map(match => match.substring(1)); // Remove the # symbol
    }
    return [];
  }

  // Function to get clean photo name without category tags
  function getCleanPhotoName(fileName) {
    return fileName.replace(/#\w+/g, '').trim();
  }

  // Function to sanitize filename for optimized version
  function sanitizeFileName(fileName) {
    return fileName
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/[^\w\-\.]/g, '')      // Remove special chars except hyphens, dots, underscores
      .replace(/--+/g, '-')           // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '');       // Remove leading/trailing hyphens
  }

  // Scan all category folders for photos
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

        // Extract categories from filename (e.g., "DSC03555#street#bw" -> ["street", "bw"])
        const fileCategories = extractCategoriesFromFilename(fileName);
        const cleanName = getCleanPhotoName(fileName);

        // Use clean name as unique identifier
        const photoId = cleanName || fileName;

        if (!photoTracker.has(photoId)) {
          photoTracker.set(photoId, {
            file: file,
            fileName: fileName,
            categories: new Set(),
            primaryFolder: category.folder,
            filePath: filePath,
            cleanName: photoId
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

            metadataTracker.set(photoId, metadata);
            console.log(`📷 EXIF extracted for ${photoId}:`, metadata);
          } catch (error) {
            console.warn(`⚠️  Could not extract EXIF for ${photoId}:`, error.message);
            metadataTracker.set(photoId, getDefaultMetadata());
          }
        }

        // Add categories from filename to the photo
        if (fileCategories.length > 0) {
          fileCategories.forEach(cat => {
            photoTracker.get(photoId).categories.add(cat);
          });
          console.log(`🏷️  "${fileName}" tagged with categories: ${fileCategories.join(', ')}`);
        } else {
          // If no categories in filename, use folder name as category
          photoTracker.get(photoId).categories.add(category.value);
        }

        totalPhotos++;
      }
    } else {
      console.log(`📁 ${category.label}: 0 photos (folder doesn't exist)`);
    }
  }

  // Create gallery items with image optimization
  let uniquePhotos = 0;
  const optimizedDir = path.join(galleryDir, 'optimized');

  // Ensure optimized directory exists
  if (!fs.existsSync(optimizedDir)) {
    fs.mkdirSync(optimizedDir, { recursive: true });
  }

  const allPhotos = [];
  const categoryPhotos = new Map();

  // Initialize category arrays
  categories.forEach(cat => {
    categoryPhotos.set(cat.value, []);
  });

  for (const [fileName, photoData] of photoTracker) {
    // Generate cleaner photo labels
    const cleanName = generatePhotoLabel(fileName);

    // Create optimized version of the image
    const originalPath = photoData.filePath;
    const sanitizedFileName = sanitizeFileName(fileName);
    const optimizedFileName = `${sanitizedFileName}.jpg`;
    const optimizedPath = path.join(optimizedDir, optimizedFileName);

    let optimizationResult = { optimized: false };

    // Only optimize if the optimized version doesn't exist or is older than original
    const shouldOptimize = !fs.existsSync(optimizedPath) ||
      fs.statSync(originalPath).mtime > fs.statSync(optimizedPath).mtime;

    if (shouldOptimize) {
      console.log(`🖼️  Optimizing ${fileName}...`);
      optimizationResult = await optimizeImage(originalPath, optimizedPath);
    } else {
      console.log(`✅ Using cached optimized version of ${fileName}`);
      // Get orientation data even for cached files
      const image = sharp(originalPath);
      const metadata = await image.metadata();
      optimizationResult = {
        optimized: true,
        ...getPhotoOrientation(metadata.width, metadata.height)
      };
    }

    // Verify optimized file exists before adding to gallery
    if (!fs.existsSync(optimizedPath)) {
      console.warn(`⚠️  Skipping ${fileName} - optimized image not found at ${optimizedPath}`);
      continue;
    }

    // Verify file has content
    const fileStats = fs.statSync(optimizedPath);
    if (fileStats.size === 0) {
      console.warn(`⚠️  Skipping ${fileName} - optimized image is empty`);
      continue;
    }

    const photoItem = {
      label: cleanName,
      href: `/gallery/optimized/${optimizedFileName}`,
      metadata: metadataTracker.get(fileName),
      orientation: optimizationResult.orientation || 'landscape',
      aspectRatio: optimizationResult.aspectRatio || '4:3'
    };

    // Add to 'all' category (shuffled later)
    allPhotos.push({
      ...photoItem,
      category: 'all',
      originalCategory: Array.from(photoData.categories)[0]
    });

    // Add to specific categories
    photoData.categories.forEach(category => {
      categoryPhotos.get(category).push({
        ...photoItem,
        category: category
      });
    });

    uniquePhotos++;

    // Log multi-category photos
    if (photoData.categories.size > 1) {
      console.log(`🔄 "${fileName}" appears in: ${Array.from(photoData.categories).join(', ')}`);
    }
  }

  // Smart shuffle to spread out photos with similar file numbers
  function smartShuffleByFileNumber(array) {
    // Extract file numbers from labels
    function extractFileNumber(label) {
      // Match common patterns like "IMG 8413", "DSC02870", "IMG_4127", "DSC 08799"
      const match = label.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }

    // Create array with file numbers
    const photosWithNumbers = array.map(photo => ({
      photo,
      fileNumber: extractFileNumber(photo.label),
      originalLabel: photo.label
    }));

    // Sort by file number
    photosWithNumbers.sort((a, b) => a.fileNumber - b.fileNumber);

    // Interleaved distribution algorithm
    // This spreads out consecutive numbers maximally
    const result = new Array(array.length);
    const step = Math.ceil(Math.sqrt(array.length)); // Dynamic step based on array size

    let resultIndex = 0;
    let sourceIndex = 0;

    // First pass: distribute every Nth item
    while (sourceIndex < photosWithNumbers.length) {
      if (resultIndex >= result.length) {
        // Wrap around and find next empty slot
        resultIndex = result.findIndex(item => item === undefined);
        if (resultIndex === -1) break;
      }

      if (result[resultIndex] === undefined) {
        result[resultIndex] = photosWithNumbers[sourceIndex].photo;
        sourceIndex++;
      }

      resultIndex += step;
    }

    // Fill any remaining gaps (shouldn't happen, but just in case)
    let gapIndex = result.findIndex(item => item === undefined);
    while (gapIndex !== -1 && sourceIndex < photosWithNumbers.length) {
      result[gapIndex] = photosWithNumbers[sourceIndex].photo;
      sourceIndex++;
      gapIndex = result.findIndex(item => item === undefined);
    }

    console.log(`🔀 Smart shuffle applied: ${array.length} photos distributed by file number`);
    console.log(`   File number range: ${photosWithNumbers[0]?.fileNumber} - ${photosWithNumbers[photosWithNumbers.length - 1]?.fileNumber}`);
    console.log(`   Distribution step: ${step}`);

    return result.filter(item => item !== undefined);
  }

  const shuffledAllPhotos = smartShuffleByFileNumber(allPhotos);
  galleryItems.push(...shuffledAllPhotos);

  // Add category-specific photos
  for (const [category, photos] of categoryPhotos) {
    galleryItems.push(...photos);
  }

  console.log(`\n📸 Total photo files: ${totalPhotos}`);
  console.log(`📸 Unique photos: ${uniquePhotos}`);

  // Generate the TypeScript file content
  const tsContent = `export interface GalleryItem {
  label: string;
  href: string;
  category?: string;
  originalCategory?: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  aspectRatio?: string;
  metadata?: {
    camera: string;
    lens: string;
    focalLength: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
  };
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