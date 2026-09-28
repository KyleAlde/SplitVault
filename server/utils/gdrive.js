const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Readable } = require('node:stream');
const { google } = require('googleapis');

const OAUTH_REDIRECT_URI = 'https://developers.google.com/oauthplayground';

function getDriveClient() {
  const { GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN } = process.env;
  if (!GDRIVE_CLIENT_ID || !GDRIVE_CLIENT_SECRET || !GDRIVE_REFRESH_TOKEN) {
    const legacyCredentialsConfigured = Boolean(process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_PRIVATE_KEY);
    const legacyHint = legacyCredentialsConfigured
      ? ' Service-account credentials are not used for personal Drive uploads.'
      : '';
    throw new Error(`Configure GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, and GDRIVE_REFRESH_TOKEN in server/.env.${legacyHint}`);
  }

  const auth = new google.auth.OAuth2(GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, OAUTH_REDIRECT_URI);
  auth.setCredentials({ refresh_token: GDRIVE_REFRESH_TOKEN });
  return google.drive({ version: 'v3', auth });
}

function getDriveFileId(value) {
  if (typeof value !== 'string' || !value) return null;
  if (/^[\w-]+$/.test(value)) return value;

  try {
    const url = new URL(value);
    if (!['drive.google.com', 'docs.google.com'].includes(url.hostname)) return null;
    return url.pathname.match(/\/d\/([\w-]+)/)?.[1] || url.searchParams.get('id');
  } catch {
    return null;
  }
}

function getDrivePreviewUrl(filePath) {
  const fileId = getDriveFileId(filePath);
  return fileId
    ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1600`
    : filePath;
}

function getDriveUploadErrorMessage(error) {
  const errorCode = error?.response?.data?.error || error?.code || error?.message;
  if (errorCode === 'unauthorized_client' || errorCode === 'invalid_client') {
    return 'Google rejected the OAuth client (unauthorized_client). Ensure the client ID, client secret, and refresh token all belong to the same OAuth client, then generate a new refresh token for that client with Drive access.';
  }
  if (errorCode === 'invalid_grant') {
    return 'Google rejected the refresh token (invalid_grant). Re-authorize the same OAuth client and replace the refresh token in server/.env.';
  }
  if (error?.response?.status) {
    return `Google Drive API request failed (HTTP ${error.response.status})`;
  }
  return error instanceof Error ? error.message : String(error);
}

function logDriveError(label, error) {
  console.error(label, {
    code: error?.response?.data?.error || error?.code || 'UNKNOWN',
    status: error?.response?.status || error?.status || undefined,
  });
}

async function uploadFileToDrive(file, poolName) {
  let drive;
  let uploadedFileId;
  try {
    const folderId = process.env.GDRIVE_FOLDER_ID;
    if (!folderId) throw new Error('GDRIVE_FOLDER_ID is required');

    const buffer = Buffer.isBuffer(file) ? file : file?.buffer;
    const sourceStream = file && typeof file.pipe === 'function' ? file : file?.stream;
    if ((!Buffer.isBuffer(buffer) || buffer.length === 0) && (!sourceStream || typeof sourceStream.pipe !== 'function')) {
      throw new TypeError('A non-empty receipt file buffer or readable stream is required');
    }

    const originalName = file?.originalname || file?.name || 'receipt';
    const safeName = path.basename(originalName.replace(/\\/g, '/')).replace(/[^\w.-]+/g, '_') || 'receipt';
    const extension = path.extname(safeName);
    const baseName = path.basename(safeName, extension);
    const fileName = `${baseName}-${Date.now()}-${randomUUID()}${extension}`;
    const mimeType = file?.mimetype || file?.mimeType || 'application/octet-stream';
    const mediaStream = sourceStream || Readable.from([buffer]);

    drive = getDriveClient();
    const { data } = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        ...(poolName ? { description: `SplitVault receipt for ${poolName}` } : {}),
      },
      media: { mimeType, body: mediaStream },
      fields: 'id,webViewLink,webContentLink',
    });
    if (!data.id) throw new Error('Google Drive did not return a file ID');
    uploadedFileId = data.id;

    await drive.permissions.create({
      fileId: data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return {
      id: data.id,
      webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
      webContentLink: data.webContentLink || null,
    };
  } catch (error) {
    logDriveError('[GDRIVE_UPLOAD_ERROR]', error);
    if (drive && uploadedFileId) {
      try {
        await drive.files.delete({ fileId: uploadedFileId });
      } catch (cleanupError) {
        logDriveError('[GDRIVE_UPLOAD_CLEANUP_ERROR]', cleanupError);
      }
    }
    const message = getDriveUploadErrorMessage(error);
    return {
      error: true,
      code: 'GDRIVE_UPLOAD_FAILED',
      message: `Google Drive upload failed: ${message}`,
    };
  }
}

function getReceiptAccessUrl(filePath) {
  return filePath;
}

module.exports = {
  getDriveFileId,
  getDrivePreviewUrl,
  getDriveUploadErrorMessage,
  getReceiptAccessUrl,
  uploadFileToDrive,
};
