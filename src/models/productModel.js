const { getPool } = require('../config/database');

const ALLOWED_SORT_MAP = Object.freeze({
  newest: 'p.created_at DESC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  title_asc: 'p.title ASC'
});

const ALLOWED_ATTRIBUTE_KEYS = new Set([
  'ruling_type',
  'sheet_count',
  'paper_weight_gsm',
  'format_size',
  'education_level',
  'edition_year',
  'lead_grade',
  'color_count',
  'ink_color',
  'tip_size_mm'
]);

/**
 * Lists all active categories.
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function listCategories(conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, parent_id, name, slug, description
     FROM categories
     WHERE is_active = 1
     ORDER BY name ASC`
  );
  return rows;
}

/**
 * Lists all active brands.
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function listBrands(conn = null) {
  const db = conn || getPool();
  const [rows] = await db.execute(
    `SELECT id, name, slug
     FROM brands
     WHERE is_active = 1
     ORDER BY name ASC`
  );
  return rows;
}

/**
 * Fetches technical attributes for a list of product IDs.
 * @param {number[]} productIds
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findAttributesByProductIds(productIds, conn = null) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return {};
  }

  const db = conn || getPool();
  const placeholders = productIds.map(() => '?').join(', ');
  const [rows] = await db.execute(
    `SELECT product_id, attribute_key, attribute_value, display_label
     FROM product_attributes
     WHERE product_id IN (${placeholders})
     ORDER BY id ASC`,
    productIds
  );

  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.product_id]) {
      grouped[row.product_id] = [];
    }
    grouped[row.product_id].push({
      key: row.attribute_key,
      value: row.attribute_value,
      label: row.display_label
    });
  }
  return grouped;
}

/**
 * Searches and filters active products using strict whitelisted columns and attributes.
 * @param {object} filters
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function searchProducts(filters = {}, conn = null) {
  const db = conn || getPool();
  const whereClauses = ['p.is_active = 1'];
  const params = [];

  if (filters.categorySlug) {
    whereClauses.push('c.slug = ?');
    params.push(String(filters.categorySlug).trim());
  }

  if (filters.brandSlug) {
    whereClauses.push('b.slug = ?');
    params.push(String(filters.brandSlug).trim());
  }

  if (filters.search) {
    const term = `%${String(filters.search).trim()}%`;
    whereClauses.push('(p.title LIKE ? OR p.short_description LIKE ? OR p.sku LIKE ? OR p.isbn LIKE ?)');
    params.push(term, term, term, term);
  }

  if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== '') {
    const minPrice = Number(filters.minPrice);
    if (!Number.isNaN(minPrice)) {
      whereClauses.push('p.price >= ?');
      params.push(minPrice);
    }
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== '') {
    const maxPrice = Number(filters.maxPrice);
    if (!Number.isNaN(maxPrice)) {
      whereClauses.push('p.price <= ?');
      params.push(maxPrice);
    }
  }

  if (filters.inStockOnly) {
    whereClauses.push('p.stock_available > 0');
  }

  if (filters.attributes && typeof filters.attributes === 'object') {
    for (const [attrKey, attrValue] of Object.entries(filters.attributes)) {
      if (ALLOWED_ATTRIBUTE_KEYS.has(attrKey) && attrValue !== undefined && attrValue !== '') {
        whereClauses.push(
          `EXISTS (
            SELECT 1 FROM product_attributes pa
            WHERE pa.product_id = p.id
              AND pa.attribute_key = ?
              AND pa.attribute_value = ?
          )`
        );
        params.push(attrKey, String(attrValue).trim());
      }
    }
  }

  const whereSql = whereClauses.join(' AND ');
  const orderBySql = ALLOWED_SORT_MAP[filters.sort] || ALLOWED_SORT_MAP.newest;

  const page = Math.max(1, Number.parseInt(filters.page || '1', 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(filters.limit || '12', 10) || 12));
  const offset = (page - 1) * limit;

  const baseFrom = `
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id AND c.is_active = 1
    INNER JOIN brands b ON b.id = p.brand_id AND b.is_active = 1
    WHERE ${whereSql}
  `;

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total ${baseFrom}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await db.execute(
    `SELECT
       p.id, p.sku, p.isbn, p.title, p.slug, p.short_description,
       p.unit_label, p.units_per_pack, p.price, p.stock_available,
       p.stock_reserved, p.image_url,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug
     ${baseFrom}
     ORDER BY ${orderBySql}
     LIMIT ? OFFSET ?`,
    [...params, String(limit), String(offset)]
  );

  const productIds = rows.map((r) => r.id);
  const attributesMap = await findAttributesByProductIds(productIds, conn);

  const items = rows.map((row) => ({
    ...row,
    attributes: attributesMap[row.id] || []
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Finds a single active product by slug or ID with its technical attributes.
 * @param {string|number} identifier
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findProductDetail(identifier, conn = null) {
  const db = conn || getPool();
  const isNumeric = /^\d+$/.test(String(identifier));
  const condition = isNumeric ? 'p.id = ?' : 'p.slug = ?';

  const [rows] = await db.execute(
    `SELECT
       p.id, p.sku, p.isbn, p.title, p.slug, p.short_description,
       p.unit_label, p.units_per_pack, p.price, p.stock_available,
       p.stock_reserved, p.image_url, p.created_at, p.updated_at,
       c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
       b.id AS brand_id, b.name AS brand_name, b.slug AS brand_slug
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     INNER JOIN brands b ON b.id = p.brand_id
     WHERE ${condition} AND p.is_active = 1
     LIMIT 1`,
    [isNumeric ? Number(identifier) : String(identifier)]
  );

  const product = rows[0] || null;
  if (!product) {
    return null;
  }

  const attributesMap = await findAttributesByProductIds([product.id], conn);
  return {
    ...product,
    attributes: attributesMap[product.id] || []
  };
}

/**
 * Finds candidate products for school list quotation matching by keywords.
 * @param {string[]} keywords
 * @param {number} [limit=5]
 * @param {import('mysql2/promise').PoolConnection|null} [conn=null]
 */
async function findCandidatesForSchoolList(keywords, limit = 5, conn = null) {
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return [];
  }

  const db = conn || getPool();
  const sanitizedTerms = keywords
    .map((k) => String(k).trim())
    .filter((k) => k.length >= 2)
    .slice(0, 6);

  if (sanitizedTerms.length === 0) {
    return [];
  }

  const matchClauses = sanitizedTerms.map(
    () => '(p.title LIKE ? OR p.short_description LIKE ? OR c.name LIKE ?)'
  );
  const params = [];
  for (const term of sanitizedTerms) {
    const like = `%${term}%`;
    params.push(like, like, like);
  }

  const safeLimit = Math.min(20, Math.max(1, Number.parseInt(limit, 10) || 5));

  const [rows] = await db.execute(
    `SELECT
       p.id, p.sku, p.title, p.slug, p.unit_label, p.units_per_pack,
       p.price, p.stock_available, p.image_url,
       c.slug AS category_slug, b.name AS brand_name
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id AND c.is_active = 1
     INNER JOIN brands b ON b.id = p.brand_id AND b.is_active = 1
     WHERE p.is_active = 1 AND (${matchClauses.join(' OR ')})
     ORDER BY p.stock_available DESC, p.price ASC
     LIMIT ?`,
    [...params, String(safeLimit)]
  );

  return rows;
}

module.exports = {
  ALLOWED_ATTRIBUTE_KEYS,
  listCategories,
  listBrands,
  findAttributesByProductIds,
  searchProducts,
  findProductDetail,
  findCandidatesForSchoolList
};
