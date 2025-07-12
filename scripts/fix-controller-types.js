#!/usr/bin/env node

/**
 * Fix controller method signatures to include NextFunction parameter
 * VP-level implementation for systematic TypeScript error resolution
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Files to fix
const CONTROLLER_FILES = [
  "src/modules/activitypub/controllers/activitypubController.ts",
  "src/modules/actors/controllers/actorsController.ts",
  "src/modules/comments/controllers/comments.controller.ts",
  "src/modules/webfinger/controllers/webfingerController.ts",
  "src/modules/notifications/controllers/notifications.controller.ts",
];

/**
 * Fix method signatures to include NextFunction parameter
 */
function fixControllerMethodSignatures() {
  console.log("🔧 Fixing controller method signatures...");

  CONTROLLER_FILES.forEach((filePath) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Fix method signatures that are missing NextFunction parameter
    // Pattern 1: async method(req: Request, res: Response): Promise<void>
    const pattern1 =
      /async\s+(\w+)\s*\(\s*req:\s*Request,\s*res:\s*Response\s*\):\s*Promise<void>/g;
    if (pattern1.test(content)) {
      content = content.replace(
        pattern1,
        "async $1(req: Request, res: Response, next: NextFunction): Promise<void>"
      );
      modified = true;
    }

    // Pattern 2: method(req: Request, res: Response): void
    const pattern2 =
      /(\w+)\s*\(\s*req:\s*Request,\s*res:\s*Response\s*\):\s*void/g;
    if (pattern2.test(content)) {
      content = content.replace(
        pattern2,
        "$1(req: Request, res: Response, next: NextFunction): void"
      );
      modified = true;
    }

    // Add NextFunction import if not present
    if (!content.includes("NextFunction")) {
      content = content.replace(
        /import.*{[^}]*Request[^}]*Response[^}]*}.*from\s*['"]express['"];?/,
        (match) => {
          if (match.includes("NextFunction")) {
            return match;
          }
          return match.replace("Response", "Response, NextFunction");
        }
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log("🚀 Starting controller type fixes...");

  try {
    fixControllerMethodSignatures();
    console.log("✅ All controller type fixes completed successfully!");
  } catch (error) {
    console.error("❌ Error during controller type fixes:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixControllerMethodSignatures };
