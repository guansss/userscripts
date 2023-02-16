import { ready } from '../@common/events';
import '../@common/jquery';
import { replacer } from './replacer';

ready.then(main);

function main() {
    replacer()
}

if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.on('vite:beforeUpdate', () => {});
}
