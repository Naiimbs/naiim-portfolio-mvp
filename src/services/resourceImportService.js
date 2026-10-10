import JSZip from 'jszip';
import { parseMarkdownSkill } from '../admin/utils/markdownParser';
import { uploadMedia } from './media';
import { aiProviderService } from './aiProviderService';

/**
 * Normalizes and sanitizes file paths within a ZIP to prevent path traversal
 */
function sanitizePath(path) {
  // Remove absolute paths and directory traversal
  return path.replace(/^(\/|\\)+/, '').replace(/(\.\.\/|\.\.\\)/g, '');
}

/**
 * Inspects a ZIP bundle and generates a staging inventory.
 */
export async function analyzeBundle(file) {
  if (!file) return { error: 'No file provided' };

  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    const files = [];

    let totalSizeBytes = 0;

    // Iterate through zip entries
    contents.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const safePath = sanitizePath(relativePath);
        files.push({
          path: safePath,
          originalName: zipEntry.name,
          zipEntry, // Keep reference for extraction later
        });
      }
    });

    if (files.length === 0) {
      return { error: 'ZIP file is empty or invalid.' };
    }

    if (files.length > 200) {
      return { error: 'ZIP file contains too many files (max 200).' };
    }

    return { data: { files, totalExtractedFiles: files.length }, error: null };
  } catch (err) {
    console.error('[ResourceImportService] analyzeBundle failed', err);
    return { error: err.message || 'Failed to read ZIP bundle' };
  }
}

/**
 * Classifies files based on extension and path.
 */
export function classifyFiles(files) {
  return files.map(f => {
    let classification = 'attachment';
    let assetType = 'attachment';
    const lowerPath = f.path.toLowerCase();

    if (lowerPath.endsWith('skill.md')) {
      classification = 'Skill Definition';
      assetType = 'documentation';
    } else if (lowerPath.endsWith('readme.md')) {
      classification = 'Documentation';
      assetType = 'documentation';
    } else if (lowerPath.endsWith('.xlsx') || lowerPath.endsWith('.xls') || lowerPath.includes('template')) {
      classification = 'Templates & Workbooks';
      assetType = 'template';
    } else if (lowerPath.endsWith('.pdf')) {
      classification = 'Example Output / Document';
      assetType = 'example';
    } else if (lowerPath.includes('screenshot') || lowerPath.endsWith('.png') || lowerPath.endsWith('.jpg')) {
      classification = 'Evidence';
      assetType = 'screenshot';
    } else if (lowerPath.endsWith('.py') || lowerPath.endsWith('.js') || lowerPath.includes('script')) {
      classification = 'Source Bundle / Implementation';
      assetType = 'script';
    }

    return { ...f, classification, assetType };
  });
}

/**
 * Extracts SKILL.md or README.md from the inventory and parses it deterministically.
 */
export async function parseMarkdown(inventory) {
  let markdownFile = inventory.find(f => f.path.toLowerCase().endsWith('skill.md'));
  if (!markdownFile) {
    markdownFile = inventory.find(f => f.path.toLowerCase().endsWith('readme.md'));
  }

  if (!markdownFile) {
    return { data: null, error: 'No SKILL.md or README.md found' };
  }

  try {
    const text = await markdownFile.zipEntry.async('string');
    const parsed = parseMarkdownSkill(text);
    return { data: parsed, textContent: text, error: null };
  } catch (err) {
    return { error: 'Failed to parse markdown: ' + err.message };
  }
}

/**
 * AI Provider Hook
 */
export async function enrichWithAI(parsedData, rawMarkdown) {
  try {
    const payload = {
      action: "RESOURCE_ENRICHMENT",
      resource_type: "skill",
      title: parsedData.title || "Untitled",
      description: parsedData.description || "",
      content: rawMarkdown || "",
      source_markdown: rawMarkdown || "",
      existing_metadata: parsedData
    };

    const result = await aiProviderService.enrichResource(payload);
    
    if (result && typeof result === 'object') {
      return { data: result, error: null };
    }
    return { error: 'Invalid AI Provider response format' };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Commits the staging inventory to Supabase Storage and updates the form data.
 */
export async function commitImport(inventory, originalZipFile, importId = 'temp') {
  const uploadedAssets = [];
  const tempFolder = `resources/_imports/${importId}`;

  // 1. Upload original ZIP as source bundle
  const zipRes = await uploadMedia(originalZipFile, { folder: tempFolder });
  if (zipRes.data) {
    uploadedAssets.push({
      id: `asset-${Date.now()}-zip`,
      name: originalZipFile.name,
      asset_type: 'source',
      description: 'Imported Resource Bundle',
      file_url: zipRes.data.public_url,
      is_previewable: false,
      is_downloadable: true,
      is_required: true,
    });
  } else {
    return { error: 'Failed to upload source ZIP: ' + zipRes.error.message };
  }

  // 2. Upload extracted files to storage
  for (let i = 0; i < inventory.length; i++) {
    const f = inventory[i];
    try {
      // Avoid uploading screenshots automatically as core assets unless they are specific evidence
      // For now, we'll extract and upload all files.
      const blob = await f.zipEntry.async('blob');
      // Reconstruct a File object for the uploader
      const extMatch = f.path.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0] : '';
      let mimeType = blob.type || 'application/octet-stream';
      if (ext === '.md') mimeType = 'text/markdown';
      if (ext === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const fileObj = new File([blob], f.originalName, { type: mimeType });
      const uploadRes = await uploadMedia(fileObj, { folder: tempFolder });

      if (uploadRes.data) {
        uploadedAssets.push({
          id: `asset-${Date.now()}-${i}`,
          name: f.originalName,
          asset_type: f.assetType,
          description: f.classification,
          file_url: uploadRes.data.public_url,
          is_previewable: f.assetType === 'documentation' || f.assetType === 'screenshot' || f.assetType === 'example',
          is_downloadable: true,
          is_required: f.assetType === 'documentation',
        });
      }
    } catch (err) {
      console.warn(`[ResourceImportService] Failed to extract/upload ${f.path}`, err);
    }
  }

  return { data: uploadedAssets, error: null };
}

/**
 * Deletes the temporary import folder if the user cancels or closes before saving the resource.
 */
export async function cleanupCanceledImport(importId) {
  if (!importId) return;
  const tempFolder = `resources/_imports/${importId}`;
  try {
    const { supabase } = await import('../lib/supabase.js');
    if (!supabase) return;
    
    // List all files in the temp folder
    const { data: files, error: listError } = await supabase.storage
      .from('portfolio-media')
      .list(tempFolder);
      
    if (listError || !files || files.length === 0) return;
    
    // Remove the files from storage
    const pathsToRemove = files.map(f => `${tempFolder}/${f.name}`);
    await supabase.storage.from('portfolio-media').remove(pathsToRemove);

    // Remove orphaned records from the 'media' table
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .like('storage_path', `${tempFolder}/%`);
      
    if (dbError) {
      console.warn('[ResourceImportService] Failed to clean up media table records', dbError);
    }
  } catch (err) {
    console.warn(`[ResourceImportService] Failed to clean up canceled import ${importId}`, err);
  }
}
