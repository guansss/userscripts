import { SimpleMutationObserver } from '../@common/dom';
import { onInvalidate } from '../@common/hmr';
import { log } from '../@common/log';
import { until } from '../@common/timer';
import html from './image-viewer.html?raw';

export async function imageViewer($root: JQuery<ShadowRoot>) {
    const gallery = await until(() => $root.find('#txt2img_gallery')[0], 200);
    const modal = await until(() => $root.find('#lightboxModal')[0], 200);

    const childWindow = window.open('about:blank', 'sd-image-viewer', 'width=800,height=600');

    if (!childWindow) {
        throw new Error('Failed to open child window.');
    }

    log('Connected to child window', childWindow);

    childWindow.document.open();
    childWindow.document.write(html);
    childWindow.document.close();

    const imgObserver = new SimpleMutationObserver((mutation) => {
        const img = mutation.target as HTMLImageElement | undefined;

        if (img && img.tagName === 'IMG' && img.src.includes('/file=')) {
            const childImg = childWindow.document.getElementsByTagName('img')[0] as HTMLImageElement | undefined;

            if (childImg) {
                childImg.style.display = 'block';
                childImg.src = img.src;
            }

            return true;
        }
    });

    const options = {
        attributes: true,
        attributeFilter: ['src'],
        subtree: true,
        immediate: true,
    };
    imgObserver.observe(gallery, options);
    imgObserver.observe(modal, options);

    if (__DEV__) {
        onInvalidate(() => {
            imgObserver.disconnect();
        });
    }
}
