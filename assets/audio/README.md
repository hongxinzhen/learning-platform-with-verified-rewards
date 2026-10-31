# 本地音效与许可

本目录使用以下免费开放音效，均为 CC0 1.0（Public Domain Dedication），允许修改及商业使用。未使用炉石传说的音频或美术资源。

- Kenney — Interface Sounds：https://kenney.nl/assets/interface-sounds 。按钮、返回、进入页面、翻页、确认、解锁、奖励显现、投喂、提示来自此音效包；原始许可全文见 Kenney-CC0.txt。
- Listener — Win sound effect：https://opengameart.org/content/win-sound-effect 。原作者在作品页声明 CC0 / public domain；用于升级、成就庆祝。下载原文件名 Win sound.wav。
- CC0 1.0：https://creativecommons.org/publicdomain/zero/1.0/ 。CC0 不提供担保。

为兼容浏览器，选中的文件转换为单声道 44.1kHz PCM WAV；未添加音乐循环。原始下载包与文件保存在 source/，不通过体验服务器公开。manifest.json 记录来源、时长、字节数和 SHA-256。

首次点击后才能播放，遵循浏览器音频规则。开发者面板可以开关、调节音量并逐项试听；播放老师语音前会停止游戏提示音。动画关闭和减少动态效果设置不会阻止领取奖励。

## 音效选样室（2026-10-24）

sound-audition.html提供8个场景、24个可直接播放候选。新增Kenney UI Audio（https://kenney.nl/assets/ui-audio）与Music Jingles（https://kenney.nl/assets/music-jingles），官方均标为CC0。许可原文分别保存在Kenney-ui-CC0.txt和Kenney-jingles-CC0.txt。原始包在source/ui与source/jingles。

候选名、原始文件、时长与SHA-256见audition-candidates.json；候选转为单声道44.1kHz PCM WAV，并使用FFmpeg loudnorm统一目标响度（I=-20 LUFS、TP=-2 dBTP、LRA=7），实际短音听感仍由用户比较。候选尚未接入应用；选样使用独立存储键moya-sound-audition-v1，不改变学习档案。
