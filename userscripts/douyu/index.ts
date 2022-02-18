import { ready } from '../@common/events';

ready.then(() => {
    document.addEventListener('mouseleave', onLeave);
});

function onLeave(e: MouseEvent) {
    if (e.target === document) {
        const stuckComment = document.getElementById('comment-higher-container')?.firstElementChild;

        if (stuckComment) {
            document.dispatchEvent(new MouseEvent('mousemove'));
        }
    }
}

if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.on('vite:beforeUpdate', () => {
        document.removeEventListener('mouseleave', onLeave);
    });
}
