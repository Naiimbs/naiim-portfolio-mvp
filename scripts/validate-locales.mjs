import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localeCodes = ['en', 'fr', 'ar'];
const failures = [];

function scanDuplicateKeys(source, file) {
  let index = 0;
  const duplicates = [];
  const skipWhitespace = () => { while (/\s/.test(source[index] || '')) index += 1; };
  const parseString = () => {
    const start = index;
    if (source[index] !== '"') throw new Error(`Expected string at byte ${index}`);
    index += 1;
    while (index < source.length) {
      if (source[index] === '\\') { index += 2; continue; }
      if (source[index] === '"') { index += 1; return JSON.parse(source.slice(start, index)); }
      index += 1;
    }
    throw new Error(`Unterminated string at byte ${start}`);
  };
  const parseValue = (pointer) => {
    skipWhitespace();
    const char = source[index];
    if (char === '{') {
      index += 1;
      const seen = new Set();
      skipWhitespace();
      if (source[index] === '}') { index += 1; return; }
      while (index < source.length) {
        skipWhitespace();
        const key = parseString();
        const child = `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;
        if (seen.has(key)) duplicates.push(child);
        seen.add(key);
        skipWhitespace();
        if (source[index++] !== ':') throw new Error(`Expected ':' at byte ${index - 1}`);
        parseValue(child);
        skipWhitespace();
        const delimiter = source[index++];
        if (delimiter === '}') return;
        if (delimiter !== ',') throw new Error(`Expected ',' or '}' at byte ${index - 1}`);
      }
      throw new Error(`Unterminated object at ${pointer || '/'}`);
    }
    if (char === '[') {
      index += 1;
      skipWhitespace();
      if (source[index] === ']') { index += 1; return; }
      while (index < source.length) {
        parseValue(`${pointer}/*`);
        skipWhitespace();
        const delimiter = source[index++];
        if (delimiter === ']') return;
        if (delimiter !== ',') throw new Error(`Expected ',' or ']' at byte ${index - 1}`);
      }
      throw new Error(`Unterminated array at ${pointer || '/'}`);
    }
    if (char === '"') { parseString(); return; }
    const rest = source.slice(index);
    const literal = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(rest);
    if (!literal) throw new Error(`Invalid JSON value at byte ${index}`);
    index += literal[0].length;
  };

  parseValue('');
  skipWhitespace();
  if (index !== source.length) throw new Error(`Unexpected trailing content at byte ${index}`);
  return duplicates;
}

function keyPaths(value, pointer = '') {
  const paths = new Set();
  if (Array.isArray(value)) {
    for (const item of value) for (const entry of keyPaths(item, `${pointer}/*`)) paths.add(entry);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${pointer}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`;
      paths.add(childPath);
      for (const entry of keyPaths(child, childPath)) paths.add(entry);
    }
  }
  return paths;
}

const locales = {};
for (const code of localeCodes) {
  const file = path.join(root, 'src/i18n/locales', code, 'common.json');
  try {
    const source = fs.readFileSync(file, 'utf8');
    const duplicatePaths = scanDuplicateKeys(source, file);
    if (duplicatePaths.length) {
      failures.push(`${code}: duplicate JSON keys: ${duplicatePaths.join(', ')}`);
    }
    locales[code] = JSON.parse(source);
    console.log(`PASS ${code}: valid JSON${duplicatePaths.length ? '' : ', no duplicate keys'}`);
  } catch (error) {
    failures.push(`${code}: ${error.message}`);
    console.error(`FAIL ${code}: ${error.message}`);
  }
}

if (locales.en && locales.fr && locales.ar) {
  const englishPaths = keyPaths(locales.en);
  for (const code of ['fr', 'ar']) {
    const localizedPaths = keyPaths(locales[code]);
    const missing = [...englishPaths].filter((entry) => !localizedPaths.has(entry));
    if (missing.length) failures.push(`${code}: missing ${missing.length} English key path(s): ${missing.slice(0, 25).join(', ')}`);
    else console.log(`PASS ${code}: all English key paths are present`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exitCode = 1;
} else {
  console.log('PASS EN/FR/AR locale validation');
}
