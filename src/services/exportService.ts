import { format, parseISO } from "date-fns";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import APP_CONFIG from "../config/appConfig";
import { Journal } from "../types";
import { base64ToDataUri } from "./imageService";

/**
 * Export journals as JSON with metadata for proper import
 */
export const exportAsJSON = async (journals: Journal[]): Promise<string> => {
  const exportData = {
    version: "1.0",
    appName: APP_CONFIG.displayName,
    exportDate: new Date().toISOString(),
    totalEntries: journals.length,
    journals: journals.map((journal) => ({
      id: journal.id,
      date: journal.date,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
      title: journal.title,
      text: journal.text,
      mood: journal.mood,
      images: journal.images || [],
    })),
  };
  return JSON.stringify(exportData, null, 2);
};

/**
 * Export journals as plain markdown
 */
export const exportAsMarkdown = async (
  journals: Journal[],
): Promise<string> => {
  let markdownContent = `${APP_CONFIG.displayName} Export\n`;
  markdownContent += "=".repeat(40) + "\n\n";

  journals.forEach((journal, index) => {
    const date = format(
      parseISO(journal.date),
      "EEEE, MMMM dd, yyyy - hh:mm a",
    );
    if (journal.title) {
      markdownContent += `# Title: ${journal.title}\n`;
    }
    markdownContent += `*Entry ${index + 1}*\n`;
    markdownContent += `*Date: ${date}*\n`;
    markdownContent += `\n${journal.text}\n`;
    if (journal.images && journal.images.length > 0) {
      markdownContent += `\n[${journal.images.length} image(s) attached]\n`;
    }
    markdownContent += "\n" + "-".repeat(40) + "\n\n";
  });

  return markdownContent;
};

/**
 * Export journals as PDF with embedded images
 */
