import { ref, watchEffect } from 'vue';
import { hasClass, SimpleMutationObserver } from '../../utils/dom';
import { log } from '../../utils/log';
import { throttle } from '../../utils/timer';
import { page, unpage } from './paging';
import { storage } from './store';

const likeRateEnabled = ref(storage.get('like_rates'));
const highlightThreshold = ref(storage.get('like_rate_highlight'));

const likeRateClass = 'enh-like-rate';

export function useTeaserSettings() {
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

        $('.videoTeaser, .imageTeaser').each((i, teaser) => processTeaser(teaser));
    });

    return {
        likeRateEnabled,
        highlightThreshold,
    };
}

page(['home', 'videoList', 'imageList'] as const, 'process_teasers', async (pageID, onLeave) => {
    const rowObserver = new SimpleMutationObserver((mutation) => mutation.addedNodes.forEach(detectRow));
    const teaserObserver = new SimpleMutationObserver((mutation) => mutation.addedNodes.forEach(detectTeaser));

    const teaserBatcher = new TeaserBatcher();

    if (pageID === 'home') {
        const rows = $('.page-start__videos > .row, .page-start__images > .row').filter(function () {
            return this.classList.length === 1;
        });

        if (!rows.length) {
            log('Could not find teaser rows.');
            return;
        }

        rows.each((i, row) => detectRow(row));
    } else {
        const rowContainer = $(`.page-${pageID}>.content .col-12.order-lg-1:first-of-type`).get(0);

        if (!rowContainer) {
            log('Could not find teaser row container.');
            return;
        }

        rowObserver.observe(rowContainer, { childList: true });

        // treat all existing rows as inserted
        Array.prototype.forEach.call(rowContainer.children, detectRow);
    }

    function detectRow(row: Node) {
        if (hasClass(row, 'row')) {
            // treat all existing nodes as inserted since the entire row is inserted
            Array.prototype.forEach.call(row.children, detectTeaser);

            teaserObserver.observe(row, { childList: true });
        }
    }

    function detectTeaser(teaser: Node) {
        if (isTeaser(teaser)) {
            teaserBatcher.add(teaser);
            teaserBatcher.flush(processTeaser);
        }
    }

    onLeave(() => {
        rowObserver.disconnect();
        teaserObserver.disconnect();

        if (__DEV__) {
            $('.' + likeRateClass).remove();
        }
    });
});

class TeaserBatcher {
    teasers: HTMLElement[] = [];

    add(teaser: HTMLElement) {
        this.teasers.push(teaser);
    }

    flush = throttle((callback: (teaser: HTMLElement) => void) => {
        let lastError: any;

        try {
            this.teasers.forEach(callback);
        } catch (e) {
            // only record the last error so the console won't blow up
            lastError = e;
        }

        if (lastError) {
            log('Failed to process teasers', lastError);
        }

        this.teasers.length = 0;
    }, 0);
}

function processTeaser(teaser: HTMLElement) {
    const viewsLabel = $(teaser).find('.views');
    const likesLabel = $(teaser).find('.likes');

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
        teaser.classList.add('enh-highlight');
    } else {
        teaser.classList.remove('enh-highlight');
    }
}

function isTeaser<E extends HTMLElement = HTMLElement>(node: Node): node is E {
    return !!node.firstChild && (hasClass(node.firstChild, 'videoTeaser') || hasClass(node.firstChild, 'imageTeaser'));
}

if (__DEV__) {
    __ON_RELOAD__(() => {
        unpage('process_teasers');
    });
}