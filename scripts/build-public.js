'use strict';
const fs = require('fs');
const path = require('path');
const { validateDatabase } = require('./publisher-safety');

function publicFiles(root) {
  const database = validateDatabase(JSON.parse(fs.readFileSync(path.join(root, 'content/perspectives.json'), 'utf8')));
  return [
    'index.html', 'about.html', 'contact.html', 'what-we-do.html', 'investment-theses.html',
    'article.html', '404.html', 'privacy.html', 'business-card-single.html', 'robots.txt', 'sitemap.xml',
    'css/style.css', ...['components', 'main', 'investment-theses-data', 'home', 'perspectives', 'services', 'legacy-article'].map(n => `js/${n}.js`),
    ...['apple-touch-icon.png', 'arif-headshot.jpg', 'arif-headshot.webp', 'faris-capital-wordmark-stacked.svg',
      'faris-capital-wordmark-v2-med.svg', 'faris-capital-wordmark-v2-reversed.svg',
      'favicon-192.png', 'favicon-32.png', 'og-image.png', 'siraj-headshot.jpg', 'siraj-headshot.webp', 'stephanie-headshot.jpg'].map(n => `images/${n}`),
    ...database.posts.filter(p => p.image).map(p => p.image.replace(/^\//, '')),
    ...database.posts.map(p => `theses/${p.id}.html`)
  ];
}

function buildPublic(root) {
  const files = publicFiles(root);
  const dist = path.join(root, 'dist');
  // Never erase an unrelated directory which happens to be called dist.
  if (fs.existsSync(dist) && (!fs.existsSync(path.join(dist, '.faris-build')) || fs.lstatSync(dist).isSymbolicLink())) {
    throw new Error('Existing dist is not an owned Faris build directory');
  }
  const stage = fs.mkdtempSync(path.join(root, '.public-build-'));
  try {
    for (const name of files) {
      const dest = path.join(stage, name);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(root, name), dest);
    }
    fs.writeFileSync(path.join(stage, '.faris-build'), JSON.stringify({ files }, null, 2));
    if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true });
    fs.renameSync(stage, dist);
  } catch (err) {
    fs.rmSync(stage, { recursive: true, force: true });
    throw err;
  }
  return files;
}
module.exports = { buildPublic, publicFiles };
if (require.main === module) console.log(`Built ${buildPublic(path.join(__dirname, '..')).length} public files in dist/.`);
