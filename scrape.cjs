const https = require('https');
const fs = require('fs');

https.get('https://cses.fi/problemset/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const problems = {};
    const h2Regex = /<h2>(.*?)<\/h2>[\s\S]*?<ul class=\"task-list\">([\s\S]*?)<\/ul>/g;
    let match;
    while ((match = h2Regex.exec(data)) !== null) {
      const category = match[1].trim();
      const listHtml = match[2];
      const liRegex = /<li class=\"task\">.*?<a href=\"\/problemset\/task\/(\d+)\">(.*?)<\/a>/g;
      let liMatch;
      while ((liMatch = liRegex.exec(listHtml)) !== null) {
        const id = liMatch[1];
        const title = liMatch[2].trim();
        problems[id] = { title, category };
      }
    }
    fs.writeFileSync('src/data/cses-problems.json', JSON.stringify(problems, null, 2));
    console.log('Saved ' + Object.keys(problems).length + ' problems');
  });
});
