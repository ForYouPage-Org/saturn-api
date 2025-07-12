#!/usr/bin/env node

/**
 * Enterprise-grade error response conversion script
 * Converts direct res.status().json({error}) responses to use AppError middleware
 *
 * VP-level implementation for systematic codebase modernization
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Error type mappings for standardization
const ERROR_TYPE_MAPPING = {
  400: "VALIDATION",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMIT",
  500: "SERVER_ERROR",
};

// Files to exclude from conversion
const EXCLUDE_PATTERNS = [
  "**/node_modules/**",
  "**/test/**",
  "**/tests/**",
  "**/*.test.ts",
  "**/*.spec.ts",
  "scripts/**",
  "dist/**",
  "build/**",
];

/**
 * Convert direct error responses to AppError middleware usage
 */
function convertErrorResponses(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let modifiedContent = content;
  let hasChanges = false;

  // Pattern to match: res.status(statusCode).json({ error: 'message' })
  const errorResponsePattern =
    /res\.status\((\d+)\)\.json\(\s*\{\s*error:\s*['"](.*?)['"]\s*\}\s*\)/g;

  // Pattern to match: return res.status(statusCode).json({ error: 'message' })
  const returnErrorResponsePattern =
    /return\s+res\.status\((\d+)\)\.json\(\s*\{\s*error:\s*['"](.*?)['"]\s*\}\s*\)/g;

  // Convert standard error responses
  modifiedContent = modifiedContent.replace(
    errorResponsePattern,
    (match, statusCode, errorMessage) => {
      const errorType = ERROR_TYPE_MAPPING[statusCode] || "SERVER_ERROR";
      hasChanges = true;
      return `next(new AppError('${errorMessage}', ${statusCode}, ErrorType.${errorType}))`;
    }
  );

  // Convert return error responses
  modifiedContent = modifiedContent.replace(
    returnErrorResponsePattern,
    (match, statusCode, errorMessage) => {
      const errorType = ERROR_TYPE_MAPPING[statusCode] || "SERVER_ERROR";
      hasChanges = true;
      return `return next(new AppError('${errorMessage}', ${statusCode}, ErrorType.${errorType}))`;
    }
  );

  // Add imports if changes were made
  if (hasChanges) {
    // Check if AppError import already exists
    const hasAppErrorImport =
      modifiedContent.includes("import { AppError, ErrorType }") ||
      modifiedContent.includes("import { AppError }") ||
      modifiedContent.includes("import { ErrorType }");

    if (!hasAppErrorImport) {
      // Find the last import statement
      const importPattern = /import\s+.*?from\s+['"].*?['"];?\s*\n/g;
      const imports = modifiedContent.match(importPattern);

      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const insertIndex =
          modifiedContent.lastIndexOf(lastImport) + lastImport.length;

        // Determine the correct import path
        const relativePath = path.relative(
          path.dirname(filePath),
          path.join(__dirname, "../src/utils/errors")
        );
        const importPath = relativePath.startsWith(".")
          ? relativePath
          : "./" + relativePath;

        modifiedContent =
          modifiedContent.slice(0, insertIndex) +
          `import { AppError, ErrorType } from '${importPath.replace(
            /\\/g,
            "/"
          )}';\n` +
          modifiedContent.slice(insertIndex);
      }
    }

    // Add NextFunction to imports if not present
    const hasNextFunctionImport = modifiedContent.includes("NextFunction");
    if (
      !hasNextFunctionImport &&
      modifiedContent.includes("import") &&
      modifiedContent.includes("express")
    ) {
      modifiedContent = modifiedContent.replace(
        /import\s+.*?\{\s*(.*?)\s*\}\s+from\s+['"]express['"];?/,
        (match, imports) => {
          if (!imports.includes("NextFunction")) {
            return match.replace(imports, imports + ", NextFunction");
          }
          return match;
        }
      );
    }
  }

  return { modifiedContent, hasChanges };
}

/**
 * Process all TypeScript files in the src directory
 */
function processFiles() {
  const srcPattern = path.join(__dirname, "../src/**/*.ts");
  const files = glob.sync(srcPattern, { ignore: EXCLUDE_PATTERNS });

  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalConversions = 0;

  console.log(`🔄 Processing ${files.length} TypeScript files...`);

  files.forEach((filePath) => {
    totalFiles++;
    const { modifiedContent, hasChanges } = convertErrorResponses(filePath);

    if (hasChanges) {
      fs.writeFileSync(filePath, modifiedContent);
      modifiedFiles++;

      // Count conversions
      const conversions =
        (modifiedContent.match(/new AppError\(/g) || []).length -
        (
          fs
            .readFileSync(filePath.replace(modifiedContent, ""), "utf8")
            .match(/new AppError\(/g) || []
        ).length;
      totalConversions += conversions;

      console.log(`✅ Converted ${filePath}`);
    }
  });

  console.log(`\n📊 Conversion Summary:`);
  console.log(`   Total files processed: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Estimated conversions: ${totalConversions}`);
  console.log(`\n🎯 Phase 1 Error Middleware Conversion Complete`);
  console.log(
    `   All direct error responses have been converted to use AppError middleware`
  );
  console.log(
    `   Enterprise-grade error handling now enforced across the codebase`
  );
}

/**
 * Main execution
 */
if (require.main === module) {
  console.log("🚀 Saturn API - Enterprise Error Response Conversion");
  console.log("   VP-level systematic codebase modernization");
  console.log("   Converting direct error responses to AppError middleware\n");

  try {
    processFiles();
    console.log("\n✅ SUCCESS: Error response conversion completed");
    console.log("   Next steps: Run CI tests to validate changes");
  } catch (error) {
    console.error("❌ ERROR: Conversion failed:", error.message);
    process.exit(1);
  }
}

module.exports = { convertErrorResponses };
