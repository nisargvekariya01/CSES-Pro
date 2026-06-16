const res = await fetch('https://cses.fi/problemset/list/');
const data = await res.text();
const tasks = (data.match(/<li class="task">/g) || []).length;
const h2s = data.match(/<h2>.*?<\/h2>/g);
console.log('Tasks:', tasks, 'Categories:', h2s);
