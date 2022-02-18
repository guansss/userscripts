import './features/ensure-logger';
import '../@common/jquery';
import './components/Settings';
import './features/hide-list-options';
import './index.css';
import './features/process-teasers';
import { setupPaging } from './core/paging';
import { exit } from '../@common/hmr';

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
