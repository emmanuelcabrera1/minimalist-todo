class GridRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false }); // Optimization: No transparency needed
    this.gap = 2; // px
    this.squareSize = 0; // Calculated dynamically
    this.cols = 52; // Target columns (weeks in a year approx)

    // Colors from CSS (hardcoded for performance/simplicity in canvas)
    this.colorBg = '#000000';
    this.colorLived = '#FFFFFF';
    this.colorFuture = '#222222';

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    // Get parent width
    const parentWidth = this.canvas.parentElement.offsetWidth;

    // Calculate standard high-DPI scaling
    const dpr = window.devicePixelRatio || 1;

    // Calculate square size based on wanting ~52 cols
    // width = (size * cols) + (gap * (cols - 1))
    // size * cols = width - gap*(cols-1)
    // size = (width - gap*(cols-1)) / cols

    const rawSize = (parentWidth - this.gap * (this.cols - 1)) / this.cols;
    this.squareSize = Math.floor(rawSize);

    // Recalculate exact width to fit discrete squares perfectly
    const exactWidth = this.squareSize * this.cols + this.gap * (this.cols - 1);

    // Assume 80 years * 52 weeks = 4160 total squares
    const totalRows = Math.ceil(4160 / this.cols);
    const exactHeight = this.squareSize * totalRows + this.gap * (totalRows - 1);

    // Set display size
    this.canvas.style.width = `${exactWidth}px`;
    this.canvas.style.height = `${exactHeight}px`;

    // Set actual size
    this.canvas.width = exactWidth * dpr;
    this.canvas.height = exactHeight * dpr;

    // Normalize coordinates
    this.ctx.scale(dpr, dpr);

    // Redraw if data exists
    if (this.cachedTotal !== undefined) {
      this.drawGrid(this.cachedTotal, this.cachedLived);
    }
  }

  drawGrid(totalWeeks, livedWeeks) {
    this.cachedTotal = totalWeeks;
    this.cachedLived = livedWeeks;

    // If not resized yet
    if (this.canvas.width === 0) this.resize();

    // Clear
    this.ctx.fillStyle = this.colorBg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw loop
    // We can optimize by batching fillRect calls if we really wanted to,
    // but 4000 rects is trivial for Canvas 2D API (usually <1ms).

    for (let i = 0; i < totalWeeks; i++) {
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);

      const x = col * (this.squareSize + this.gap);
      const y = row * (this.squareSize + this.gap);

      if (i < livedWeeks) {
        this.ctx.fillStyle = this.colorLived;
      } else {
        this.ctx.fillStyle = this.colorFuture;
      }

      this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
    }
  }
}
