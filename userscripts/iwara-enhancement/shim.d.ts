import _videojs from 'video.js';

declare global {
    interface Window {
        videojs: _videojs;
    }
}
