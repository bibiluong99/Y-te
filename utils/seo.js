// ============================================================
// UTILS: TECHNICAL SEO (robots.txt, dynamic sitemap.xml, SSR Meta & JSON-LD)
// Phòng Khám Đa Khoa An Phúc
// ============================================================

const fs = require('fs');
const path = require('path');

const SITE_NAME = 'Phòng Khám Đa Khoa An Phúc';
const DEFAULT_OG_IMAGE = '/images/hero-banner-full-doctor.png';

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getBaseUrl(req) {
  if (process.env.SITE_URL && process.env.SITE_URL.trim()) {
    return process.env.SITE_URL.trim().replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function toAbsoluteUrl(baseUrl, urlOrPath) {
  if (!urlOrPath) return `${baseUrl}${DEFAULT_OG_IMAGE}`;
  const s = String(urlOrPath).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('data:')) return `${baseUrl}${DEFAULT_OG_IMAGE}`;
  return `${baseUrl}${s.startsWith('/') ? s : '/' + s}`;
}

function buildRobotsTxt(baseUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /api/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    ''
  ].join('\n');
}

async function buildSitemapXml(baseUrl, db) {
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/dich-vu.html', priority: '0.9', changefreq: 'weekly' },
    { path: '/chuyen-khoa.html', priority: '0.9', changefreq: 'weekly' },
    { path: '/doi-ngu-bac-si.html', priority: '0.8', changefreq: 'weekly' },
    { path: '/tin-tuc.html', priority: '0.8', changefreq: 'daily' },
    { path: '/san-pham.html', priority: '0.8', changefreq: 'weekly' },
    { path: '/dat-lich-kham.html', priority: '0.9', changefreq: 'monthly' },
    { path: '/lien-he.html', priority: '0.7', changefreq: 'monthly' }
  ];

  const urls = staticPages.map(p => ({
    loc: `${baseUrl}${p.path}`,
    lastmod: today,
    changefreq: p.changefreq,
    priority: p.priority
  }));

  try {
    const services = await db.all("SELECT id, created_at FROM services ORDER BY id ASC");
    for (const s of (services || [])) {
      if (!s || !s.id) continue;
      const lastmod = s.created_at ? String(s.created_at).split('T')[0] : today;
      urls.push({
        loc: `${baseUrl}/chi-tiet-dich-vu.html?id=${s.id}`,
        lastmod: /^\d{4}-\d{2}-\d{2}$/.test(lastmod) ? lastmod : today,
        changefreq: 'weekly',
        priority: '0.8'
      });
    }
  } catch (_) {}

  try {
    const news = await db.all("SELECT id, created_at FROM news ORDER BY id DESC");
    for (const n of (news || [])) {
      if (!n || !n.id) continue;
      const lastmod = n.created_at ? String(n.created_at).split('T')[0] : today;
      urls.push({
        loc: `${baseUrl}/chi-tiet-tin-tuc.html?id=${n.id}`,
        lastmod: /^\d{4}-\d{2}-\d{2}$/.test(lastmod) ? lastmod : today,
        changefreq: 'weekly',
        priority: '0.7'
      });
    }
  } catch (_) {}

  const body = urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${escapeXml(u.lastmod)}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function injectSeoIntoHtml(html, { title, description, canonicalUrl, imageUrl, ogType = 'website', jsonLd = null }) {
  let out = html;

  if (title) {
    out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
  }

  if (description) {
    if (/<meta\s+name=["']description["'][^>]*>/i.test(out)) {
      out = out.replace(
        /<meta\s+name=["']description["'][^>]*>/i,
        `<meta name="description" content="${escapeAttr(description)}">`
      );
    } else {
      out = out.replace('</head>', `  <meta name="description" content="${escapeAttr(description)}">\n</head>`);
    }
  }

  // Gỡ các thẻ SEO động cũ nếu có để tránh trùng lặp
  out = out.replace(/<!-- SEO_DYNAMIC_START -->[\s\S]*?<!-- SEO_DYNAMIC_END -->\s*/g, '');
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '');
  out = out.replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, '');
  out = out.replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, '');

  const tags = [
    '<!-- SEO_DYNAMIC_START -->',
    canonicalUrl ? `<link rel="canonical" href="${escapeAttr(canonicalUrl)}">` : '',
    `<meta property="og:type" content="${escapeAttr(ogType)}">`,
    `<meta property="og:locale" content="vi_VN">`,
    `<meta property="og:site_name" content="${escapeAttr(SITE_NAME)}">`,
    title ? `<meta property="og:title" content="${escapeAttr(title)}">` : '',
    description ? `<meta property="og:description" content="${escapeAttr(description)}">` : '',
    canonicalUrl ? `<meta property="og:url" content="${escapeAttr(canonicalUrl)}">` : '',
    imageUrl ? `<meta property="og:image" content="${escapeAttr(imageUrl)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    title ? `<meta name="twitter:title" content="${escapeAttr(title)}">` : '',
    description ? `<meta name="twitter:description" content="${escapeAttr(description)}">` : '',
    imageUrl ? `<meta name="twitter:image" content="${escapeAttr(imageUrl)}">` : '',
    jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '',
    '<!-- SEO_DYNAMIC_END -->'
  ].filter(Boolean).join('\n  ');

  return out.replace('</head>', `  ${tags}\n</head>`);
}

async function renderNewsDetailWithSeo(req, db, publicDir) {
  const htmlPath = path.join(publicDir, 'chi-tiet-tin-tuc.html');
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');
  const baseUrl = getBaseUrl(req);
  const id = req.query.id;

  if (!id) return rawHtml;

  let article = null;
  try {
    article = await db.get("SELECT * FROM news WHERE id = ?", [id]);
  } catch (_) {}

  if (!article) return rawHtml;

  const title = `${article.title} | ${SITE_NAME}`;
  const rawDesc = article.summary || stripTags(article.content);
  const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : (rawDesc || title);
  const canonicalUrl = `${baseUrl}/chi-tiet-tin-tuc.html?id=${article.id}`;
  const imageUrl = toAbsoluteUrl(baseUrl, article.image);
  const datePublished = article.created_at || new Date().toISOString();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description,
        image: [imageUrl],
        datePublished,
        author: {
          '@type': 'Person',
          name: article.author || SITE_NAME
        },
        publisher: {
          '@type': 'MedicalClinic',
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/images/logo.png`
          }
        },
        mainEntityOfPage: canonicalUrl
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Tin tức y tế', item: `${baseUrl}/tin-tuc.html` },
          { '@type': 'ListItem', position: 3, name: article.title, item: canonicalUrl }
        ]
      }
    ]
  };

  return injectSeoIntoHtml(rawHtml, {
    title,
    description,
    canonicalUrl,
    imageUrl,
    ogType: 'article',
    jsonLd
  });
}

