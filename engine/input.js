'use strict';
const { fault } = require('./result');
const { webURL } = require('./network');
const MAX_FILE = 12 * 1024 * 1024;
const MAX_TEXT = 40000;
const FIELDS = ['image_base64', 'video_base64', 'audio_base64', 'document_base64'];
function decode(value) {
  if (typeof value !== 'string') throw fault('INVALID_INPUT', 'Media must be encoded as base64.');
  const data = value.replace(/^data:[a-z0-9.+/-]+;base64,/i, '');
  if (!data || data.length > Math.ceil(MAX_FILE / 3) * 4 || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) throw fault('INVALID_MEDIA', 'Malformed or oversized base64 media.');
  const bytes = Buffer.from(data, 'base64');
  if (bytes.length > MAX_FILE || bytes.toString('base64') !== data) throw fault('INVALID_MEDIA', 'Malformed or oversized base64 media.');
  return bytes;
}
function validate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw fault('INVALID_INPUT', 'Expected a JSON object.');
  const p = {};
  for (const key of ['text','url','filename','mime_type','ocr_text']) {
    if (payload[key] !== undefined && typeof payload[key] !== 'string') throw fault('INVALID_INPUT', key + ' must be a string.');
    p[key] = (payload[key] || '').trim();
  }
  if (p.text.length > MAX_TEXT || p.ocr_text.length > MAX_TEXT) throw fault('TEXT_TOO_LONG', 'Text exceeds the 40,000 character limit.');
  if (p.filename.length > 255 || /[\\/\0]/.test(p.filename) || p.filename === '..') throw fault('INVALID_FILENAME', 'Use a plain filename without paths.');
  if (p.mime_type && !/^[a-z]+\/[a-z0-9.+-]+$/i.test(p.mime_type)) throw fault('INVALID_MIME', 'Invalid MIME type.');
  if (p.url) webURL(p.url);
  for (const key of ['image_url','video_url','audio_url','image_description']) if (payload[key]) throw fault('UNSUPPORTED_INPUT', 'Upload media bytes; remote media and descriptions are not forensic evidence.');
  let total = 0;
  for (const key of FIELDS) if (payload[key] !== undefined) { p[key] = decode(payload[key]); total += p[key].length; }
  if (total > MAX_FILE) throw fault('PAYLOAD_TOO_LARGE', 'Combined files exceed 12 MB.');
  if (!p.text && !p.url && !p.ocr_text && !FIELDS.some(key => p[key])) throw fault('EMPTY_INPUT', 'Submit text, a public source URL, or a media file.');
  if (payload.crop !== undefined && payload.crop !== '') {
    if (!p.image_base64 || !payload.crop || typeof payload.crop !== 'object' || !['left','top','width','height'].every(k => Number.isInteger(payload.crop[k]) && payload.crop[k] >= (['width','height'].includes(k) ? 1 : 0))) throw fault('INVALID_CROP', 'Crop requires actual image bytes and integer left/top/width/height coordinates.');
    p.crop = payload.crop;
  }
  return p;
}
module.exports = { validate, decode, MAX_FILE, MAX_TEXT, FIELDS };
