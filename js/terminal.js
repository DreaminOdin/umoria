// terminal.js -- 80x24 character-cell terminal rendered to an offscreen canvas.
// Supports dark/light themes, several phosphor colours (incl. per-life purple
// and red) and a scale factor: scale 1 = authentic CRT source resolution,
// scale 2 = crisp high-resolution rendering for the "sharp" display mode.
function Terminal(cols, rows) {
  this.cols = cols; this.rows = rows;
  this.scale = 1;
  this.cw = 10; this.ch = 20;
  this.phosphor = 'amber';
  this.theme = 'dark';
  this.canvas = document.createElement('canvas');
  this.canvas.width = cols * this.cw;
  this.canvas.height = rows * this.ch;
  this.ctx = this.canvas.getContext('2d');
  this.cells = new Array(cols * rows);
  this.clear();
}

Terminal.PALETTES = {
  amber:  { dark: { full: '#ffb000', dim: '#8a5e00' }, light: { full: '#6b4a00', dim: '#b09a66' } },
  green:  { dark: { full: '#33ff33', dim: '#1c8a1c' }, light: { full: '#1d6b1d', dim: '#86b286' } },
  white:  { dark: { full: '#e8e8f2', dim: '#73737e' }, light: { full: '#26262c', dim: '#8c8c96' } },
  purple: { dark: { full: '#c878ff', dim: '#7344a0' }, light: { full: '#5e2a8a', dim: '#a98fc2' } },
  red:    { dark: { full: '#ff5533', dim: '#962d1a' }, light: { full: '#9c1e0e', dim: '#c79288' } }
};
Terminal.BG = { dark: '#000000', light: '#e9e2d0' };
Terminal.CYCLE = ['amber', 'green', 'white'];

Terminal.prototype.setScale = function (n) {
  if (this.scale === n) return;
  this.scale = n;
  this.cw = 10 * n; this.ch = 20 * n;
  this.canvas.width = this.cols * this.cw;
  this.canvas.height = this.rows * this.ch;
};

Terminal.prototype.clear = function () {
  for (var i = 0; i < this.cells.length; i++) this.cells[i] = null;
};

Terminal.prototype.put = function (x, y, ch, dim, rev) {
  if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
  this.cells[y * this.cols + x] = { ch: ch, dim: !!dim, rev: !!rev };
};

Terminal.prototype.str = function (x, y, s, dim, rev) {
  for (var i = 0; i < s.length; i++) this.put(x + i, y, s[i], dim, rev);
};

Terminal.prototype.center = function (y, s, dim, rev) {
  this.str(Math.floor((this.cols - s.length) / 2), y, s, dim, rev);
};

Terminal.prototype.render = function () {
  var ctx = this.ctx;
  var pal = (Terminal.PALETTES[this.phosphor] || Terminal.PALETTES.amber)[this.theme] ||
            Terminal.PALETTES.amber.dark;
  var bg = Terminal.BG[this.theme] || '#000000';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.font = (20 * this.scale) + 'px "VT323", "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (var y = 0; y < this.rows; y++) {
    for (var x = 0; x < this.cols; x++) {
      var c = this.cells[y * this.cols + x];
      if (!c) continue;
      if (!c.rev && (!c.ch || c.ch === ' ')) continue;
      var col = c.dim ? pal.dim : pal.full;
      var px = x * this.cw, py = y * this.ch;
      if (c.rev) {
        ctx.fillStyle = col;
        ctx.fillRect(px, py, this.cw, this.ch);
        ctx.fillStyle = bg;
      } else {
        ctx.fillStyle = col;
      }
      if (c.ch && c.ch !== ' ') ctx.fillText(c.ch, px + this.cw / 2, py + this.ch / 2 + this.scale);
    }
  }
};
