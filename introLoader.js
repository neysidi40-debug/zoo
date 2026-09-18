/* ============================================================
   ZOO — Tela de abertura
   ============================================================
   Um véu cobre a página no carregamento: fundo de fibras animadas
   com a logo no meio, que surge desfocada e dá uma piscada antes
   de a página aparecer. Roda em TODO carregamento, a cada F5.

   ── POR QUE NÃO TEM REACT AQUI ──────────────────────────────
   O fundo é o GhostFibers (React Bits), que usa a biblioteca ogl.
   Mas o componente é, no fundo, um FRAGMENT SHADER: a ogl só cria o
   contexto, compila o shader e desenha um triângulo que cobre a tela
   — o que são poucas linhas de WebGL cru. Trazer a biblioteca (e com
   ela npm e bundler, que este projeto não tem) seria caro pelo motivo
   errado, e ainda por cima numa tela de LOADING: fazer ela esperar o
   download de uma dependência é o avesso do que ela existe pra fazer.
   O shader abaixo é o do componente, sem alteração de lógica.

   ── QUEM DECIDE MOSTRAR ─────────────────────────────────────
   Não é este arquivo: é o script inline no <head>. A decisão precisa
   acontecer ANTES da primeira pintura, senão quem já viu a intro veria
   um lampejo dela a cada refresh.
   ============================================================ */

