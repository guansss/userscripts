import { SimpleMutationObserver } from '../../@common/dom';
import { onInvalidate } from '../../@common/hmr';
import { alive, until as until } from '../../@common/timer';
import { markAbove, register, unregister } from '../scheme';
import { isInIframe } from '../utils';

const panelHeight = 250;
const barHeight = panelHeight - 40;
const trackHeight = barHeight - 12;
const originalTrackHeight = 48;

register({
    url: 'live.bilibili.com',
    css: `
        .volume .volume-control {
            height: ${panelHeight}px !important;
        }`,
});

register({
    url: 'www.bilibili.com/video',
    condition: !isInIframe,
    css: `
        .bilibili-player-video-volumebar-wrp {
            height: ${panelHeight}px !important;
        }
        .bilibili-player-video-volumebar {
            height: ${barHeight}px !important;
        }`,
    async run() {
        const volumeThumb = await alive(
            until(() => document.querySelector<HTMLElement>('.bilibili-player-video-volumebar-wrp .bui-thumb'), 700)
        );

        let currentStyle = '';

        const transformRule = 'transform: translateY($px);';
        const numberCaptureRegex = /(-?\d+?\.?\d+?)/;
        const transformRuleRegex = new RegExp(
            transformRule.replace(/[()]/g, '\\$&').replace('$', numberCaptureRegex.source)
        );

        const observer = new SimpleMutationObserver(() => {
            const newStyle = volumeThumb.style.cssText;

            // compare the two styles to prevent the assignment from being observed,
            // which will cause a infinite loop
            if (currentStyle !== newStyle) {
                const match = transformRuleRegex.exec(newStyle);

                if (match) {
                    let translateY = Number(match[1]);

                    if (!isNaN(translateY)) {
                        translateY = ~~(translateY * (trackHeight / originalTrackHeight) * 100) / 100;

                        currentStyle =
                            newStyle.slice(0, match.index) +
                            transformRule.replace('$', String(translateY)) +
                            newStyle.slice(match.index + match[0]!.length);

                        volumeThumb.style.cssText = currentStyle;
                    }
                }
            }
        });
        observer.observe(volumeThumb, { attributes: true, attributeFilter: ['style'] });

        if (__DEV__) {
            onInvalidate(() => observer.disconnect());
        }
    },
});

if (__DEV__) {
    markAbove(__MODULE_ID__);
    __ON_RELOAD__(() => unregister(__MODULE_ID__));
}
