import './ensure-logger';
import '../../utils/jquery';
import './components/Settings';
import './hide-list-options';
import './index.css';
import './process-teasers';
import { setupPaging } from './paging';
import { exit } from '../../utils/hmr';

export async function main() {
    document.body.classList.add('enh-body');

    setupPaging();
}

main();

if (import.meta.hot) {
    import.meta.hot.accept();

    // listen for beforeUpdate event instead of using dispose()
    // because vite sometimes mysteriously invokes the dispose hook for multiple times
    import.meta.hot.on('vite:beforeUpdate', () => {
        // call all onExit() hooks
        exit();
    });
}
