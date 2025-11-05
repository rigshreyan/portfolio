#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_SOURCE = path.join(__dirname, '..', 'gallery-source');

// Function to extract file number from standard names
function extractFileNumber(filename) {
  const match = filename.match(/(?:DSC|IMG|DSCF)_?(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
}

// Find highest file number
function findHighestFileNumber() {
  let highest = 0;

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.match(/\.(jpg|jpeg)$/i)) {
        const num = extractFileNumber(item);
        if (num > highest) {
          highest = num;
        }
      }
    }
  }

  scanDirectory(GALLERY_SOURCE);
  return highest;
}

// Check if filename looks weird (UUID or generic name)
function isWeirdFilename(filename) {
  const base = path.basename(filename, path.extname(filename));

  // UUID pattern (8-4-4-4-12 hex digits)
  if (/^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/i.test(base)) {
    return true;
  }

  // Generic names
  if (['Snapseed', 'FullSizeRender', 'IMG', 'Photo'].includes(base)) {
    return true;
  }

  // FullSizeRender with numbers
  if (/^FullSizeRender\s*\(\d+\)$/.test(base)) {
    return true;
  }

  return false;
}

// Find all weird files
function findWeirdFiles() {
  const weirdFiles = [];

  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.match(/\.(jpg|jpeg)$/i) && isWeirdFilename(item)) {
        weirdFiles.push({
          path: fullPath,
          dir: dir,
          oldName: item,
          mtime: stat.mtimeMs
        });
      }
    }
  }

  scanDirectory(GALLERY_SOURCE);

  // Sort by modification time (oldest first)
  weirdFiles.sort((a, b) => a.mtime - b.mtime);

  return weirdFiles;
}

// Main execution
console.log('Finding highest file number...');
const highestNum = findHighestFileNumber();
console.log(`Highest file number found: ${highestNum}`);

console.log('\nFinding files with weird names...');
const weirdFiles = findWeirdFiles();
console.log(`Found ${weirdFiles.length} files with weird names`);

if (weirdFiles.length === 0) {
  console.log('No files to rename!');
  process.exit(0);
}

console.log('\nFiles to rename:');
let nextNum = highestNum + 1;
const renameOps = [];

for (const file of weirdFiles) {
  const newName = `IMG${String(nextNum).padStart(5, '0')}.jpg`;
  const newPath = path.join(file.dir, newName);

  console.log(`  ${file.oldName}`);
  console.log(`    -> ${newName}`);

  renameOps.push({
    oldPath: file.path,
    newPath: newPath,
    oldName: file.oldName,
    newName: newName
  });

  nextNum++;
}

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n⚠️  Ready to rename files. Continue? (y/n) ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\nRenaming files...');
    for (const op of renameOps) {
      try {
        fs.renameSync(op.oldPath, op.newPath);
        console.log(`✓ Renamed ${op.oldName} -> ${op.newName}`);
      } catch (err) {
        console.error(`✗ Failed to rename ${op.oldName}: ${err.message}`);
      }
    }
    console.log('\n✅ Done! Run "npm run build:gallery" to update the gallery.');
  } else {
    console.log('\nCancelled.');
  }

  rl.close();
  process.exit(0);
});