(() => {
  const veil = document.getElementById('introVeil');
  if (!veil) return;

  const canvas = document.getElementById('introCanvas');
  const root = document.documentElement;

  // a trava de rolagem fica aqui, e não no CSS, de propósito: se este
  // script não carregar, a página não pode ficar presa sem rolagem
  document.body.style.overflow = 'hidden';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── tempos ──────────────────────────────────────────────────
     A abertura tem três atos, nesta ordem: o fundo se monta (0 a 0,8s),
     a logo surge peça por peça (0,85s a ~1,75s), a piscada (2s) e só
     então o véu sai. A piscada é o ponto da tela, então ela nunca pode
     acontecer junto com a saída.
     FADE tem um par no CSS (a transition do .intro-veil): os dois
     PRECISAM bater. Se for menor, o véu some no meio do fade; se for
     maior, fica um punhado de quadros invisível no DOM. */
  const HOLD = 2500; // quando o véu começa a sair
  const FADE = 650;  // duração da saída (casar com o CSS)
  /* o fundo não aparece pronto: as camadas de fibra entram uma de cada
     vez, e só quando a última está no ar a logo começa. FIBERS_IN é o
     tempo das quatro somadas, e tem um par no CSS (--logo-in, no
     .intro-veil), que precisa vir logo depois dele. */
  const FIBERS_IN = 800;

  /* ── parâmetros do GhostFibers ───────────────────────────────
     Mesmos nomes das props do componente. As cores são a adaptação
     pro tema: o original é roxo/azul. BLUE_BOOST volta pra 1 porque
     ele existe pra puxar a imagem inteira pro azul — com 1.25 o
     laranja esverdearia. RES_SCALE é acréscimo nosso: o shader faz
     muita conta por pixel e isso é um fundo desfocado que fica ~2s
     no ar; renderizar a 70% e deixar o navegador esticar é invisível
     e devolve fôlego. */
  const LINE_COLOR = '#3A1608';  // núcleo fino das fibras
  const GLOW_COLOR = '#C73E0A';  // brilho largo (--orange-deep)
  const BACKDROP   = '#0E0D0C';  // fundo (--black); no original é um roxo fixo
  const SPEED = 0.2, SCALE = 2, ROTATION = 0, ROTATION_SPEED = 0.25, LAYERS = 4;
  const WAVE_AMPLITUDE = 0.015, WAVE_FREQUENCY = 3, WAVE_SPEED = 0.15, LAYER_SPEED = 0.08;
  const TWIST = 0.1, TWIST_FREQUENCY = 5, TWIST_SPEED = 1.2;
  const LINE_FREQUENCY = 5, LINE_SPACING = 2, LINE_SHARPNESS = 16;
  const GLOW_FALLOFF = 10, GLOW_INTENSITY = 1.6;
  const BRIGHTNESS = 2, BLUE_BOOST = 1, VIGNETTE = 0.8, GRAIN = 0.05;
  const RES_SCALE = 0.7;

  const VERT = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uLayers;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float uWaveSpeed;
uniform float uLayerSpeed;
uniform float uTwist;
uniform float uTwistFrequency;
uniform float uTwistSpeed;
uniform float uLineFrequency;
uniform float uLineSpacing;
uniform float uLineSharpness;
uniform float uGlowFalloff;
uniform float uGlowIntensity;
uniform float uBrightness;
uniform float uBlueBoost;
uniform float uVignette;
uniform float uGrain;
uniform float uRotationSpeed;
uniform vec3 uLineColor;
uniform vec3 uGlowColor;
uniform vec3 uBackdrop;

out vec4 fragColor;

#define MAX_LAYERS 10

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float grainHash(vec2 point) {
  point = floor(point);
  float hash = 52.9829189 * fract(dot(point, vec2(0.065, 0.005)));
  return fract(hash);
}

float layeredGrain(vec2 fragmentPixel) {
  vec2 point = mod(fragmentPixel + vec2(uTime * 30.0, -uTime * 21.0), 1024.0);
  vec2 rotated = mat2(0.8, -0.5, 0.5, 0.8) * point;
  float grain = 0.0;
  grain += 0.40 * grainHash(rotated);
  grain += 0.25 * grainHash(rotated * 2.0 + 17.0);
  grain += 0.20 * grainHash(rotated * 4.0 + 47.0);
  grain += 0.10 * grainHash(rotated * 8.0 + 113.0);
  grain += 0.05 * grainHash(rotated * 16.0 + 191.0);
  return grain;
}

void main() {
  vec2 resolution = max(uResolution, vec2(1.0));
  vec2 uv = (2.0 * gl_FragCoord.xy - resolution) / resolution.y;
  float time = uTime * uSpeed;
  // no original este fundo é um roxo fixo no código; aqui vem de fora,
  // pra o véu ler como a própria página
  vec3 backdrop = uBackdrop;
  vec3 centerTone = max(uLineColor * 0.85567 - uGlowColor * 0.06186, vec3(0.0));
  vec3 cloudTone = uLineColor * 0.19588 + uGlowColor * 0.2268;
  vec2 p = uv;
  p /= max(uScale, 0.05);
  p = rotate2d(radians(uRotation) + time * uRotationSpeed) * p;
  vec3 color = vec3(0.0);

  // uLayers sobe de 0 até o total durante a abertura. A camada em que a
  // conta cai no meio entra com peso parcial, em vez de piscar inteira de
  // uma vez — é isso que faz as fibras se montarem uma a uma
  for (int index = 0; index < MAX_LAYERS; index++) {
    float fi = float(index) + 1.0;
    float appear = clamp(uLayers - fi + 1.0, 0.0, 1.0);
    if (appear <= 0.0) break;

    p += uWaveAmplitude * sin(p.yx * fi * uWaveFrequency + time * (uWaveSpeed + fi * uLayerSpeed));

    float radius = length(p);
    float polarAngle = atan(p.y, p.x);
    polarAngle += sin(radius * uTwistFrequency - time * uTwistSpeed + fi) * uTwist;
    p = vec2(cos(polarAngle), sin(polarAngle)) * radius;

    float lines = abs(sin(p.x * (uLineFrequency + fi * uLineSpacing) + sin(p.y * 3.0 + time)));
    lines = pow(max(0.0, 1.0 - lines), uLineSharpness);
    color += uLineColor * lines * appear / fi;

    float glow = exp(-uGlowFalloff * abs(sin(p.x * 3.0 + time + fi)));
    color += uGlowColor * glow * uGlowIntensity * appear / (fi * 2.0);
  }

  // o brilho central e a nuvem estão fora do laço, então acompanham a
  // entrada da primeira camada — senão chegariam prontos antes dela
  float reveal = clamp(uLayers, 0.0, 1.0);

  float center = exp(-2.2 * dot(uv, uv));
  color += centerTone * center * reveal;

  float cloud = exp(-1.5 * length(uv + vec2(sin(time * 0.3) * 0.25, cos(time * 0.25) * 0.18)));
  color += cloudTone * cloud * reveal;

  float vignette = 1.0 - smoothstep(0.35, 1.45, length(uv));
  color *= mix(1.0 - uVignette, 1.0, vignette);
  color = 1.0 - exp(-color * uBrightness);
  color.b *= uBlueBoost;

  vec3 outputColor = backdrop + color;

  float noise = (layeredGrain(gl_FragCoord.xy) - 0.5) * uGrain;
  outputColor = clamp(outputColor + noise, 0.0, 1.0);
  fragColor = vec4(outputColor, 1.0);
}
`;

  const hexToRgb = hex => {
    const clean = String(hex).replace('#', '').trim();
    const full = clean.length === 3 ? clean.replace(/./g, c => c + c) : clean;
    const n = parseInt(full, 16);
    return Number.isFinite(n)
      ? [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
      : [1, 1, 1];
  };

  /* Devolve { stop } ou null. Null não é erro: é o caminho em que o véu
     fica só com o fundo do CSS (sem WebGL2, GPU na blocklist, shader que
     não compilou). A intro roda igual. */
  const startFibers = () => {
    if (!canvas || reduceMotion) return null;

    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' });
    if (!gl) return null;

    const compile = (type, src) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){ gl.deleteShader(shader); return null; }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);

    // um triângulo grande o bastante pra a tela caber dentro dele — e não
    // um quadrado de dois triângulos, que faz a GPU processar a diagonal
    // do meio duas vezes
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u = name => gl.getUniformLocation(program, name);
    gl.uniform1f(u('uSpeed'), SPEED);
    gl.uniform1f(u('uScale'), SCALE);
    gl.uniform1f(u('uRotation'), ROTATION);
    gl.uniform1f(u('uRotationSpeed'), ROTATION_SPEED);
    gl.uniform1f(u('uWaveAmplitude'), WAVE_AMPLITUDE);
    gl.uniform1f(u('uWaveFrequency'), WAVE_FREQUENCY);
    gl.uniform1f(u('uWaveSpeed'), WAVE_SPEED);
    gl.uniform1f(u('uLayerSpeed'), LAYER_SPEED);
    gl.uniform1f(u('uTwist'), TWIST);
    gl.uniform1f(u('uTwistFrequency'), TWIST_FREQUENCY);
    gl.uniform1f(u('uTwistSpeed'), TWIST_SPEED);
    gl.uniform1f(u('uLineFrequency'), LINE_FREQUENCY);
    gl.uniform1f(u('uLineSpacing'), LINE_SPACING);
    gl.uniform1f(u('uLineSharpness'), LINE_SHARPNESS);
    gl.uniform1f(u('uGlowFalloff'), GLOW_FALLOFF);
    gl.uniform1f(u('uGlowIntensity'), GLOW_INTENSITY);
    gl.uniform1f(u('uBrightness'), BRIGHTNESS);
    gl.uniform1f(u('uBlueBoost'), BLUE_BOOST);
    gl.uniform1f(u('uVignette'), VIGNETTE);
    gl.uniform1f(u('uGrain'), GRAIN);
    gl.uniform3fv(u('uLineColor'), hexToRgb(LINE_COLOR));
    gl.uniform3fv(u('uGlowColor'), hexToRgb(GLOW_COLOR));
    gl.uniform3fv(u('uBackdrop'), hexToRgb(BACKDROP));
    const uTime = u('uTime');
    const uLayersLoc = u('uLayers');
    const uResolution = u('uResolution');
    gl.uniform1f(uLayersLoc, 0); // o véu começa no preto do CSS

    /* uResolution recebe o tamanho do BUFFER DE DESENHO, e não o tamanho
       em CSS: o shader divide gl_FragCoord (que conta pixels do buffer)
       por ele. Com os dois diferentes, a imagem sairia deslocada. */
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2) * RES_SCALE;
      const w = Math.max(1, Math.round(veil.clientWidth * scale));
      const h = Math.max(1, Math.round(veil.clientHeight * scale));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const t0 = performance.now();
    let raf = requestAnimationFrame(function frame(now){
      const elapsed = now - t0;
      /* Um smoothstep DENTRO de cada camada, e não um só na rampa inteira:
         assim cada fibra acelera, chega e assenta antes de a seguinte
         começar. Com uma rampa linear as quatro se diluiriam num
         clareamento só, que é o contrário de "uma por uma". */
      const raw = Math.min(elapsed / FIBERS_IN, 1) * LAYERS;
      const whole = Math.floor(raw);
      const f = raw - whole;
      gl.uniform1f(uLayersLoc, whole + f * f * (3 - 2 * f));

      gl.uniform1f(uTime, elapsed / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    });

    return {
      stop(){
        if (raf !== null) cancelAnimationFrame(raf);
        raf = null;
        window.removeEventListener('resize', resize);
        // devolve o contexto na hora: deixar o shader vivo debaixo da
        // página depois que o véu sumiu é queimar GPU à toa
        const lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    };
  };

  const fibers = startFibers();

  const finish = () => {
    root.classList.remove('intro-on');
    veil.classList.add('is-leaving');
    document.body.style.overflow = '';

    setTimeout(() => {
      if (fibers) fibers.stop();
      if (veil.parentNode) veil.parentNode.removeChild(veil);
    }, FADE);
  };

  // com "reduzir movimento" a intro só dá um instante e sai
  setTimeout(finish, reduceMotion ? 250 : HOLD);
})();
