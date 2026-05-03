import './style.css';
import { createGame } from './core/game';
import { bindDisplayAspect } from './render/display';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Missing #app root element');
}

const params = new URLSearchParams(window.location.search);
if (params.get('capture') === '1') {
  document.body.classList.add('capture-mode');
}

app.innerHTML = '<div id="game-root"></div>';

const game = createGame('game-root');

const waitForCanvas = (): void => {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-root canvas');
  if (!canvas) {
    window.requestAnimationFrame(waitForCanvas);
    return;
  }
  bindDisplayAspect(canvas);
};

waitForCanvas();

(void game);
