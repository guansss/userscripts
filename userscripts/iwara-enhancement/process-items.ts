import { ref, watchEffect } from 'vue';
import { hasClass, SimpleMutationObserver } from '../../utils/dom';
import { log } from '../../utils/log';
import { throttle } from '../../utils/timer';
import { page, unpage } from './paging';
import { storage } from './store';

const likeRateEnabled = ref(storage.get('like_rates'));
const highlightThreshold = ref(storage.get('like_rate_highlight'));

const likeRateClass = 'enh-like-rate';

export function useItemSettings() {
    watchEffect(() => {
        storage.set('like_rates', likeRateEnabled.value);

        if (likeRateEnabled.value) {
            document.body.classList.add('enh-show-like-rates');
        } else {
            document.body.classList.remove('enh-show-like-rates');
        }
    });

    watchEffect(() => {
        storage.set('like_rate_highlight', highlightThreshold.value);

        $('.page-videoList__item, .page-imageList__item').each((i, item) => setupLikeRate(item));
    });

    return {
        likeRateEnabled: likeRateEnabled,
        highlightThreshold,
    };
}

page(['videoList', 'imageList'], 'process_items', async (pageID, onLeave) => {
    const listContainer = $(`.page-${pageID}>.content .col-12.order-lg-1:first-of-type`).get(0);

    if (!listContainer) {
        log('Could not find list container.');
        return;
    }

    const itemClassName = `page-${pageID}__item`;

    const listObserver = new SimpleMutationObserver((mutation) => {
        mutation.addedNodes.forEach((node) => hasClass(node, itemClassName) && itemAdded(node));
    });

    const deferredItems: HTMLElement[] = [];

    function itemAdded(item: HTMLElement) {
        deferredItems.push(item);
        setupLikeRates();
    }

    const setupLikeRates = throttle(() => {
        let lastError: any;

        try {
            deferredItems.forEach(setupLikeRate);
        } catch (e) {
            // only record the last error so the console won't blow up
            lastError = e;
        }

        if (lastError) {
            log('Failed to process items', lastError);
        }

        deferredItems.length = 0;
    }, 0);

    const rowsObserver = observeRows(listContainer, (row: HTMLElement) => {
        // treat all items as added since the entire row is added
        Array.prototype.forEach.call(row.children, (node) => hasClass(node, itemClassName) && itemAdded(node));

        listObserver.observe(row, { childList: true });
    });

    onLeave(() => {
        rowsObserver.disconnect();
        listObserver.disconnect();

        if (__DEV__) {
            $('.' + likeRateClass).remove();
        }
    });
});

function observeRows(container: HTMLElement, rowAdded: (row: HTMLElement) => void) {
    const rowsObserver = new SimpleMutationObserver((mutation) => {
        mutation.addedNodes.forEach((node) => hasClass(node, 'row') && rowAdded(node));
    });

    rowsObserver.observe(container, { childList: true });

    // treat all rows as added since because we also need to process existing rows
    Array.prototype.forEach.call(container.children, (node) => hasClass(node, 'row') && rowAdded(node));

    return rowsObserver;
}

function setupLikeRate(item: HTMLElement) {
    const viewsLabel = $(item).find('.views');
    const likesLabel = $(item).find('.likes');

    let likePercentage;

    const likeRateLabel = viewsLabel.children('.' + likeRateClass);

    if (likeRateLabel.length) {
        likePercentage = +likeRateLabel.text().trim().replace('%', '');
    } else {
        let [views, likes] = [viewsLabel, likesLabel].map((icon) => {
            const value = icon.text().trim();

            return value.includes('k') ? +value.slice(0, -1) * 1000 : +value;
        });

        likePercentage = views === 0 ? 0 : Math.round((1000 * likes!) / views!) / 10;

        // prettier-ignore
        viewsLabel.children().eq(0).clone()
            .addClass(likeRateClass)
            .text(likePercentage + '%')
            .appendTo(viewsLabel);
    }

    if (likePercentage >= highlightThreshold.value) {
        item.classList.add('enh-highlight');
    } else {
        item.classList.remove('enh-highlight');
    }
}

if (__DEV__) {
    __ON_RELOAD__(() => {
        unpage('process_items');
    });
}
