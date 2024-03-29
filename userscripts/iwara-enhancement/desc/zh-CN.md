- 夜间模式
- 在 2K 以上分辨率的屏幕上显示更大的内容区域
- 在视频进度条上显示缩略图
- 在点击下载按钮时，自动下载最高分辨率并设置一个合适的文件名
- 使用新版本的视频播放器（5.6.0 -> 7.10.1)，一个显著的变化是可以通过双击来切换全屏
- 永久保存音量设置，避免每次从无痕模式访问时都要重新调整音量
- 在内容列表上显示喜爱率，并高亮显示喜爱率超过4%的内容
- 将下载页面里的图片标题转换为链接
- 优化预览图加载失败时的显示方式
- 支持 Tampermonkey 和 Violentmonkey

**注意，用户脚本的设置在退出无痕模式时会丢失，所以如果要永久保存的话，需要在非无痕模式下更改设置**

如果使用的是 Tampermonkey，就可以利用到浏览器自带的下载管理器，意味着不用等到下载完成才能关掉页面，为了实现这一点，需要按照如下设置：

1. 进入 Tampermonkey 的设置面板，选择**设置**标签页
2. 在**通用**里，设置**配置模式**为 `高级`（或者 `初学者`）
3. 在**下载 BETA**里，设置**下载模式**为 `浏览器 API`
4. 如果请求权限的话，选择同意
