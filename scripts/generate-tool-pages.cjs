const fs = require('fs');
const data = require('../data/toolkit.json');

for (const item of data.items) {
  const frontMatter = [
    '---',
    `title: ${JSON.stringify(item.title)}`,
    `description: ${JSON.stringify(item.desc)}`,
    'layout: toolkit-single',
    `tool_id: ${JSON.stringify(item.id)}`,
    '---',
    ''
  ].join('\n');
  fs.writeFileSync(`content/tools/${item.id}.md`, frontMatter, 'utf8');
}

console.log(`generated ${data.items.length} tool pages`);
