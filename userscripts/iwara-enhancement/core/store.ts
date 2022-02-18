import { createStorage } from '../../@common/storage';

export const storage = createStorage<{
    version: string;
    locale: string;
    volume: number;
    auto_down_enabled: boolean;
    preferred_res: 'Source' | '540p' | '360p';
    filename: string;
    dark: boolean;
    like_rates: boolean;
    like_rate_highlight: number;
    player_size: number;
    hide_list_options: boolean;
}>({
    version: GM_info.script.version,
    locale: navigator.language,
    volume: 0.5,
    auto_down_enabled: true,
    preferred_res: 'Source',
    filename: '{DATE} {TITLE} - {AUTHOR} ({ID})',
    dark: false,
    like_rates: true,
    like_rate_highlight: 4,
    player_size: 100,
    hide_list_options: false,
});
