import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

function walkDir(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walkDir(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const files = walkDir('src');
const routeOwnership = JSON.parse(fs.readFileSync('server/docs/route-ownership.json', 'utf8'));

// Format server active routes for matching
const activeRoutesMap = new Map();
for (const r of routeOwnership.active) {
  const normPath = r.path.replace(/:[^/]+/g, ':param');
  const key = `${r.method.toUpperCase()} ${normPath}`;
  activeRoutesMap.set(key, r);
}

function extractPathFromNode(node, sourceFile) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text.split('?')[0];
  }
  if (ts.isTemplateExpression(node)) {
    let result = node.head.text;
    for (const span of node.templateSpans) {
      const spanText = span.getText(sourceFile);
      // If the template span is adding query string (starts with `?` or `qs ? ...`)
      if (span.literal.text.startsWith('?') || spanText.includes('?') || spanText.includes('search') || spanText.includes('qs')) {
        // This span starts or adds query params; ignore remainder for pathname
        break;
      }
      result += ':param' + span.literal.text;
    }
    return result.split('?')[0];
  }
  return null;
}

function extractMethodFromOptions(optsNode, sourceFile) {
  if (!optsNode || !ts.isObjectLiteralExpression(optsNode)) return 'GET';
  for (const prop of optsNode.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name.getText(sourceFile).toLowerCase() === 'method') {
      if (ts.isStringLiteral(prop.initializer)) {
        return prop.initializer.text.toUpperCase();
      }
    }
  }
  return 'GET';
}

const endpointInvocations = [];

for (const file of files) {
  const relFile = path.relative('.', file).replace(/\\/g, '/');
  const code = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      let isTarget = false;
      let targetName = '';

      if (ts.isIdentifier(expr) && (expr.text === 'request' || expr.text === 'fetch')) {
        isTarget = true;
        targetName = expr.text;
      }

      if (isTarget && node.arguments.length > 0) {
        // Skip generic wrapper definition inside api.ts itself: fetch(`${BASE_URL}${path}`, ...)
        const firstArgText = node.arguments[0].getText(sourceFile);
        if (firstArgText.includes('${BASE_URL}${path}')) {
          ts.forEachChild(node, visit);
          return;
        }

        const pathStr = extractPathFromNode(node.arguments[0], sourceFile);
        if (pathStr) {
          const method = extractMethodFromOptions(node.arguments[1], sourceFile);
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          endpointInvocations.push({
            file: relFile,
            line,
            call: targetName,
            rawUrl: pathStr,
            method
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

console.log(`Found ${endpointInvocations.length} AST call invocations.`);

const results = [];
for (const call of endpointInvocations) {
  let url = call.rawUrl.split('?')[0];
  let fullPath = url.startsWith('/api') ? url : ('/api' + (url.startsWith('/') ? '' : '/') + url);

  // Normalize path params: UUIDs, numbers, :param
  let normPath = fullPath
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':param')
    .replace(/\/\d+(?=\/|$)/g, '/:param')
    .replace(/\/+/g, '/');

  const key = `${call.method} ${normPath}`;
  const matched = activeRoutesMap.get(key);

  results.push({
    ...call,
    fullPath,
    normPath,
    key,
    hasActiveRoute: !!matched,
    provider: matched ? matched.provider : null
  });
}

const unmatched = results.filter(r => !r.hasActiveRoute);
console.log(`Matched: ${results.length - unmatched.length}, Unmatched: ${unmatched.length}`);

const unmatchedByKey = new Map();
for (const u of unmatched) {
  if (!unmatchedByKey.has(u.key)) {
    unmatchedByKey.set(u.key, []);
  }
  unmatchedByKey.get(u.key).push(`${u.file}:${u.line}`);
}

console.log('\n--- UNMATCHED ENDPOINTS BY KEY ---');
for (const [key, callSites] of [...unmatchedByKey.entries()].sort()) {
  console.log(`[${key}] (${callSites.length} sites):`);
  for (const cs of callSites) {
    console.log(`  - ${cs}`);
  }
}

fs.writeFileSync('server/test/client-endpoint-analysis.json', JSON.stringify({
  total: results.length,
  matchedCount: results.length - unmatched.length,
  unmatchedCount: unmatched.length,
  unmatchedGrouped: Object.fromEntries(unmatchedByKey),
  allResults: results
}, null, 2));
