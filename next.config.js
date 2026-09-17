/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // A stray package-lock.json outside the project makes Next.js infer the wrong
  // workspace root and silently exit on `next dev`. There IS one at
  // ~/Desktop/package-lock.json (it declares "name": "Desktop"), and this
  // project lives at ~/Desktop/mentee-prototype, so the trap is live here.
  // Pin the tracing root to this directory. Same fix as admin/next.config.js.
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
