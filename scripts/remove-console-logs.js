#!/usr/bin/env node

/**
 * Script to replace console.log with logger calls
 * Usage: node scripts/remove-console-logs.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

// Directories to process
const DIRS_TO_PROCESS = ['utils', 'providers', 'services', 'store', 'hooks'];

// Files to exclude
const EXCLUDE_FILES = ['logger.ts', 'remove-console-logs.js'];

// Patterns to replace
const PATTERNS = [
  {
    // console.log(...) -> logger.debug(...)
    regex: /console\.log\(/g,
    replacement: 'logger.debug(',
    type: 'debug'
  },
  {
    // console.info(...) -> logger.info(...)
    regex: /console\.info\(/g,
    replacement: 'logger.info(',
    type: 'info'
  },
  {
    // console.warn(...) -> logger.warn(...)
    regex: /console\.warn\(/g,
    replacement: 'logger.warn(',
    type: 'warn'
  },
  // Keep console.error as is (critical errors)
];

let stats = {
  filesProcessed: 0,
  filesModified: 0,
  replacements: {
    debug: 0,
    info: 0,
    warn: 0,
  },
};

/**
 * Check if file needs logger import
 */
function needsLoggerImport(content) {
  return !content.includes("from '@/utils/logger'") && 
         !content.includes('from "../utils/logger"') &&
         !content.includes('from "./logger"');
}

/**
 * Add logger import to file
 */
function addLoggerImport(content) {
  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex === -1) {
    // No imports found, add at the beginning
    return "import { logger } from '@/utils/logger';\n\n" + content;
  }
  
  // Add after last import
  lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/utils/logger';");
  return lines.join('\n');
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let needsImport = false;
    
    // Apply replacements
    for (const pattern of PATTERNS) {
      const matches = content.match(pattern.regex);
      if (matches) {
        content = content.replace(pattern.regex, pattern.replacement);
        stats.replacements[pattern.type] += matches.length;
        modified = true;
        needsImport = true;
      }
    }
    
    // Add logger import if needed
    if (needsImport && needsLoggerImport(content)) {
      content = addLoggerImport(content);
    }
    
    // Write back if modified
    if (modified) {
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
      stats.filesModified++;
      console.log(`✅ Modified: ${filePath}`);
    }
    
    stats.filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Process directory recursively
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        processDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      // Process .ts and .tsx files
      if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
          !EXCLUDE_FILES.includes(entry.name)) {
        processFile(fullPath);
      }
    }
  }
}

/**
 * Main function
 */
function main() {
  console.log('🔍 Scanning for console.log statements...\n');
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }
  
  // Process each directory
  for (const dir of DIRS_TO_PROCESS) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Processing ${dir}/...`);
      processDirectory(dirPath);
    }
  }
  
  // Print statistics
  console.log('\n📊 Statistics:');
  console.log(`   Files processed: ${stats.filesProcessed}`);
  console.log(`   Files modified: ${stats.filesModified}`);
  console.log(`   Replacements:`);
  console.log(`     - console.log → logger.debug: ${stats.replacements.debug}`);
  console.log(`     - console.info → logger.info: ${stats.replacements.info}`);
  console.log(`     - console.warn → logger.warn: ${stats.replacements.warn}`);
  
  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else {
    console.log('\n✅ Done! All console.log statements have been replaced.');
  }
}

// Run the script
main();
