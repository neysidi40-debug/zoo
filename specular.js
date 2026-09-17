/* ============================================================
   ZOO — Botão especular
   ============================================================
   Porte do SpecularButton (React Bits) pro site, sem biblioteca.

   O original é um componente React que desenha o brilho num shader
   WebGL usando a biblioteca ogl. Aqui o SHADER É O MESMO, linha por
   linha; só a ogl foi trocada por WebGL2 puro (a ogl é uma casca fina
   em volta disso). A matemática do ponteiro, a suavização e os valores
   padrão também são os mesmos do componente.

   Como o brilho funciona: o shader mede, pra cada pixel, a distância
   até a borda arredondada do botão (SDF). Perto da borda ele acende um
   fio com queda gaussiana, e a intensidade depende do ângulo entre a
   normal da borda e a direção da luz. Como esse ângulo usa valor
   absoluto, acendem DOIS trechos ao mesmo tempo: o lado virado pra luz
   e o oposto — é isso que dá o aspecto de reflexo em metal, e é o que
   um gradiente CSS não consegue imitar.

   Os parâmetros (os props do componente) saem de data-* no HTML, com os
   mesmos nomes e padrões. Sem WebGL2 o botão continua funcionando,
   só sem o brilho.
   ============================================================ */

(() => {
  const buttons = Array.from(document.querySelectorAll('.specular-button'));
  if (!buttons.length) return;

  const PAD = 20; // px que o canvas passa pra fora do botão (igual ao CSS)

  const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  // traço escuro colado na borda, que dá sensação de espessura
  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  // reflexo simétrico: as bordas viradas pra luz e as opostas acendem.
  // a janela angular (tamanho + esmaecimento) usa uma normal elíptica,
  // pra variar de forma contínua ao longo das partes retas
  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
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

  const instances = [];

  const setup = btn => {
    const fx = btn.querySelector('.specular-button__fx');
    if (!fx) return;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) return; // sem WebGL2: fica o botão normal, sem brilho

    const dpr = window.devicePixelRatio || 1;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    // triângulo que cobre a tela inteira (o mesmo da geometria Triangle da ogl)
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u = name => gl.getUniformLocation(program, name);
    const uniforms = {
      uCenter: u('uCenter'), uHalfSize: u('uHalfSize'), uRadius: u('uRadius'),
      uAngle: u('uAngle'), uLineColor: u('uLineColor'), uBaseColor: u('uBaseColor'),
      uIntensity: u('uIntensity'), uShineSize: u('uShineSize'), uShineFade: u('uShineFade'),
      uThickness: u('uThickness')
    };
    gl.uniform1f(u('uPx'), dpr);
    gl.uniform1f(u('uBaseWidth'), dpr);

    // props do componente, lidos de data-* (mesmos nomes e padrões)
    const num = (key, fallback) => {
      const value = parseFloat(btn.dataset[key]);
      return Number.isFinite(value) ? value : fallback;
    };
    const props = {
      radius: num('radius', 18),
      lineColor: hexToRgb(btn.dataset.lineColor || '#ffffff'),
      baseColor: hexToRgb(btn.dataset.baseColor || '#525252'),
      intensity: num('intensity', 1),
      shineSize: num('shineSize', 10),
      shineFade: num('shineFade', 40),
      thickness: num('thickness', 1),
      speed: num('speed', 0.35),
      followMouse: btn.dataset.followMouse !== 'false',
      proximity: num('proximity', 250),
      autoAnimate: btn.dataset.autoAnimate === 'true'
    };

    const item = {
      btn, gl, canvas, program, uniforms, props, dpr,
      w: 1, h: 1,
      angle: 2.4, idleAngle: 2.4, bright: 0,
      pointerAngle: null, proximityT: 0,
      visible: true
    };

    // tamanho em fração + centro explícito mantêm o SDF colado na borda
    // exata do CSS, em vez de escorregar até 1px por arredondamento
    const resize = () => {
      const rect = btn.getBoundingClientRect();
      item.w = rect.width;
      item.h = rect.height;
      canvas.width = Math.round((item.w + PAD * 2) * dpr);
      canvas.height = Math.round((item.h + PAD * 2) * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform2f(uniforms.uCenter, (PAD + item.w / 2) * dpr, (PAD + item.h / 2) * dpr);
      gl.uniform2f(uniforms.uHalfSize, (item.w / 2) * dpr, (item.h / 2) * dpr);
    };

    fx.appendChild(canvas);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(btn);
    resize();

    // não gasta GPU com o botão fora da tela (o brilho só existe perto do mouse)
    if ('IntersectionObserver' in window){
      new IntersectionObserver(([entry]) => {
        item.visible = entry.isIntersecting;
        if (item.visible) wake();
      }, { threshold: 0 }).observe(btn);
    }

    instances.push(item);
  };

  buttons.forEach(setup);
  if (!instances.length) return;

  // o ângulo da luz aponta pro ponteiro (em qualquer lugar da página) e cai
  // numa varredura lenta enquanto o ponteiro não tiver se mexido
  window.addEventListener('pointermove', e => {
    for (const item of instances){
      const rect = item.btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      const dist = Math.hypot(dx, dy);
      // em cima do botão a luz assenta na diagonal (emoldurando os cantos) e
      // balança de leve conforme a posição do cursor dentro dele
      if (dist === 0){
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (cy - e.clientY) / (rect.height / 2);
        item.pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
      } else {
        item.pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx);
      }
      const t = Math.max(0, 1 - dist / Math.max(item.props.proximity, 1));
      item.proximityT = t * t * (3 - 2 * t);
    }
    wake();
  }, { passive: true });

  let raf = 0;
  let last = performance.now();

  const update = now => {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    let running = false;

    for (const item of instances){
      if (!item.visible) continue;
      const p = item.props;
      const gl = item.gl;

      item.idleAngle += p.speed * dt;
      const steer = p.followMouse && item.pointerAngle != null && (!p.autoAnimate || item.proximityT > 0);
      const target = steer ? item.pointerAngle : item.idleAngle;
      const diff = ((target - item.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      item.angle += diff * (1 - Math.exp(-dt * 7));

      // o brilho acende conforme o ponteiro chega perto, a menos que o
      // autoAnimate o mantenha sempre ligado
      const brightTarget = p.autoAnimate ? 1 : item.proximityT;
      item.bright += (brightTarget - item.bright) * (1 - Math.exp(-dt * 8));

      gl.useProgram(item.program);
      gl.uniform1f(item.uniforms.uAngle, item.angle);
      gl.uniform1f(item.uniforms.uRadius, Math.min(p.radius, Math.min(item.w, item.h) / 2) * item.dpr);
      gl.uniform3fv(item.uniforms.uLineColor, p.lineColor);
      gl.uniform3fv(item.uniforms.uBaseColor, p.baseColor);
      gl.uniform1f(item.uniforms.uIntensity, p.intensity * item.bright);
      gl.uniform1f(item.uniforms.uShineSize, (p.shineSize * Math.PI) / 180);
      gl.uniform1f(item.uniforms.uShineFade, (p.shineFade * Math.PI) / 180);
      gl.uniform1f(item.uniforms.uThickness, p.thickness * item.dpr);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // continua rodando enquanto o brilho ainda está vivo, ou sempre que o
      // autoAnimate/varredura ociosa estiverem em jogo
      if (p.autoAnimate || item.bright > 0.002 || Math.abs(diff) > 0.001) running = true;
    }

    // agenda o próximo quadro DIRETO: passar pelo wake() reiniciaria o
    // relógio (last) a cada quadro e o dt viria sempre zero — aí nada
    // acendia nem girava
    raf = (running && !document.hidden) ? requestAnimationFrame(update) : 0;
  };

  function wake(){
    if (!raf && !document.hidden){
      last = performance.now();
      raf = requestAnimationFrame(update);
    }
  }

  document.addEventListener('visibilitychange', wake);
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake, { passive: true });
  wake();
})();
