import { clamp } from './number';

export function formatDate(date: Date, delimiter = '/') {
    return [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
    ]
        .map((num) => String(num).padStart(2, '0'))
        .join(delimiter);
}

export function adjustHexColor(color: string, amount: number) {
    return color.replace(/\w\w/g, (color) =>
        clamp(parseInt(color, 16) + amount, 0, 255)
            .toString(16)
            .padStart(2, '0')
    );
}
