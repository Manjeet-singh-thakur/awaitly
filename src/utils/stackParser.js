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

module.exports = { parseStack };