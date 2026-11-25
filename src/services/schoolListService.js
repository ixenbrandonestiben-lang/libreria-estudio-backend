const productModel = require('../models/productModel');
const { cleanText, normalizeForMatching, escapeLike } = require('../utils/sanitizer');

const STOP_WORDS = new Set([
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'un',
  'una',
  'unos',
  'unas',
  'con',
  'para',
  'por',
  'en',
  'y',
  'o',
  'tipo',
  'marca',
  'tamano',
  'color',
  'unidades',
  'unidad',
  'paquete'
]);

/**
 * Parses a raw line into quantity and cleaned description.
 */
function parseRawLine(rawLine) {
  let line = cleanText(rawLine)
    .replace(/^\d+[.)\-]\s*/, '')
    .replace(/^[-*•]+\s*/, '')
    .trim();

  if (!line) {
    return null;
  }

  let quantity = 1;

  // Match leading quantity e.g. "2 cuadernos" or "3x lapiceros"
  const leadingMatch = line.match(/^(\d{1,3})\s*(?:x|unidades?|u\.?)?\s+(.+)$/i);
  if (leadingMatch) {
    const parsed = Number.parseInt(leadingMatch[1], 10);
    if (parsed >= 1 && parsed <= 100) {
      quantity = parsed;
      line = leadingMatch[2].trim();
    }
  } else {
    // Match trailing quantity e.g. "Cuaderno A4 x2"
    const trailingMatch = line.match(/^(.+?)\s+x\s*(\d{1,3})$/i);
    if (trailingMatch) {
      const parsed = Number.parseInt(trailingMatch[2], 10);
      if (parsed >= 1 && parsed <= 100) {
        quantity = parsed;
        line = trailingMatch[1].trim();
      }
    }
  }

  return {
    originalLine: cleanText(rawLine),
    description: line,
    quantity
  };
}

/**
 * Extracts normalized technical attributes from a school list item description.
 */
function extractTechnicalAttributes(description, defaultEducationLevel = null) {
  const norm = normalizeForMatching(description);
  const extracted = {};

  if (/cuadriculad/.test(norm)) {
    extracted.ruling_type = 'cuadriculado';
  } else if (/rayad|lineas/.test(norm)) {
    extracted.ruling_type = 'rayado';
  } else if (/doble\s*linea/.test(norm)) {
    extracted.ruling_type = 'doble_linea';
  } else if (/blanco|sin\s*lineas/.test(norm)) {
    extracted.ruling_type = 'blanco';
  }

  const sheetMatch = norm.match(/\b(50|80|100|120|200)\s*(?:hojas|h\.?)\b/);
  if (sheetMatch) {
    extracted.sheet_count = sheetMatch[1];
  }

  const weightMatch = norm.match(/\b(70|75|80|90|100|120)\s*(?:g|gr|gsm|gramos)\b/);
  if (weightMatch) {
    extracted.paper_weight_gsm = weightMatch[1];
  }

  if (/\ba4\b/.test(norm)) {
    extracted.format_size = 'A4';
  } else if (/\boficio\b/.test(norm)) {
    extracted.format_size = 'oficio';
  } else if (/\bcarta\b/.test(norm)) {
    extracted.format_size = 'carta';
  } else if (/\buniversitari[oa]\b/.test(norm)) {
    extracted.format_size = 'universitario';
  }

  const leadMatch = norm.match(/\b(2b|hb|2h|4b|6b)\b/);
  if (leadMatch) {
    extracted.lead_grade = leadMatch[1].toUpperCase();
  }

  const colorCountMatch = norm.match(/\b(12|24|36|48)\s*colores\b/);
  if (colorCountMatch) {
    extracted.color_count = colorCountMatch[1];
  }

  if (/\bazul\b/.test(norm)) {
    extracted.ink_color = 'azul';
  } else if (/\bnegro\b/.test(norm)) {
    extracted.ink_color = 'negro';
  } else if (/\brojo\b/.test(norm)) {
    extracted.ink_color = 'rojo';
  }

  const tipMatch = norm.match(/\b(0\.5|0\.7|1\.0)\s*mm\b/);
  if (tipMatch) {
    extracted.tip_size_mm = tipMatch[1];
  }

  if (defaultEducationLevel) {
    extracted.education_level = defaultEducationLevel;
  } else if (/primaria/.test(norm)) {
    extracted.education_level = 'primaria';
  } else if (/secundaria|basico/.test(norm)) {
    extracted.education_level = 'secundaria';
  } else if (/universitari/.test(norm)) {
    extracted.education_level = 'universitario';
  }

  return extracted;
}

