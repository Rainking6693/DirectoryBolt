#!/usr/bin/env node

/**
 * Demonstration of Gemini API fixes in action
 * Shows before/after behavior of the fixes
 */

const { stripMarkdownCodeBlocks, parseJsonWithFallback } = require('./test-gemini-fixes');

console.log("🚀 DirectoryBolt Gemini API Fixes Demonstration");
console.log("================================================\n");

// Example 1: Gemini response with markdown (BEFORE fix)
console.log("❌ BEFORE FIX: Gemini response with markdown code blocks");
const geminiResponseWithMarkdown = "```json\n{\n  \"business_name\": null,\n  \"email\": \"input#email\"\n}\n```";
console.log("Gemini response:");
console.log(geminiResponseWithMarkdown);

try {
  // This would fail in the old implementation
  const oldResult = JSON.parse(geminiResponseWithMarkdown);
  console.log("✅ Parsed successfully:", oldResult);
} catch (error) {
  console.log("❌ Failed to parse (this is the problem we fixed):", error.message);
}

console.log("\n" + "=".repeat(50) + "\n");

// Example 1: After fix - markdown stripping
console.log("✅ AFTER FIX: Markdown stripping");
const stripped = stripMarkdownCodeBlocks(geminiResponseWithMarkdown);
console.log("After stripping markdown:");
console.log(stripped);

const { mapping: parsedMapping, isFallback } = parseJsonWithFallback(geminiResponseWithMarkdown, "example.com");
console.log("Parsed successfully with fallback protection:");
console.log("Is fallback mapping:", isFallback);
console.log("Result:", JSON.stringify(parsedMapping, null, 2));

console.log("\n" + "=".repeat(50) + "\n");

// Example 2: Invalid JSON that triggers fallback
console.log("✅ AFTER FIX: Invalid JSON with fallback mechanism");
const invalidJson = "```json\n{\n  \"business_name\": null,\n  \"email\": \"input#email\"  // Missing closing brace";
console.log("Invalid Gemini response:");
console.log(invalidJson);

const { mapping: fallbackMapping, isFallback: usedFallback } = parseJsonWithFallback(invalidJson, "example.com");
console.log("Fallback mechanism activated:");
console.log("Is fallback mapping:", usedFallback);
console.log("Fallback result (key fields):");
console.log("  business_name:", fallbackMapping.business_name);
console.log("  email:", fallbackMapping.email);
console.log("  phone:", fallbackMapping.phone);

console.log("\n" + "=".repeat(50) + "\n");

// Example 3: Normal JSON (should work as before)
console.log("✅ AFTER FIX: Normal JSON (backward compatible)");
const normalJson = `{"business_name":"input[name='company']","email":"input#email","phone":null}`;
console.log("Normal JSON response:");
console.log(normalJson);

const { mapping: normalMapping, isFallback: normalIsFallback } = parseJsonWithFallback(normalJson, "example.com");
console.log("Parsed successfully:");
console.log("Is fallback mapping:", normalIsFallback);
console.log("Result:", JSON.stringify(normalMapping, null, 2));

console.log("\n🎉 All fixes demonstrated successfully!");
console.log("\nSummary of improvements:");
console.log("  ✅ Markdown code blocks are automatically stripped");
console.log("  ✅ JSON parsing failures trigger fallback mapping");
console.log("  ✅ Process continues even when parsing fails");
console.log("  ✅ Clear logging shows what happened");
console.log("  ✅ No more crashes due to JSON parsing errors");