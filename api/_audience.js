// api/_audience.js
// Returns the Resend audience ID from RESEND_AUDIENCE_ID, tolerating stray
// whitespace, quotes or a pasted "NAME=" prefix. Returns '' if no UUID is found.
function audienceId() {
  const raw = String(process.env.RESEND_AUDIENCE_ID || '');
  const m = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return m ? m[0] : '';
}

module.exports = { audienceId };
