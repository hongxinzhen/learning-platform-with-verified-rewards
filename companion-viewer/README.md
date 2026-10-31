# 墨芽伙伴查看器：对应源码与构建

统一查看器含Jelly Baby GPLv3代码，因此组合查看器以GPL-3.0-only分发。独立模型保持各自CC BY/CC0许可，详见credits.html和原始资产目录。

构建（Node.js 24）：
1. 在vendor/jelly-mobile执行npm ci（Three.js及Vite来自此锁文件）。
2. 在companion-viewer执行npm ci（three.quarks）。
3. 在项目根执行npm run build:fox；道具查看器执行npm run build --prefix item-viewer。
4. npm start，本地打开http://localhost:4173/。不需要云服务。

源码包含companion-viewer/source、item-viewer/source、pet-platform-config.js、所引用原始GLB和Jelly源码/模型数据。原始资产的署名、来源、hash与许可均保留。构建产物在各viewer/assets。完整源包不包含node_modules、学校数据库、账号或上传照片。

新增机器人三种外形共用原资源、各自独立骨架；沙皮狗有走动、坐下、休息原生动画；黑豹为静态待机展示。浮岛为装饰背景，行走范围当前限定在小平台，不是完整世界导航。动作播放不产生学习奖励。