async function renderServiceDetailWithSeo(req, db, publicDir) {
  const htmlPath = path.join(publicDir, 'chi-tiet-dich-vu.html');
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');
  const baseUrl = getBaseUrl(req);
  const id = req.query.id;

  if (!id) return rawHtml;

  let service = null;
  try {
    service = await db.get("SELECT * FROM services WHERE id = ?", [id]);
  } catch (_) {}

  if (!service) return rawHtml;

  const title = `${service.name} | Dịch vụ Y tế — ${SITE_NAME}`;
  const rawDesc = service.description || stripTags(service.intro);
  const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : (rawDesc || title);
  const canonicalUrl = `${baseUrl}/chi-tiet-dich-vu.html?id=${service.id}`;
  const imageUrl = toAbsoluteUrl(baseUrl, service.banner || '/images/banners/services-hero.jpg');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: service.name,
        serviceType: service.category || 'Dịch vụ y tế',
        description,
        image: imageUrl,
        provider: {
          '@type': 'MedicalClinic',
          name: SITE_NAME,
          url: `${baseUrl}/`
        },
        offers: service.price > 0 ? {
          '@type': 'Offer',
          price: String(service.price),
          priceCurrency: 'VND',
          url: canonicalUrl
        } : undefined
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Dịch vụ y tế', item: `${baseUrl}/dich-vu.html` },
          { '@type': 'ListItem', position: 3, name: service.name, item: canonicalUrl }
        ]
      }
    ]
  };

  return injectSeoIntoHtml(rawHtml, {
    title,
    description,
    canonicalUrl,
    imageUrl,
    ogType: 'website',
    jsonLd
  });
}

module.exports = {
  getBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
  renderNewsDetailWithSeo,
  renderServiceDetailWithSeo
};
