'use strict';
const dns = require('node:dns/promises');
const http = require('node:http');
const https = require('node:https');
const ipaddr = require('ipaddr.js');
const { fault } = require('./result');
function publicIP(address) {
  try {
    let ip = ipaddr.parse(address);
    if (ip.kind() === 'ipv6' && ip.isIPv4MappedAddress()) ip = ip.toIPv4Address();
    return ip.range() === 'unicast';
  } catch { return false; }
}
function webURL(value) {
  let u;
  try { u = new URL(value); } catch { throw fault('INVALID_URL', 'Provide a valid public HTTP or HTTPS URL.'); }
  if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || (u.port && !['80', '443'].includes(u.port))) throw fault('INVALID_URL', 'Only public HTTP/HTTPS URLs on standard ports are supported.');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || (!host.includes('.') && !host.includes(':'))) throw fault('PRIVATE_URL', 'Local and private addresses are not allowed.');
  if (ipaddr.isValid(host) && !publicIP(host)) throw fault('PRIVATE_URL', 'Local and private addresses are not allowed.');
  return u;
}
/** Resolve once and pin the connection to a public address, including every redirect. */
async function fetchPublic(value, { maxBytes = 2 * 1024 * 1024, timeout = 12000, redirects = 4, signal } = {}) {
  const u = webURL(value);
  const host = u.hostname.replace(/^\[|\]$/g, '');
  let dnsTimer;
  const records = await Promise.race([
    dns.lookup(host, { all: true }),
    new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(fault('TIMEOUT', 'Source DNS resolution timed out.')), timeout); })
  ]).finally(() => clearTimeout(dnsTimer));
  if (!records.length || records.some(r => !publicIP(r.address))) throw fault('PRIVATE_URL', 'The URL resolves to a blocked address.');
  const selected = records[0];
  return new Promise((resolve, reject) => {
    const req = (u.protocol === 'https:' ? https : http).get(u, {
      signal,
      headers: { 'User-Agent': 'TruthGuard/3.0 evidence-retrieval', Accept: 'text/html,application/json,text/plain;q=0.8' },
      lookup: (_host, options, cb) => options.all ? cb(null, [selected]) : cb(null, selected.address, selected.family)
    }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        res.resume();
        if (!res.headers.location || redirects <= 0) return reject(fault('REDIRECT_LIMIT', 'Too many redirects.'));
        return fetchPublic(new URL(res.headers.location, u).href, { maxBytes, timeout, redirects: redirects - 1, signal }).then(resolve, reject);
      }
      if (res.statusCode < 200 || res.statusCode >= 300) { res.resume(); return reject(fault('SOURCE_HTTP_ERROR', 'The source returned HTTP ' + res.statusCode)); }
      const chunks = []; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > maxBytes) req.destroy(fault('SOURCE_TOO_LARGE', 'Source exceeded the download limit.')); else chunks.push(chunk); });
      res.on('error', reject);
      res.on('end', () => resolve({ url: u.href, contentType: res.headers['content-type'] || '', body: Buffer.concat(chunks) }));
    });
    const timer = setTimeout(() => req.destroy(fault('TIMEOUT', 'Source retrieval timed out.')), timeout);
    req.on('close', () => clearTimeout(timer));
    req.on('error', reject);
  });
}
module.exports = { publicIP, webURL, fetchPublic };
