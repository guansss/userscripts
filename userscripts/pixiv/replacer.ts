import { log } from '../@common/log';
import { until } from '../@common/timer';

const button = $('<button style="font-size: 12px">').text('Replace').on('click', run);
const input = $('<textarea style="font-size: 12px">').val(GM_getValue('replacer', 'example=example'));

export function replacer() {
    if (location.href.includes('/novel')) {
        until(() => $('h1').first().parent().append(input, button).length, 200);
    }
}

function run(this: HTMLButtonElement) {
    $(this)
        .closest('main')
        .find('main')
        .find('p span')
        .contents()
        .filter(function () {
            return this.nodeType == 3;
        })
        .each(function () {
            if (this.textContent) {
                this.textContent = replace(this.textContent);
            }
        });
}

function replace(text: string) {
    try {
        const rules = String(input.val());

        rules.split('\n').forEach((line) => {
            const [pattern, replacement] = line.split('=');

            if (!pattern || !replacement) {
                return;
            }

            const regex = new RegExp(pattern, 'gi');

            text = text.replace(regex, replacement);
        });

        GM_setValue('replacer', rules);
    } catch (e) {
        log(e);
        alert((e as Error)?.message || 'Unknown error');
    }

    return text;
}

if (__DEV__) {
    __ON_RELOAD__(() => {
        button.remove();
        input.remove();
    });
}
