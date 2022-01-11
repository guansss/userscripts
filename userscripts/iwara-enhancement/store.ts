import { Storage } from '../../utils/storage';

export const storage = new Storage<{
    version: string;
    lang: string;
    volume: number;
    auto_down_enabled: boolean;
    preferred_res: 'Source' | '540p' | '360p';
    filename: string;
    dark: boolean;
    like_rates: boolean;
    player_size: number;
}>();
