#!/usr/bin/env node
/**
 * scripts/build-massive-import.js
 * Fetches public datasets, merges them with the existing 1,328 prompts,
 * deduplicates them, and writes a single massive `data/consolidated_prompts.xlsx` (and JSON/CSV).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// --- Config / Mapping ---
const CATEGORIES = [
  'Coding & Development',
  'Writing & Content',
  'Image & Design',
  'Data & Analytics',
  'Marketing & Social',
  'Education & Learning',
  'AI & Automation',
  'General',
  'Business & Career',
  'Health & Wellness',
  'Documentation',
  'Research & Analysis',
  'Security',
  'Sales & Business',
  'Product & Strategy',
  'Games & Fun',
  'Philosophy & Humanities',
  'Travel & Places',
  'Food & Recipes'
];

// Helper to classify based on keywords in title/content
function classify(title, promptText) {
  const text = `${title} ${promptText}`.toLowerCase();
  
  if (text.includes('security') || text.includes('vulnerability') || text.includes('penetration') || text.includes('exploit') || text.includes('malware') || text.includes('firewall') || text.includes('hack')) {
    return 'Security';
  }
  if (text.includes('code') || text.includes('javascript') || text.includes('python') || text.includes('html') || text.includes('css') || text.includes('react') || text.includes('git') || text.includes('developer') || text.includes('programming') || text.includes('sql') || text.includes('regex') || text.includes('frontend') || text.includes('backend') || text.includes('bug') || text.includes('compiler')) {
    return 'Coding & Development';
  }
  if (text.includes('image') || text.includes('design') || text.includes('midjourney') || text.includes('stable diffusion') || text.includes('art') || text.includes('draw') || text.includes('photographer') || text.includes('logo') || text.includes('interior') || text.includes('illustrator') || text.includes('ui/ux')) {
    return 'Image & Design';
  }
  if (text.includes('data') || text.includes('analytics') || text.includes('excel') || text.includes('statistics') || text.includes('chart') || text.includes('plot') || text.includes('visualization') || text.includes('dataset') || text.includes('database')) {
    return 'Data & Analytics';
  }
  if (text.includes('marketing') || text.includes('social') || text.includes('tweet') || text.includes('instagram') || text.includes('seo') || text.includes('ad ') || text.includes('copywriting') || text.includes('campaign')) {
    return 'Marketing & Social';
  }
  if (text.includes('education') || text.includes('learn') || text.includes('teach') || text.includes('tutor') || text.includes('school') || text.includes('math') || text.includes('history') || text.includes('science') || text.includes('chemistry') || text.includes('physics') || text.includes('curriculum')) {
    return 'Education & Learning';
  }
  if (text.includes('career') || text.includes('business') || text.includes('interview') || text.includes('resume') || text.includes('recruiter') || text.includes('startup') || text.includes('hr ') || text.includes('consultant') || text.includes('accounting') || text.includes('manager')) {
    return 'Business & Career';
  }
  if (text.includes('sales') || text.includes('sell') || text.includes('deal') || text.includes('lead') || text.includes('e-commerce') || text.includes('pricing')) {
    return 'Sales & Business';
  }
  if (text.includes('health') || text.includes('wellness') || text.includes('doctor') || text.includes('medicine') || text.includes('mental') || text.includes('fitness') || text.includes('diet') || text.includes('nutrition') || text.includes('therapy') || text.includes('workout')) {
    return 'Health & Wellness';
  }
  if (text.includes('document') || text.includes('manual') || text.includes('wiki') || text.includes('guide') || text.includes('readme') || text.includes('api reference') || text.includes('specification')) {
    return 'Documentation';
  }
  if (text.includes('research') || text.includes('analyze') || text.includes('investigate') || text.includes('paper') || text.includes('summary') || text.includes('academic') || text.includes('survey')) {
    return 'Research & Analysis';
  }
  if (text.includes('automation') || text.includes('n8n') || text.includes('zapier') || text.includes('workflow') || text.includes('cron') || text.includes('script') || text.includes('agent') || text.includes('bot ')) {
    return 'AI & Automation';
  }
  if (text.includes('product') || text.includes('strategy') || text.includes('roadmap') || text.includes('okr') || text.includes('kpi') || text.includes('feature') || text.includes('competitor')) {
    return 'Product & Strategy';
  }
  if (text.includes('game') || text.includes('fun') || text.includes('joke') || text.includes('riddle') || text.includes('quiz') || text.includes('play') || text.includes('chess') || text.includes('story') || text.includes('movie') || text.includes('song') || text.includes('lyrics')) {
    return 'Games & Fun';
  }
  if (text.includes('philosophy') || text.includes('humanities') || text.includes('history') || text.includes('ethical') || text.includes('morals') || text.includes('culture') || text.includes('art history')) {
    return 'Philosophy & Humanities';
  }
  if (text.includes('travel') || text.includes('place') || text.includes('hotel') || text.includes('destination') || text.includes('flight') || text.includes('tourist') || text.includes('map')) {
    return 'Travel & Places';
  }
  if (text.includes('food') || text.includes('recipe') || text.includes('chef') || text.includes('cook') || text.includes('kitchen') || text.includes('ingredient') || text.includes('menu')) {
    return 'Food & Recipes';
  }
  if (text.includes('write') || text.includes('content') || text.includes('essay') || text.includes('novel') || text.includes('poem') || text.includes('blog') || text.includes('grammar') || text.includes('spelling') || text.includes('translation') || text.includes('translator') || text.includes('editor')) {
    return 'Writing & Content';
  }
  
  return 'General';
}

// Utility to make HTTPS requests
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    };
    https.get(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Failed to fetch ${url}: Status code ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Parse CSV simple parser (since we cannot import external CSV parser packages easily)
function parseSimpleCSV(csvText) {
  const records = [];
  const lines = csvText.split(/\r?\n/);
  // Header row is act,prompt (and sometimes source, etc.)
  const header = lines[0].split(',');
  
  // Quick regex to parse CSV rows supporting quoted strings and newlines
  // A simpler way: split by commas but respect quotes
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple state machine or split by regex
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 2) continue;
    
    let act = matches[0].replace(/^"|"$/g, '').trim();
    let prompt = matches[1].replace(/^"|"$/g, '').trim();
    records.push({ act, prompt });
  }
  return records;
}

// Batch requests to prevent rate limiting
async function fetchInBatches(urls, batchSize = 30) {
  const results = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`  Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)}...`);
    const batchPromises = batch.map(url => fetchUrl(url).catch(err => {
      console.warn(`  Warning: Failed to fetch ${url}:`, err.message);
      return null;
    }));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(Boolean));
  }
  return results;
}

async function run() {
  const repoRoot = path.resolve(__dirname, '..');
  const dataDir = path.join(repoRoot, 'data');
  const jsonPath = path.join(dataDir, 'prompts.json');
  
  // 1. Read existing prompts
  let currentPrompts = [];
  if (fs.existsSync(jsonPath)) {
    currentPrompts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`Loaded ${currentPrompts.length} existing prompts.`);
  } else {
    console.warn(`No existing prompts found at ${jsonPath}`);
  }

  // De-duplication structures
  const uniquePrompts = new Set();
  const uniqueActs = new Set();
  const mergedList = [];

  // Add existing prompts to de-duplication pool
  currentPrompts.forEach(p => {
    const cleanedText = p.prompt.trim().toLowerCase().slice(0, 100);
    const cleanedAct = p.act.trim().toLowerCase();
    uniquePrompts.add(cleanedText);
    uniqueActs.add(cleanedAct);
    mergedList.push({
      Act: p.act,
      Category: p.category,
      Prompt: p.prompt,
      Source: p.source
    });
  });

  console.log('--- Fetching External Datasets ---');

  // Source A: prompts.chat (f/prompts.chat)
  try {
    console.log('Downloading prompts.chat CSV...');
    const csvContent = await fetchUrl('https://raw.githubusercontent.com/f/prompts.chat/main/prompts.csv');
    // Parse CSV line by line
    let addedCount = 0;
    const csvLines = csvContent.split('\n');
    csvLines.forEach(line => {
      // Basic split of "Act","Prompt"
      const match = line.match(/^"([^"]+)","(.+)"$/);
      if (match) {
        const act = match[1].replace(/""/g, '"').trim();
        const prompt = match[2].replace(/""/g, '"').replace(/\\n/g, '\n').trim();
        
        const cleanedText = prompt.toLowerCase().slice(0, 100);
        const cleanedAct = act.toLowerCase();
        
        if (!uniquePrompts.has(cleanedText) && !uniqueActs.has(cleanedAct)) {
          uniquePrompts.add(cleanedText);
          uniqueActs.add(cleanedAct);
          mergedList.push({
            Act: act,
            Category: classify(act, prompt),
            Prompt: prompt,
            Source: 'prompts.chat'
          });
          addedCount++;
        }
      }
    });
    console.log(`  Added ${addedCount} new prompts from prompts.chat`);
  } catch (err) {
    console.error('Failed to retrieve prompts.chat:', err.message);
  }

  // Source B: c3ng4v3r/awesome-chatgpt-prompts
  try {
    console.log('Downloading c3ng4v3r prompts CSV...');
    const csvContent = await fetchUrl('https://raw.githubusercontent.com/c3ng4v3r/awesome-chatgpt-prompts/main/prompts.csv');
    let addedCount = 0;
    const csvLines = csvContent.split('\n');
    csvLines.forEach(line => {
      const match = line.match(/^"([^"]+)","(.+)"/);
      if (match) {
        const act = match[1].replace(/""/g, '"').trim();
        const prompt = match[2].replace(/""/g, '"').replace(/\\n/g, '\n').trim();
        
        const cleanedText = prompt.toLowerCase().slice(0, 100);
        const cleanedAct = act.toLowerCase();
        
        if (!uniquePrompts.has(cleanedText) && !uniqueActs.has(cleanedAct)) {
          uniquePrompts.add(cleanedText);
          uniqueActs.add(cleanedAct);
          mergedList.push({
            Act: act,
            Category: classify(act, prompt),
            Prompt: prompt,
            Source: 'c3ng4v3r'
          });
          addedCount++;
        }
      }
    });
    console.log(`  Added ${addedCount} new prompts from c3ng4v3r`);
  } catch (err) {
    console.error('Failed to retrieve c3ng4v3r prompts:', err.message);
  }

  // Source C: danielrosehill/System-Prompt-Library JSON list
  try {
    console.log('Fetching files list from danielrosehill/System-Prompt-Library...');
    const listJson = await fetchUrl('https://api.github.com/repos/danielrosehill/System-Prompt-Library/contents/system-prompts/json');
    const files = JSON.parse(listJson);
    console.log(`Found ${files.length} system prompts in danielrosehill library.`);
    
    // We will fetch up to 800 prompts to avoid exceeding limits or being too slow
    const filesToFetch = files.slice(0, 800);
    const downloadUrls = filesToFetch.map(f => f.download_url);
    
    console.log(`Downloading ${filesToFetch.length} files in batches...`);
    const contents = await fetchInBatches(downloadUrls, 40);
    
    let addedCount = 0;
    contents.forEach(jsonStr => {
      try {
        const item = JSON.parse(jsonStr);
        const act = item.agent_name || item.agentName || 'System Agent';
        const prompt = item['System Prompt'] || item.systemPrompt || '';
        
        if (!prompt) return;
        
        const cleanedText = prompt.toLowerCase().slice(0, 100);
        const cleanedAct = act.toLowerCase();
        
        if (!uniquePrompts.has(cleanedText) && !uniqueActs.has(cleanedAct)) {
          uniquePrompts.add(cleanedText);
          uniqueActs.add(cleanedAct);
          mergedList.push({
            Act: act,
            Category: classify(act, prompt),
            Prompt: prompt,
            Source: 'danielrosehill'
          });
          addedCount++;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });
    console.log(`  Added ${addedCount} new prompts from danielrosehill/System-Prompt-Library`);
  } catch (err) {
    console.error('Failed to retrieve danielrosehill repository contents:', err.message);
  }

  console.log(`--- Merge Complete: Total Combined Prompts = ${mergedList.length} ---`);

  // Write out the big XLSX file
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(mergedList);
  XLSX.utils.book_append_sheet(wb, ws, 'Prompts');
  
  const outXlsxPath = path.join(dataDir, 'consolidated_prompts.xlsx');
  XLSX.writeFile(wb, outXlsxPath);
  console.log(`Successfully wrote Consolidated Excel Sheet to: ${outXlsxPath}`);
  
  // Also write a helper CSV file for direct copy-paste import into Google Sheets
  const csvHeaders = ['Act', 'Category', 'Prompt', 'Source'];
  const escapeCsvField = (val) => {
    const s = String(val || '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const csvLines = [
    csvHeaders.join(','),
    ...mergedList.map(item => 
      [item.Act, item.Category, item.Prompt, item.Source].map(escapeCsvField).join(',')
    )
  ];
  const outCsvPath = path.join(dataDir, 'consolidated_prompts.csv');
  fs.writeFileSync(outCsvPath, csvLines.join('\n'), 'utf8');
  console.log(`Successfully wrote Consolidated CSV to: ${outCsvPath}`);
}

run();
