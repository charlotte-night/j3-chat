// 把 prompt/j3-system.md 编译成 assets/prompt.js（浏览器可直接引用的全局变量）
// 用法：node scripts/build-prompt.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'prompt', 'j3-system.md');
const out = join(root, 'assets', 'prompt.js');

const text = readFileSync(src, 'utf8').trim();
const banner = '/* 自动生成，别手改：源文件 prompt/j3-system.md，跑 node scripts/build-prompt.mjs */\n';
writeFileSync(out, banner + 'window.J3_SYSTEM_PROMPT = ' + JSON.stringify(text) + ';\n', 'utf8');
console.log('wrote ' + out + ' (' + text.length + ' chars)');
