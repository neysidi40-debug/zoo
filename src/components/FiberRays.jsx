/* ============================================================
   ZOO — Fibras em raios (fundo da abertura no celular)
   ============================================================
   É o fundo da tela de abertura da versão antiga do site: linhas finas
   de luz que surgem uma camada de cada vez, como raios atravessando a
   tela. No celular ele lê melhor que o GhostFibers (que fica no
   desktop), então a abertura escolhe entre os dois pela largura da tela
   — ver IntroVeil.jsx.

   O shader é o da versão antiga, com UM ajuste pensado pra tela em pé:
   a medida do desenho passou a ser o lado MENOR da tela, e não a altura.
   Antes, num celular, a largura mostrava só uma fatia estreita do
   desenho — por isso parecia perto demais, com poucas linhas. Agora a
   largura inteira do desenho cabe na tela e a altura mostra o que sobra
   pra cima e pra baixo. A escala é a mesma nos dois eixos, então nada
   estica nem achata. SCALE regula o quanto se vê: menor = mais longe,
   mais linhas.

   WebGL2 puro, num triângulo que cobre a tela. Sem WebGL2 o canvas fica
   vazio e o véu segue só com o fundo do CSS.
   ============================================================ */

import { useEffect, useRef } from 'react';

/* as camadas de fibra entram uma de cada vez, e só quando a última está
   no ar a logo começa (LOGO_IN, no IntroVeil.jsx, vem logo depois) */
const FIBERS_IN = 800; // ms

const LINE_COLOR = '#3A1608'; // núcleo fino das fibras
const GLOW_COLOR = '#C73E0A'; // brilho largo (--orange-deep)
const BACKDROP = '#0E0D0C'; // fundo (--black)
const LAYERS = 3; // camadas de fibra (no original, 4): menos camadas, tela mais limpa
const SCALE = 1.15; // zoom do desenho (no desktop antigo era 2, medido pela altura)
/* renderizar a 70% e deixar o navegador esticar é invisível num fundo
   desfocado e devolve fôlego pro celular */
const RES_SCALE = 0.7;

const UNIFORMS = {
  uSpeed: 0.2,
  uScale: SCALE,
  uRotation: 0,
  uRotationSpeed: 0.25,
  uWaveAmplitude: 0.015,
  uWaveFrequency: 3,
  uWaveSpeed: 0.15,
  uLayerSpeed: 0.08,
  uTwist: 0.1,
  uTwistFrequency: 5,
  uTwistSpeed: 1.2,
  // quantas linhas: frequência da 1ª camada + quanto cada camada soma.
  // No original eram 5 e 2; aqui menos, pra tela do celular respirar
  uLineFrequency: 2.4,
  uLineSpacing: 0.9,
  uLineSharpness: 16,
  uGlowFalloff: 10,
  uGlowIntensity: 1.6,
  uBrightness: 2,
  uBlueBoost: 1,
  uVignette: 0.8,
  uGrain: 0.05
};

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
  // a medida é o lado MENOR: em pé, a largura inteira do desenho cabe na
  // tela. Mesmo divisor nos dois eixos = sem esticar nem achatar
  vec2 uv = (2.0 * gl_FragCoord.xy - resolution) / min(resolution.x, resolution.y);
  float time = uTime * uSpeed;
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

    // 2.0 = quantas faixas de brilho cabem na largura (no original, 3.0)
    float glow = exp(-uGlowFalloff * abs(sin(p.x * 2.0 + time + fi)));
    color += uGlowColor * glow * uGlowIntensity * appear / (fi * 2.0);
  }

  // o brilho central e a nuvem estão fora do laço, então acompanham a
  // entrada da primeira camada — senão chegariam prontos antes dela
  float reveal = clamp(uLayers, 0.0, 1.0);

  float center = exp(-2.2 * dot(uv, uv));
  color += centerTone * center * reveal;

  float cloud = exp(-1.5 * length(uv + vec2(sin(time * 0.3) * 0.25, cos(time * 0.25) * 0.18)));
  color += cloudTone * cloud * reveal;

  // a vinheta mede pela tela inteira (e não pelo lado menor), pra não
  // apagar o topo e a base de uma tela comprida
  vec2 screen = (2.0 * gl_FragCoord.xy - resolution) / resolution;
  float vignette = 1.0 - smoothstep(0.35, 1.45, length(screen));
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
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export default function FiberRays({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const gl = canvas?.getContext('webgl2', { alpha: false, antialias: false, depth: false, powerPreference: 'high-performance' });
    if (!canvas || !host || !gl) return undefined;

    const compile = (type, src) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return undefined;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);

    // um triângulo grande o bastante pra a tela caber dentro dele
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u = name => gl.getUniformLocation(program, name);
    Object.entries(UNIFORMS).forEach(([name, value]) => gl.uniform1f(u(name), value));
    gl.uniform3fv(u('uLineColor'), hexToRgb(LINE_COLOR));
    gl.uniform3fv(u('uGlowColor'), hexToRgb(GLOW_COLOR));
    gl.uniform3fv(u('uBackdrop'), hexToRgb(BACKDROP));
    const uTime = u('uTime');
    const uLayers = u('uLayers');
    const uResolution = u('uResolution');
    gl.uniform1f(uLayers, 0); // o véu começa no preto do CSS

    /* uResolution recebe o tamanho do BUFFER DE DESENHO, e não o tamanho
       em CSS: o shader divide gl_FragCoord (que conta pixels do buffer)
       por ele. Com os dois diferentes, a imagem sairia deslocada. */
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2) * RES_SCALE;
      const w = Math.max(1, Math.round(host.clientWidth * scale));
      const h = Math.max(1, Math.round(host.clientHeight * scale));
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uResolution, w, h);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const t0 = performance.now();
    let raf = requestAnimationFrame(function frame(now) {
      const elapsed = now - t0;
      /* um smoothstep DENTRO de cada camada: cada fibra acelera, chega e
         assenta antes de a seguinte começar. Com uma rampa linear as
         quatro se diluiriam num clareamento só. */
      const raw = Math.min(elapsed / FIBERS_IN, 1) * LAYERS;
      const whole = Math.floor(raw);
      const f = raw - whole;
      gl.uniform1f(uLayers, whole + f * f * (3 - 2 * f));
      gl.uniform1f(uTime, elapsed / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      // devolve o contexto na hora: shader vivo debaixo da página é GPU à toa
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
