import { SimpleMutationObserver } from '../@common/dom';
import { onInvalidate } from '../@common/hmr';
import { until } from '../@common/timer';
import html from './image-viewer.html?raw';

export async function imageViewer() {
    console.log('imageViewer');

    const gallery = await until(
        () => document.getElementsByTagName('gradio-app')[0]?.shadowRoot?.getElementById('txt2img_gallery'),
        200
    );

    const childWindow = window.open('about:blank', 'sd-image-viewer', 'width=800,height=600');

    if (!childWindow) {
        throw new Error('Could not open child window');
    }

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
    imgObserver.observe(gallery, {
        attributes: true,
        attributeFilter: ['src'],
        subtree: true,
        immediate: true,
    });

    if (__DEV__) {
        onInvalidate(() => {
            imgObserver.disconnect();
        });
    }
}
