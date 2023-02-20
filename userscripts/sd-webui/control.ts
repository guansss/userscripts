import { onInvalidate } from '../@common/hmr';
import { log } from '../@common/log';
import { until } from '../@common/timer';
import { toast, toastWarn } from '../@common/toast';

const KEY_SAVE = 'Enter';

export async function control($root: JQuery<ShadowRoot>) {
    const modal = await until(() => $root.find('#lightboxModal')[0], 200);
    const txt2ImgSaveButton = await until(() => $root.find('#txt2img_images_history_button_panel>button')[0], 200);
    const imgHistorySaveButton = await until(() => $root.find('#save_txt2img')[0], 200);

    function onKeydown(e: KeyboardEvent) {
        if (e.key === KEY_SAVE && isVisible(modal)) {
            const saveButton = [txt2ImgSaveButton, imgHistorySaveButton].find((button) => isVisible(button));

            if (saveButton) {
                log('Pressing save button', saveButton);
                saveButton.click();
                toast('Saved');
            } else {
                toastWarn('Not saved: no save button found.');
            }
        }
    }

    document.addEventListener('keydown', onKeydown, { passive: true });

    if (__DEV__) {
        onInvalidate(() => {
            document.removeEventListener('keydown', onKeydown);
        });
    }
}

function isVisible(element: HTMLElement) {
    let visible = isSelfVisible(element);

    $(element)
        .parents()
        .each((_, el) => {
            // if any ancestor is invisible, the element is invisible
            if (!isSelfVisible(el)) {
                visible = false;
                return false;
            }
        });

    return visible;
}

function isSelfVisible(element: HTMLElement) {
    const styles = window.getComputedStyle(element);

    return !(
        styles.display === 'none' ||
        styles.visibility === 'hidden' ||
        styles.opacity === '0' ||
        styles.pointerEvents === 'none'
    );
}
