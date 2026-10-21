# J3 · 保安组长

和《怪谈出勤》（괴담출근）里的保安组长 **J3** 聊天。纯静态前端，没有后端、没有数据库、没有构建步骤——`index.html` 打开就能用。

> 「……进来吧。」

**在线版**：https://charlotte-night.github.io/j3-chat/

## 它是什么

把一个人物视角 Skill 蒸馏成网页：7 个判断方式（班次伦理 / 带宽有限 / 吞下去 / 先嗅真假 / 吓比杀便宜 / 用故事自己的规则削自己 / 门开了也不一定要走）、10 条判断规则、一套表达 DNA。系统提示词在 [`prompt/j3-system.md`](prompt/j3-system.md)，页面里用 `scripts/build-prompt.mjs` 编译成 `assets/prompt.js`——改人设只改那一个 markdown 文件。

他不会：打鸡血、给三步法、说「我理解你」、把创伤讲成感人故事、卖萌。他会：说「就那么回事」、让你去做一件今天能做完的小事、护短但不说出口。

## 怎么跑

```bash
# 任意静态服务器都行；直接双击 index.html 也可以
python -m http.server 8080
# 打开 http://localhost:8080
```

点右上「设置」，填一个 API Key（默认 DeepSeek，也可以换 OpenAI / OpenRouter / 任意 OpenAI 兼容端点）。

## 关于密钥

- 请求由**你的浏览器直接**发给模型服务商，本站不经过任何中转、不收集任何数据。
- Key 存在 `localStorage`，只在你这台机器上。但它不是加密的——公用电脑用完点「清除密钥」。
- 没填 Key 时是示例模式：页面只回一句固定的话，不联网。
- 服务商必须允许浏览器直连（CORS）。DeepSeek / OpenAI / OpenRouter 都可以；自建的如果不行，套个允许跨域的代理。

## 关于角色

- 这是**虚构角色**的视角模拟，不是真人观点，也不是心理工具。
- 台词来自二手考据站（namu wiki）的转录，未核对官方原文；作品无正版中文，页面里的中文均为试译。角色页见 [SKILL.md](SKILL.md)。
- 原作未完结（第 3 部休载中），信息截止 2026-10。
- 涉及自伤、暴力、医疗、法律时，页面里会先退出角色、给现实出口。
- 不做恋爱向扮演。正典里这条线最远只到「辞职了也偶尔见一面吧」＋目送。

## 目录

```
index.html            页面
assets/style.css      样式
assets/app.js         聊天逻辑（流式、存储、报错）
assets/prompt.js      编译产物（window.J3_SYSTEM_PROMPT）
prompt/j3-system.md   系统提示词源文件
scripts/build-prompt.mjs
SKILL.md              完整的人物 Skill（含调研与诚实边界）
```

## 部署

GitHub Pages：仓库 Settings → Pages → Source 选 `main` 分支 `/ (root)`，保存即可。

## 许可

代码 MIT。角色、作品与世界观归原作者 백덕수 及出版方所有；本页是非官方同人性质的演示。
