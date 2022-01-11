import { setupSettings } from './components/Settings';

import './index.css';

async function main() {
    setupSettings();
}

main();

if (import.meta.hot) {
    import.meta.hot.accept(() => {});
}
