// crt.js -- WebGL CRT post-processing: barrel distortion, scanlines, phosphor
// persistence (ghosting trails), glow/bloom, shadow mask, vignette, flicker,
// rolling bar and noise. Falls back to a plain 2D blit if WebGL is missing.
function CRT(canvas, srcCanvas) {
  this.canvas = canvas;
  this.src = srcCanvas;
  this.enabled = true;
  this.gl = canvas.getContext('webgl', { antialias: false, alpha: false }) ||
            canvas.getContext('experimental-webgl', { antialias: false, alpha: false });
  if (!this.gl) {
    this.ctx2d = canvas.getContext('2d');
    return;
  }
  var gl = this.gl;
  this.progAccum = this._program(CRT.VS, CRT.FS_ACCUM);
  this.progScreen = this._program(CRT.VS, CRT.FS_SCREEN);

  this.quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  this.texSrc = this._makeTex(srcCanvas.width, srcCanvas.height);
  this.fbA = this._makeFB(srcCanvas.width, srcCanvas.height);
  this.fbB = this._makeFB(srcCanvas.width, srcCanvas.height);
}

CRT.VS = [
  'attribute vec2 aPos;',
  'varying vec2 vUV;',
  'void main(){ vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
].join('\n');

// Phosphor persistence: keep the brighter of (new frame, decayed old frame).
CRT.FS_ACCUM = [
  'precision mediump float;',
  'varying vec2 vUV;',
  'uniform sampler2D uSrc;',
  'uniform sampler2D uPrev;',
  'uniform float uDecay;',
  'void main(){',
  '  vec3 c = texture2D(uSrc, vUV).rgb;',
  '  vec3 p = texture2D(uPrev, vUV).rgb * uDecay;',
  '  gl_FragColor = vec4(max(c, p), 1.0);',
  '}'
].join('\n');

CRT.FS_SCREEN = [
  'precision mediump float;',
  'varying vec2 vUV;',
  'uniform sampler2D uTex;',
  'uniform float uTime;',
  'uniform vec2 uSrcRes;',
  'uniform float uCrtOn;',
  'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }',
  'vec2 warp(vec2 uv){',
  '  uv = uv * 2.0 - 1.0;',
  '  uv.x *= 1.0 + 0.055 * uv.y * uv.y;',
  '  uv.y *= 1.0 + 0.085 * uv.x * uv.x;',
  '  return uv * 0.5 + 0.5;',
  '}',
  'void main(){',
  '  if (uCrtOn < 0.5) { gl_FragColor = vec4(texture2D(uTex, vUV).rgb, 1.0); return; }',
  '  vec2 uv = warp(vUV);',
  '  vec3 col = vec3(0.0);',
  '  if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {',
  '    vec2 juv = uv;',
  '    juv.x += (hash(vec2(floor(uTime * 60.0), floor(uv.y * uSrcRes.y))) - 0.5) * 0.0007;',
  '    col = texture2D(uTex, juv).rgb;',
  '    vec2 px = 1.0 / uSrcRes;',
  '    vec3 g = vec3(0.0);',
  '    g += texture2D(uTex, juv + vec2( px.x * 1.5, 0.0)).rgb;',
  '    g += texture2D(uTex, juv + vec2(-px.x * 1.5, 0.0)).rgb;',
  '    g += texture2D(uTex, juv + vec2(0.0,  px.y * 1.5)).rgb;',
  '    g += texture2D(uTex, juv + vec2(0.0, -px.y * 1.5)).rgb;',
  '    g += texture2D(uTex, juv + vec2( px.x * 3.0, 0.0)).rgb * 0.5;',
  '    g += texture2D(uTex, juv + vec2(-px.x * 3.0, 0.0)).rgb * 0.5;',
  '    g += texture2D(uTex, juv + vec2(0.0,  px.y * 3.0)).rgb * 0.5;',
  '    g += texture2D(uTex, juv + vec2(0.0, -px.y * 3.0)).rgb * 0.5;',
  '    col += g * (1.0 / 6.0) * 0.55;',
  '    float sl = 0.82 + 0.18 * sin(uv.y * uSrcRes.y * 3.14159);',
  '    float mask = 0.94 + 0.06 * cos(gl_FragCoord.x * 2.094);',
  '    float flicker = 1.0 + 0.012 * sin(uTime * 753.98) + (hash(vec2(uTime, 1.0)) - 0.5) * 0.012;',
  '    float bp = fract(uv.y - uTime * 0.055);',
  '    float bar = smoothstep(0.0, 0.18, bp) * smoothstep(0.36, 0.18, bp);',
  '    col *= 1.0 + bar * 0.035;',
  '    col += (hash(uv * (100.0 + fract(uTime) * 37.0)) - 0.5) * 0.028;',
  '    col *= sl * mask * flicker;',
  '    float vig = pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.18);',
  '    col *= 0.4 + 0.6 * vig;',
  '  }',
  '  vec2 e = abs(uv * 2.0 - 1.0);',
  '  col *= smoothstep(1.0, 0.99, max(e.x, e.y));',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

CRT.prototype._program = function (vsSrc, fsSrc) {
  var gl = this.gl;
  function sh(type, src) {
    var h = gl.createShader(type);
    gl.shaderSource(h, src);
    gl.compileShader(h);
    if (!gl.getShaderParameter(h, gl.COMPILE_STATUS)) {
      throw new Error('shader: ' + gl.getShaderInfoLog(h));
    }
    return h;
  }
  var p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error('link: ' + gl.getProgramInfoLog(p));
  }
  return p;
};

