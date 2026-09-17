/* ============================================================
   ZOO — Ondas com dither
   ============================================================
   Porte do Dither (React Bits) pro site, sem biblioteca.

   O original roda em three.js + @react-three/postprocessing, em DOIS
   passos: um mesh desenha as ondas (ruído fbm) numa textura e um
   pós-processo aplica o dither de Bayer 8x8 por cima. Aqui os dois
   viraram UM fragment shader só: a cor da onda já é calculada na
   coordenada "pixelada", que é exatamente o que o pós-processo lia da
   textura. O resultado é o mesmo, sem framebuffer intermediário.

   Os shaders (ruído de Perlin, fbm, matriz de Bayer) são os mesmos do
   componente, linha por linha. A parte de interação com o mouse foi
   removida de propósito: a animação corre sozinha, sem distorcer.

   Cada <canvas data-dither> vira uma animação dessas. Os parâmetros
   saem de data-* com os mesmos nomes e padrões dos props. Sem WebGL2 o
   canvas fica vazio e o resto da página segue normal.
   ============================================================ */

(() => {
  const canvases = Array.from(document.querySelectorAll('canvas[data-dither]'));
  if (!canvases.length) return;

  const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAG = `#version 300 es
precision highp float;

uniform vec2 resolution;
uniform float time;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform vec3 backgroundColor;
uniform float colorNum;
uniform float pixelSize;

out vec4 fragColor;

vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0,0.0,1.0,1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0,0.0,1.0,1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0/41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00,g00), dot(g01,g01), dot(g10,g10), dot(g11,g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

const int OCTAVES = 4;
float fbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = waveFrequency;
  for (int i = 0; i < OCTAVES; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= waveAmplitude;
  }
  return value;
}

float pattern(vec2 p) {
  vec2 p2 = p - time * waveSpeed;
  return fbm(p + fbm(p2));
}

const float bayerMatrix8x8[64] = float[64](
  0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
  32.0/64.0,16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0,19.0/64.0, 47.0/64.0, 31.0/64.0,
  8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0,59.0/64.0,  7.0/64.0, 55.0/64.0,
  40.0/64.0,24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0,27.0/64.0, 39.0/64.0, 23.0/64.0,
  2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0,49.0/64.0, 13.0/64.0, 61.0/64.0,
  34.0/64.0,18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0,17.0/64.0, 45.0/64.0, 29.0/64.0,
  10.0/64.0,58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0,57.0/64.0,  5.0/64.0, 53.0/64.0,
  42.0/64.0,26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0,25.0/64.0, 37.0/64.0, 21.0/64.0
);

vec3 dither(vec2 uv, vec3 color) {
  vec2 scaledCoord = floor(uv * resolution / pixelSize);
  int x = int(mod(scaledCoord.x, 8.0));
  int y = int(mod(scaledCoord.y, 8.0));
  float threshold = bayerMatrix8x8[y * 8 + x] - 0.25;
  float stepSize = 1.0 / (colorNum - 1.0);
  color += threshold * stepSize;
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float bias = mix(0.2, 0.0, smoothstep(0.45, 0.8, luminance));
  color = clamp(color - bias, 0.0, 1.0);
  return floor(color * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
}

void main() {
  // um passo só: a onda é calculada já na coordenada "pixelada" — é o
  // mesmo que o pós-processo do original lia da textura
  vec2 normalizedPixelSize = pixelSize / resolution;
  vec2 uvScreen = gl_FragCoord.xy / resolution;
  vec2 uvPixel = normalizedPixelSize * floor(uvScreen / normalizedPixelSize);

  vec2 uv = uvPixel - 0.5;
  uv.x *= resolution.x / resolution.y;
  float f = pattern(uv);

  vec3 col = mix(backgroundColor, waveColor, clamp(f, 0.0, 1.0));
  fragColor = vec4(dither(uvScreen, col), 1.0);
}
`;

  const hexToRgb = hex => {
    const clean = String(hex).replace('#', '').trim();
    const full = clean.length === 3 ? clean.replace(/./g, c => c + c) : clean;
    const n = parseInt(full, 16);
    return Number.isFinite(n)
      ? [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
      : [0.5, 0.5, 0.5];
  };

  const setup = canvas => {
    const gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) return null;

    const compile = (type, src) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u = name => gl.getUniformLocation(program, name);
    const num = (key, fallback) => {
      const value = parseFloat(canvas.dataset[key]);
      return Number.isFinite(value) ? value : fallback;
    };

    // o componente renderiza com dpr 1 (é o que deixa o pixel do dither
    // grosso e retrô); aqui é igual
    gl.uniform1f(u('waveSpeed'), num('waveSpeed', 0.05));
    gl.uniform1f(u('waveFrequency'), num('waveFrequency', 3));
    gl.uniform1f(u('waveAmplitude'), num('waveAmplitude', 0.3));
    gl.uniform1f(u('colorNum'), num('colorNum', 4));
    gl.uniform1f(u('pixelSize'), num('pixelSize', 2));
    gl.uniform3fv(u('waveColor'), hexToRgb(canvas.dataset.waveColor || '#808080'));
    gl.uniform3fv(u('backgroundColor'), hexToRgb(canvas.dataset.backgroundColor || '#000000'));

    const uTime = u('time');
    const uResolution = u('resolution');

    const item = { canvas, gl, program, uTime, visible: true };

    item.resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth));
      const h = Math.max(1, Math.round(canvas.clientHeight));
      if (canvas.width !== w || canvas.height !== h){
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.useProgram(program);
      gl.uniform2f(uResolution, w, h);
    };
    item.resize();

    if ('ResizeObserver' in window) new ResizeObserver(item.resize).observe(canvas);
    if ('IntersectionObserver' in window){
      new IntersectionObserver(([entry]) => {
        item.visible = entry.isIntersecting;
        if (item.visible) wake();
      }, { threshold: 0 }).observe(canvas);
    }

    return item;
  };

  const items = canvases.map(setup).filter(Boolean);
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let raf = 0;

  const draw = now => {
    const seconds = (now - start) / 1000;
    for (const item of items){
      if (!item.visible) continue;
      const gl = item.gl;
      gl.useProgram(item.program);
      gl.uniform1f(item.uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    raf = (!reduceMotion && !document.hidden) ? requestAnimationFrame(draw) : 0;
  };

  function wake(){
    if (raf || document.hidden) return;
    raf = requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', wake);
  // com "reduzir movimento" desenha um quadro parado
  if (reduceMotion) requestAnimationFrame(draw);
  else wake();
})();