export const exportAsPDF = async (journals: Journal[]): Promise<string> => {
  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_CONFIG.displayName} - Journal Export</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      font-family: 'Segoe UI', 'Roboto', -apple-system, BlinkMacSystemFont, 'Oxygen', 'Ubuntu', sans-serif;
      background: #ffffff;
      color: #1f1f1f;
      line-height: 1.6;
      padding: 0.75rem 1.5rem;
    }

    @media print {
      .document-header{
        padding: 14px 0 10px;
        margin-bottom: 12px;
      }
    }


    @page { margin: 16mm 14mm; }  /* good default for A4/Letter */

    /* Document Header */
    .document-header {
      text-align: center;
      padding: 32px 0;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 24px;
      page-break-after: avoid;
    }

    .document-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a73e8;
      margin-bottom: 6px;
      letter-spacing: -0.3px;
    }

    .document-meta {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 12px;
      flex-wrap: wrap;
      font-size: 11px;
      color: #5f6368;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .meta-label {
      font-weight: 600;
      color: #1a73e8;
    }

    /* Journal Entries Container */
    .entries-container {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* Individual Journal Entry */
    .journal-entry {
      background: #ffffff;
      border-left: 3px solid #1a73e8;
      padding: 20px;
      page-break-inside: avoid;
      border-radius: 4px;
      border: 1px solid #e8e8e8;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .journal-entry:nth-child(odd) {
      border-left-color: #1a73e8;
    }

    .journal-entry:nth-child(2n) {
      border-left-color: #4285f4;
    }

    /* Entry Header */
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      page-break-after: avoid;
    }

    .entry-date-time {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .entry-date {
      font-size: 12px;
      font-weight: 600;
      color: #1a73e8;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .entry-time {
      font-size: 10px;
      color: #9aa0a6;
    }

    .entry-index {
      font-size: 10px;
      color: #bdc1c6;
    }

    /* Entry Title */
    .entry-title {
      font-size: 18px;
      font-weight: 700;
      color: #202124;
      margin-bottom: 10px;
      letter-spacing: -0.2px;
      line-height: 1.3;
      page-break-after: avoid;
    }

    .entry-title.untitled {
      font-style: italic;
      color: #9aa0a6;
      font-weight: 400;
      font-size: 16px;
    }

    /* Entry Content (Body Text) */
    .entry-content {
      font-size: 13px;
      color: #3c4043;
      line-height: 1.65;
      margin-bottom: 12px;
      word-wrap: break-word;
      page-break-inside: auto;
      break-inside: auto;
    }

    .entry-content h1,
    .entry-content h2,
    .entry-content h3,
    .entry-content h4,
    .entry-content h5,
    .entry-content h6 {
      color: #1a73e8;
      margin-top: 10px;
      margin-bottom: 6px;
      font-weight: 600;
    }

    .entry-content h1 {
      font-size: 16px;
    }

    .entry-content h2 {
      font-size: 15px;
    }

    .entry-content h3,
    .entry-content h4,
    .entry-content h5,
    .entry-content h6 {
      font-size: 13px;
    }

    .entry-content p {
      margin-bottom: 8px;
    }

    .entry-content blockquote {
      border-left: 3px solid #dadce0;
      padding-left: 12px;
      margin-left: 0;
      margin-top: 8px;
      margin-bottom: 8px;
      color: #5f6368;
      font-style: italic;
      background: #f8f9fa;
      padding: 8px 12px;
    }

    .entry-content ul,
    .entry-content ol {
      margin-left: 20px;
      margin-bottom: 8px;
    }

    .entry-content li {
      margin-bottom: 3px;
    }

    .entry-content code {
      background: #f1f3f4;
      padding: 2px 5px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #d33427;
    }

    .entry-content pre {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 8px 0;
      border: 1px solid #dadce0;
      font-size: 12px;
    }

    .entry-content pre code {
      background: none;
      color: #202124;
      padding: 0;
    }

    /* Images Gallery - IMPROVED */
    .images-section {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #e8e8e8;
      page-break-inside: avoid;
    }

    .images-label {
      font-size: 11px;
      font-weight: 600;
      color: #1a73e8;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 10px;
      display: block;
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      page-break-inside: avoid;
    }

    /* Single image - full width fallback */
    .images-grid.single {
      grid-template-columns: 1fr;
    }

    .image-wrapper {
      page-break-inside: avoid;
      break-inside: avoid-page;
      text-align: center;
      overflow: hidden;
    }

    .entry-image {
      display: block;
      width: 100%;
      height: auto;
      max-height: 280px;
      margin: 0 auto;
      border-radius: 3px;
      border: 1px solid #e8e8e8;
      object-fit: contain;
      background: #fafafa;
    }

    .image-caption {
      font-size: 10px;
      color: #9aa0a6;
      text-align: center;
      margin-top: 4px;
      font-style: italic;
    }

    /* Entry Footer Stats */
    .entry-footer {
      font-size: 10px;
      color: #9aa0a6;
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #f0f0f0;
      page-break-after: avoid;
    }

    /* Page Break Divider */
    .page-divider {
      border: none;
      border-top: 1px solid #e8e8e8;
      margin: 24px 0;
      page-break-after: avoid;
    }

    /* Summary Section */
    .summary-section {
      background: #f8f9fa;
      border-left: 3px solid #1a73e8;
      padding: 18px;
      margin-top: 32px;
      page-break-inside: avoid;
      border-radius: 4px;
      border: 1px solid #e8e8e8;
    }

    .summary-section h2 {
      color: #1a73e8;
      font-size: 15px;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      padding: 4px 0;
    }

    .stat-label {
      color: #5f6368;
      font-weight: 500;
    }

    .stat-value {
      font-weight: 600;
      color: #1a73e8;
    }

    /* Footer */
    .document-footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #bdc1c6;
      page-break-before: avoid;
      padding-top: 16px;
      border-top: 1px solid #e8e8e8;
    }

    /* Print-specific styles */
    @media print {
      body {
        margin: 0;
        padding: 0.5in;
      }

    .journal-entry{
      margin-bottom: 16px;
      page-break-inside: auto;
      break-inside: auto;
    }


      /* Keep these together */
.entry-header,
.entry-title{
  page-break-after: avoid;
  break-after: avoid-page;
}


      .entry-header,
      .entry-title,
      .entry-content,
      .images-section {
        page-break-inside: avoid;
      }

      .image-wrapper {
        page-break-inside: avoid;
      }

      .page-divider {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>`;

  // Document Header
  const exportDate = format(new Date(), "MMMM dd, yyyy");
  const exportTime = format(new Date(), "hh:mm a");

  htmlContent += `
  <div class="document-header">
    <h1>${APP_CONFIG.displayName}</h1>
    <p style="color: #9aa0a6; margin-top: 2px; font-size: 12px;">Journal Export</p>
    <div class="document-meta">
      <div class="meta-item">
        <span class="meta-label">📅</span>
        <span>${exportDate} at ${exportTime}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">📝</span>
        <span>${journals.length} ${journals.length === 1 ? "entry" : "entries"}</span>
      </div>
    </div>
  </div>`;

  // Entries
  htmlContent += '<div class="entries-container">';

  for (let index = 0; index < journals.length; index++) {
    const journal = journals[index];
    const dateObj = parseISO(journal.date);
    const formattedDate = format(dateObj, "EEEE, MMMM dd, yyyy");
    const formattedTime = format(dateObj, "hh:mm a");

    htmlContent += `
    <div class="journal-entry">
      <div class="entry-header">
        <div class="entry-date-time">
          <div class="entry-date">${formattedDate}</div>
          <div class="entry-time">${formattedTime}</div>
        </div>
        <div class="entry-index">Entry ${index + 1}</div>
      </div>`;

    // Title
    if (journal.title && journal.title.trim()) {
      htmlContent += `<h2 class="entry-title">${journal.title
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</h2>`;
    } else {
      htmlContent += `<h2 class="entry-title untitled">Untitled Entry</h2>`;
    }

    // Content
    try {
      htmlContent += `<div class="entry-content">${journal.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br />")}</div>`;
    } catch {
      htmlContent += `<div class="entry-content">${journal.text}</div>`;
    }

    // Images - IMPROVED GRID
    if (journal.images && journal.images.length > 0) {
      const imageCount = journal.images.length;
      const gridClass = imageCount === 1 ? "images-grid single" : "images-grid";

      htmlContent += `<div class="images-section">
        <span class="images-label">📸 Images (${imageCount})</span>
        <div class="${gridClass}">`;

      journal.images.forEach((base64Image, imgIndex) => {
        try {
          const imageDataUri = base64ToDataUri(base64Image);
          htmlContent += `
          <div class="image-wrapper">
            <img src="${imageDataUri}" alt="Image ${imgIndex + 1}" class="entry-image" />
            <div class="image-caption">Image ${imgIndex + 1}</div>
          </div>`;
        } catch (error) {
          console.error("Error processing image for PDF:", error);
          htmlContent += `
          <div class="image-wrapper">
            <div style="background: #f0f0f0; padding: 20px; border-radius: 3px; text-align: center;">
              <div class="image-caption">❌ Image ${imgIndex + 1} could not be loaded</div>
            </div>
          </div>`;
        }
      });

      htmlContent += `</div></div>`;
    }

    // Entry Footer
    const wordCount = journal.text
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    htmlContent += `
    <div class="entry-footer">
      💾 ${format(parseISO(journal.createdAt || journal.date), "MMM dd, yyyy")} · ${wordCount} words
    </div>`;

    // Page divider (except last entry)
    if (index < journals.length - 1) {
      htmlContent += '<hr class="page-divider" />';
    }

    htmlContent += "</div>";
  }

  htmlContent += "</div>";

  // Summary Section
  const totalWords = journals.reduce(
    (sum, j) => sum + j.text.split(/\s+/).filter((w) => w.length > 0).length,
    0,
  );
  const avgWordsPerEntry =
    journals.length > 0 ? Math.round(totalWords / journals.length) : 0;
  const dateRange =
    journals.length > 0
      ? `${format(parseISO(journals[journals.length - 1].date), "MMM dd, yyyy")} — ${format(parseISO(journals[0].date), "MMM dd, yyyy")}`
      : "N/A";

  htmlContent += `
  <div class="summary-section">
    <h2>📊 Export Summary</h2>
    <div class="summary-stats">
      <div class="stat-item">
        <span class="stat-label">Total Entries:</span>
        <span class="stat-value">${journals.length}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Words:</span>
        <span class="stat-value">${totalWords.toLocaleString()}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Avg. Per Entry:</span>
        <span class="stat-value">${avgWordsPerEntry} words</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Date Range:</span>
        <span class="stat-value">${dateRange}</span>
      </div>
    </div>
  </div>

  <div class="document-footer">
    <p>Generated by ${APP_CONFIG.displayName} • ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
    <p style="margin-top: 4px;">🔐 Personal data. Keep confidential.</p>
  </div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
    });
    return uri;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

/**
 * Share file using native share dialog
 * On mobile, this opens the share sheet which includes "Save to Files" option
 */
export const shareFile = async (
  uri: string,
  filename: string,
): Promise<void> => {
  if (Platform.OS === "web") {
    // For web, trigger download
    // Handle both file URIs and data URIs
    let downloadUri = uri;
    if (uri.startsWith("data:")) {
      // Data URI - use as is
      downloadUri = uri;
    } else {
      // File URI - fetch and convert to blob
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        downloadUri = URL.createObjectURL(blob);
      } catch (error) {
        console.error("Error fetching file for download:", error);
        // Fallback to direct URI
      }
    }

    const link = document.createElement("a");
    link.href = downloadUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL if created
    if (downloadUri.startsWith("blob:")) {
      setTimeout(() => URL.revokeObjectURL(downloadUri), 100);
    }
  } else {
    // For mobile, use native share dialog
    // This will show options including "Save to Files" on iOS and "Save" on Android
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        dialogTitle: `Save or Share ${filename}`,
        mimeType: getMimeType(filename),
        UTI: Platform.OS === "ios" ? getUTI(filename) : undefined,
      });
    } else {
      throw new Error("Sharing is not available on this device");
    }
  }
};

/**
 * Get UTI (Uniform Type Identifier) for iOS file sharing
 */
const getUTI = (filename: string): string => {
  if (filename.endsWith(".json")) return "public.json";
  if (filename.endsWith(".txt")) return "public.plain-text";
  if (filename.endsWith(".pdf")) return "com.adobe.pdf";
  return "public.data";
};

/**
 * Get MIME type from filename
 */
const getMimeType = (filename: string): string => {
  if (filename.endsWith(".json")) return "application/json";
  if (filename.endsWith(".txt")) return "text/plain";
  if (filename.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
};

/**
 * Save text file and return the file URI
 * On mobile: saves to Documents directory (accessible via Files app)
 * On web: triggers download and returns data URI
 */
export const saveTextFile = async (
  content: string,
  filename: string,
): Promise<string> => {
  if (Platform.OS === "web") {
    // For web, trigger download
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    // Return a data URI for consistency
    return `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
  } else {
    // For mobile, save to Documents directory (accessible via Files app)
    // Prefer documentDirectory as it's user-accessible
    const documentDir =
      FileSystem.documentDirectory || FileSystem.cacheDirectory || "";
    const fileUri = `${documentDir}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return fileUri;
  }
};

/**
 * Save file to a shareable location and return the file URI
 * This ensures the file is accessible for sharing/saving
 */
export const saveFileForSharing = async (
  content: string,
  filename: string,
  mimeType: string,
): Promise<string> => {
  if (Platform.OS === "web") {
    // For web, trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
  } else {
    // For mobile, save to Documents directory
    const documentDir =
      FileSystem.documentDirectory || FileSystem.cacheDirectory || "";
    const fileUri = `${documentDir}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return fileUri;
  }
};

/**
 * Download text as file (web only) - kept for backward compatibility
 * @deprecated Use saveTextFile instead
 */
export const downloadTextFile = (content: string, filename: string): void => {
  if (Platform.OS !== "web") return;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
