import { Storage } from '../../utils/storage';

export const storage = new Storage<{
    version: string;
    lang: string;
    volume: number;
    filename: string;
    dark: boolean;
    like_rates: boolean;
    player_size: number;
    preferred_res: string;
}>();
