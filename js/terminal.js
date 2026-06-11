// terminal.js -- 80x24 character-cell terminal rendered to an offscreen canvas
function Terminal(cols, rows) {
  this.cols = cols; this.rows = rows;
  this.cw = 10; this.ch = 20;
  this.phosphor = 'amber';
  this.canvas = document.createElement('canvas');
  this.canvas.width = cols * this.cw;
  this.canvas.height = rows * this.ch;
  this.ctx = this.canvas.getContext('2d');
  this.cells = new Array(cols * rows);
  this.clear();
}

Terminal.PALETTES = {
  amber: { full: '#ffb000', dim: '#8a5e00' },
  green: { full: '#33ff33', dim: '#1c8a1c' },
  white: { full: '#e8e8f2', dim: '#73737e' }
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

Terminal.prototype.cyclePhosphor = function () {
  var ks = Object.keys(Terminal.PALETTES);
  this.phosphor = ks[(ks.indexOf(this.phosphor) + 1) % ks.length];
};

Terminal.prototype.render = function () {
  var ctx = this.ctx, pal = Terminal.PALETTES[this.phosphor];
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  ctx.font = '20px "VT323", "Courier New", monospace';
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
        ctx.fillStyle = '#000000';
      } else {
        ctx.fillStyle = col;
      }
      if (c.ch && c.ch !== ' ') ctx.fillText(c.ch, px + this.cw / 2, py + this.ch / 2 + 1);
    }
  }
};
