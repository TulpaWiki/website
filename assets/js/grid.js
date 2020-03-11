(function() {
  function observeGrid(gridNode) {
    if ('ResizeObserver' in window) {
      const min = getComputedStyle(gridNode).getPropertyValue("--minimum");
      const test = document.createElement('div');
      test.style.width = min;
      gridNode.appendChild(test);
      const minToPixels = test.offsetWidth;
      gridNode.removeChild(test);

      const ro = new ResizeObserver(entries => {
        for (let entry of entries) {
          const cr = entry.contentRect;
          const isWide = cr.width > minToPixels;
          gridNode.classList.toggle('grid_above-minimum', isWide);
        }
      });

      ro.observe(gridNode);
    }
  }

  if ('ResizeObserver' in window && !CSS.supports('width', `min(15rem, 100%)`)) {
    const grids = Array.from(document.querySelectorAll('.js-grid'));
    grids.forEach(grid => observeGrid(grid));
  }
})();