CRT.prototype._makeTex = function (w, h) {
  var gl = this.gl, t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
};

CRT.prototype._makeFB = function (w, h) {
  var gl = this.gl;
  var tex = this._makeTex(w, h);
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex: tex, fbo: fbo, w: w, h: h };
};

CRT.prototype._bindQuad = function (prog) {
  var gl = this.gl;
  var loc = gl.getAttribLocation(prog, 'aPos');
  gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
};

CRT.prototype.render = function (timeSec) {
  if (!this.gl) { // 2D fallback, no effects
    var c2 = this.ctx2d;
    if (!c2 || !this.canvas.width) return;
    c2.imageSmoothingEnabled = false;
    c2.drawImage(this.src, 0, 0, this.canvas.width, this.canvas.height);
    return;
  }
  var gl = this.gl;
  if (!this.canvas.width || !this.canvas.height) return;

  // upload fresh terminal frame
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texSrc);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.src);

  // pass 1: phosphor persistence accumulation into fbB
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbB.fbo);
  gl.viewport(0, 0, this.fbB.w, this.fbB.h);
  gl.useProgram(this.progAccum);
  this._bindQuad(this.progAccum);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texSrc);
  gl.uniform1i(gl.getUniformLocation(this.progAccum, 'uSrc'), 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, this.fbA.tex);
  gl.uniform1i(gl.getUniformLocation(this.progAccum, 'uPrev'), 1);
  gl.uniform1f(gl.getUniformLocation(this.progAccum, 'uDecay'), this.enabled ? 0.72 : 0.0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // pass 2: CRT effects to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  gl.useProgram(this.progScreen);
  this._bindQuad(this.progScreen);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.fbB.tex);
  gl.uniform1i(gl.getUniformLocation(this.progScreen, 'uTex'), 0);
  gl.uniform1f(gl.getUniformLocation(this.progScreen, 'uTime'), timeSec);
  gl.uniform2f(gl.getUniformLocation(this.progScreen, 'uSrcRes'), this.fbB.w, this.fbB.h);
  gl.uniform1f(gl.getUniformLocation(this.progScreen, 'uCrtOn'), this.enabled ? 1.0 : 0.0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  var t = this.fbA; this.fbA = this.fbB; this.fbB = t;
};
