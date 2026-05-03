const TARGET_ASPECT = 4 / 3;

export function bindDisplayAspect(canvas: HTMLCanvasElement): void {
  const params = new URLSearchParams(window.location.search);
  const captureMode = params.get('capture') === '1';

  const resize = (): void => {
    if (captureMode) {
      // Keep native pixel size in capture mode to avoid interpolation drift in snapshot comparisons.
      canvas.style.width = '256px';
      canvas.style.height = '224px';
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let displayWidth = viewportWidth;
    let displayHeight = Math.floor(viewportWidth / TARGET_ASPECT);

    if (displayHeight > viewportHeight) {
      displayHeight = viewportHeight;
      displayWidth = Math.floor(viewportHeight * TARGET_ASPECT);
    }

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
  };

  window.addEventListener('resize', resize);
  resize();
}
