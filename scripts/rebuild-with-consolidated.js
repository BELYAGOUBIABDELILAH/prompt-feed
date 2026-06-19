#!/usr/bin/env node
/**
 * scripts/rebuild-with-consolidated.js
 * Imports consolidated_prompts.xlsx, maps the columns to data/prompts.json / csv,
 * and regenerates the prompts/ tree.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CATEGORY_MAP = {
  'Coding & Development':      { folder: 'coding-development',      emoji: '💻' },
  'Writing & Content':          { folder: 'writing-content',          emoji: '✍️' },
  'Image & Design':             { folder: 'image-design',             emoji: '🎨' },
  'Data & Analytics':           { folder: 'data-analytics',           emoji: '📊' },
  'Marketing & Social':         { folder: 'marketing-social',         emoji: '📣' },
  'Education & Learning':       { folder: 'education-learning',       emoji: '🎓' },
  'AI & Automation':            { folder: 'ai-automation',            emoji: '🤖' },
  'General':                    { folder: 'general',                  emoji: '🧩' },
  'Business & Career':          { folder: 'business-career',          emoji: '💼' },
  'Health & Wellness':          { folder: 'health-wellness',          emoji: '🩺' },
  'Documentation':              { folder: 'documentation',            emoji: '📄' },
  'Research & Analysis':        { folder: 'research-analysis',        emoji: '🔬' },
  'Security':                   { folder: 'security',                 emoji: '🔒' },
  'Sales & Business':           { folder: 'sales-business',           emoji: '💰' },
  'Product & Strategy':         { folder: 'product-strategy',         emoji: '🧭' },
  'Games & Fun':                { folder: 'games-fun',                emoji: '🎮' },
  'Philosophy & Humanities':    { folder: 'philosophy-humanities',    emoji: '📜' },
  'Travel & Places':            { folder: 'travel-places',            emoji: '🌍' },
  'Food & Recipes':             { folder: 'food-recipes',             emoji: '🍳' },
};

const FALLBACK = { folder: 'general', emoji: '🧩', category: 'General' };

function makeSlug(act) {
  let s = (act || '').toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  s = s.slice(0, 60);
  return s || 'untitled';
}

function csvEscape(val) {
  const s = String(val == null ? '' : val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const dataDir = path.join(repoRoot, 'data');
  const xlsxPath = path.join(dataDir, 'consolidated_prompts.xlsx');

  if (!fs.existsSync(xlsxPath)) {
    console.error('ERROR: consolidated_prompts.xlsx not found at', xlsxPath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`Read ${rows.length} rows from consolidated_prompts.xlsx`);

  const slugCounters = {}; // folder -> { slug -> count }

  const records = rows.map(row => {
    const act = String(row['Act'] || '').trim();
    const category = String(row['Category'] || '').trim();
    const prompt = String(row['Prompt'] || '').trim();
    const source = String(row['Source'] || '').trim();

    const mapping = CATEGORY_MAP[category] || { ...FALLBACK, category: category || 'General' };
    const folder = mapping.folder;
    const resolvedCategory = CATEGORY_MAP[category] ? category : (category || 'General');

    // Slug de-duplication
    if (!slugCounters[folder]) slugCounters[folder] = {};
    const baseSlug = makeSlug(act);
    let slug = baseSlug;
    if (slugCounters[folder][baseSlug] === undefined) {
      slugCounters[folder][baseSlug] = 1;
    } else {
      slugCounters[folder][baseSlug]++;
      slug = `${baseSlug}-${slugCounters[folder][baseSlug]}`;
    }

    return {
      act,
      category: resolvedCategory,
      prompt,
      source,
      type: 'TEXT',
      slug,
      folder,
      path: `prompts/${folder}/${slug}.md`,
    };
  });

  // Write data/prompts.json
  fs.writeFileSync(
    path.join(dataDir, 'prompts.json'),
    JSON.stringify(records, null, 2),
    'utf8'
  );
  console.log(`Wrote data/prompts.json (${records.length} records)`);

  // Write data/prompts.csv
  const csvHeader = 'act,category,prompt,source,type,slug,folder,path';
  const csvRows = records.map(r =>
    [r.act, r.category, r.prompt, r.source, r.type, r.slug, r.folder, r.path]
      .map(csvEscape)
      .join(',')
  );
  fs.writeFileSync(
    path.join(dataDir, 'prompts.csv'),
    [csvHeader, ...csvRows].join('\n'),
    'utf8'
  );
  console.log(`Wrote data/prompts.csv (${records.length} rows)`);

  // Run generate-tree.js
  console.log('Running scripts/generate-tree.js...');
  execSync('node scripts/generate-tree.js', { stdio: 'inherit', cwd: repoRoot });
  console.log('Successfully regenerated full tree!');
}

run().catch(console.error);
