'use strict';

function parseStack(stack) {
  if (!stack) return '';
  
  const lines = stack.split('\n');
  return lines
    .filter(line => !line.includes('node_modules'))
    .filter(line => !line.includes('internal/'))
    .map(line => line.trim())
    .join('\n');
}

function parseTopFrame(stack) {
  if (!stack) return '';
  const lines = stack.split('\n').map(l => l.trim());
  for (const line of lines) {
    if (!line) continue;
    if (line.includes('node_modules')) continue;
    if (line.includes('internal/')) continue;
    // typical stack frame lines start with 'at '
    if (line.startsWith('at ')) return line;
    return line;
  }
  return '';
}

module.exports = { parseStack, parseTopFrame };