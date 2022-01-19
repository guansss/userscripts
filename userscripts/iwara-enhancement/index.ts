import 'jquery';
import './components/Settings';
import './hide-list-options';
import './index.css';
import './process-items';

async function main() {
    document.body.classList.add('enh-body');
}

main();

if (import.meta.hot) {
    import.meta.hot.accept(() => {});
}
