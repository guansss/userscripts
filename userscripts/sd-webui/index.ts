import { ready } from '../@common/events';
import '../@common/jquery';
import { imageViewer } from './image-viewer';

ready.then(main);

function main() {
    if ($('meta[property="og:title"]').attr('content') !== 'Stable Diffusion') {
        return;
    }

    imageViewer();
}

if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.on('vite:beforeUpdate', () => {});
}
