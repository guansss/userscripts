export function formatDate(date: Date, delimiter = '/') {
    return [
        date.getFullYear(), date.getMonth() + 1, date.getDate(),
        date.getHours(), date.getMinutes(), date.getSeconds()
    ]
        .map(num => String(num).padStart(2, '0'))
        .join(delimiter);
}
