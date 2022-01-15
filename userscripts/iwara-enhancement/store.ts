import { createStorage } from '../../utils/storage';

export const storage = createStorage<{
    version: string;
    lang: string;
    volume: number;
    auto_down_enabled: boolean;
    preferred_res: 'Source' | '540p' | '360p';
    filename: string;
    dark: boolean;
    like_rates: boolean;
    player_size: number;
    hide_list_options: boolean;
}>({
    version: GM_info.script.version,
    lang: navigator.language,
    volume: 0.5,
    auto_down_enabled: true,
    preferred_res: 'Source',
    filename: '{DATE} {TITLE} - {AUTHOR} ({ID})',
    dark: false,
    like_rates: true,
    player_size: 100,
    hide_list_options: false,
});