function extractKeywords(description) {
  const norm = normalizeForMatching(description);
  const tokens = norm
    .replace(/[^a-z0-9.\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  // Deduplicate preserving order
  return Array.from(new Set(tokens)).slice(0, 6);
}

function scoreCandidate(candidate, keywords, extractedAttrs, candidateAttrs = []) {
  const titleNorm = normalizeForMatching(candidate.title);
  let keywordHits = 0;

  for (const kw of keywords) {
    if (titleNorm.includes(kw)) {
      keywordHits += 1;
    }
  }

  let attrMatches = 0;
  const extractedEntries = Object.entries(extractedAttrs);
  for (const [k, v] of extractedEntries) {
    const found = candidateAttrs.find(
      (a) => a.key === k && normalizeForMatching(a.value) === normalizeForMatching(v)
    );
    if (found) {
      attrMatches += 1;
    }
  }

  const keywordRatio = keywords.length > 0 ? keywordHits / keywords.length : 0;
  const attrRatio = extractedEntries.length > 0 ? attrMatches / extractedEntries.length : 1;

  return {
    keywordHits,
    attrMatches,
    score: keywordRatio * 0.65 + attrRatio * 0.35
  };
}

async function quoteSchoolList({ rawText, items, educationLevel = null }) {
  let normalizedItems = [];

  if (Array.isArray(items) && items.length > 0) {
    normalizedItems = items
      .map((item) => ({
        originalLine: cleanText(item.description),
        description: cleanText(item.description),
        quantity: item.quantity ? Number(item.quantity) : 1
      }))
      .filter((item) => item.description.length > 0);
  } else if (typeof rawText === 'string') {
    normalizedItems = rawText
      .split(/\r?\n|;/)
      .map(parseRawLine)
      .filter(Boolean)
      .slice(0, 60);
  }

  const results = [];
  let estimatedSubtotal = 0;
  let exactMatches = 0;
  let alternatives = 0;
  let outOfStock = 0;
  let notFound = 0;

  for (const item of normalizedItems) {
    const extractedAttributes = extractTechnicalAttributes(item.description, educationLevel);
    const keywords = extractKeywords(item.description);
    const escapedKeywords = keywords.map(escapeLike);

    const candidates = await productModel.findCandidatesForSchoolList(escapedKeywords, 8);
    if (candidates.length === 0) {
      notFound += 1;
      results.push({
        requestedLine: item.originalLine,
        normalizedDescription: item.description,
        quantity: item.quantity,
        extractedAttributes,
        matchStatus: 'not_found',
        selectedProduct: null,
        alternativeProducts: [],
        lineEstimatedTotal: '0.00'
      });
      continue;
    }

    const attrsMap = await productModel.findAttributesByProductIds(candidates.map((c) => c.id));

    const scored = candidates
      .map((c) => {
        const cAttrs = attrsMap[c.id] || [];
        const metrics = scoreCandidate(c, keywords, extractedAttributes, cAttrs);
        return {
          ...c,
          attributes: cAttrs,
          score: metrics.score,
          keywordHits: metrics.keywordHits,
          attrMatches: metrics.attrMatches
        };
      })
      .sort((a, b) => b.score - a.score || Number(a.price) - Number(b.price));

    const inStockCandidates = scored.filter((c) => Number(c.stock_available) >= item.quantity);
    const bestOverall = scored[0];

    if (inStockCandidates.length === 0) {
      outOfStock += 1;
      results.push({
        requestedLine: item.originalLine,
        normalizedDescription: item.description,
        quantity: item.quantity,
        extractedAttributes,
        matchStatus: 'out_of_stock',
        selectedProduct: bestOverall,
        alternativeProducts: scored.slice(0, 3),
        lineEstimatedTotal: '0.00'
      });
      continue;
    }

    const bestInStock = inStockCandidates[0];
    const isExact = bestInStock.score >= 0.65 && bestInStock.keywordHits >= 1;
    const matchStatus = isExact ? 'exact_match' : 'alternative';

    if (matchStatus === 'exact_match') {
      exactMatches += 1;
    } else {
      alternatives += 1;
    }

    const lineTotal = Number(bestInStock.price) * item.quantity;
    estimatedSubtotal += lineTotal;

    results.push({
      requestedLine: item.originalLine,
      normalizedDescription: item.description,
      quantity: item.quantity,
      extractedAttributes,
      matchStatus,
      selectedProduct: bestInStock,
      alternativeProducts: inStockCandidates.slice(1, 4),
      lineEstimatedTotal: lineTotal.toFixed(2)
    });
  }

  return {
    items: results,
    summary: {
      totalItems: results.length,
      exactMatches,
      alternatives,
      outOfStock,
      notFound,
      estimatedSubtotal: estimatedSubtotal.toFixed(2)
    }
  };
}

module.exports = {
  quoteSchoolList,
  parseRawLine,
  extractTechnicalAttributes
};
