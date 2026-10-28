import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

// A drifting sky of soft, lit clouds. A small WebGL shader marches rays through a layer of
// 3D noise and lights each sample toward the sun, so the clouds have bright tops and shaded
// bellies. Quality presets trade steps and resolution for speed; pixelSize renders it as
// chunky pixel art instead. Without WebGL it falls back to the sky gradient. It pauses
// off-screen and in hidden tabs, frees its GPU context on unmount, and under reduced motion
// shows one still frame. Decorative; anything you pass as children sits on top.

const QUALITY = {
  low: { steps: 14, scale: 0.35, octaves: 3 },
  medium: { steps: 22, scale: 0.5, octaves: 4 },
  high: { steps: 36, scale: 0.8, octaves: 5 }
};

const VERTEX = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

const fragment = (octaves: number, steps: number) => `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uCover;
uniform vec3 uTop;
uniform vec3 uBottom;
uniform vec3 uCloud;
uniform vec3 uShade;
uniform vec3 uSun;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int i = 0; i < ${octaves}; i++) {
    s += a * noise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return s;
}
// Cloud layer between heights 0 and 1.4, drifting with time.
float density(vec3 p) {
  vec3 q = p * 0.85 + vec3(uTime, 0.0, uTime * 0.4);
  float layer = smoothstep(0.0, 0.35, p.y) * smoothstep(1.4, 0.75, p.y);
  return clamp((fbm(q) - (1.0 - uCover)) * 4.0, 0.0, 1.0) * layer;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 rd = normalize(vec3(uv.x, uv.y + 0.32, 1.0));
  vec3 ro = vec3(0.0, -0.7, 0.0);
  vec3 sky = mix(uBottom, uTop, smoothstep(-0.05, 0.75, rd.y));
  sky += pow(max(dot(rd, uSun), 0.0), 14.0) * 0.35 * uCloud;
  if (rd.y < 0.02) {
    gl_FragColor = vec4(sky, 1.0);
    return;
  }
  float t0 = (0.0 - ro.y) / rd.y;
  float t1 = min((1.4 - ro.y) / rd.y, t0 + 9.0);
  float dt = (t1 - t0) / float(${steps});
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  float T = 1.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${steps}; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + dither) * dt);
    float d = density(p);
    if (d > 0.01) {
      // One sample toward the sun: more cloud in the way means a darker sample.
      float occ = density(p + uSun * 0.35);
      vec3 lit = mix(uShade, uCloud, exp(-occ * 2.4));
      lit = mix(lit * 0.82, lit, smoothstep(0.1, 1.1, p.y));
      float a = 1.0 - exp(-d * dt * 3.0);
      col += T * a * lit;
      T *= 1.0 - a;
      if (T < 0.03) break;
    }
  }
  vec3 color = sky * T + col;
  // Melt distant clouds into the horizon haze.
  color = mix(sky, color, smoothstep(0.02, 0.2, rd.y));
  gl_FragColor = vec4(color, 1.0);
}
`;

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export interface CloudSkyProps {
  /** Ray steps, noise detail and render resolution. */
  quality?: 'low' | 'medium' | 'high';
  /** One sample per N px, scaled up crisply; 0 for smooth. Overrides the quality resolution. */
  pixelSize?: number;
  /** Drift speed. */
  speed?: number;
  /** How much of the sky is cloud (0–1). */
  coverage?: number;
  /** Light direction in degrees, left (-) to right (+). */
  sunAngle?: number;
  sunHeight?: number;
  /** Sky gradient; also the fallback without WebGL. */
  topColor?: string;
  bottomColor?: string;
  /** Lit cloud tops. */
  cloudColor?: string;
  /** Shaded cloud bellies. */
  shadeColor?: string;
  /** Fills its parent by default. */
  height?: number | string;
  /** Content on top of the sky. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function CloudSky({
  quality = 'medium',
  pixelSize = 0,
  speed = 0.06,
  coverage = 0.55,
  sunAngle = 30,
  sunHeight = 0.35,
  topColor = '#29366f',
  bottomColor = '#ef7d57',
  cloudColor = '#f4f4f4',
  shadeColor = '#5d275d',
  height = '100%',
  children,
  className = '',
  style
}: CloudSkyProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Cloud time survives setting changes, so the sky doesn't jump.
  const timeRef = useRef(0);

  useEffect(() => {
    // A fresh canvas per setup: a context released with loseContext() can't be reused, and
    // StrictMode runs this effect twice on the same element.
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, { position: 'absolute', inset: '0', display: 'block', width: '100%', height: '100%', imageRendering: pixelSize > 0 ? 'pixelated' : '' });
    rootRef.current!.prepend(canvas);
    const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'low-power' });
    if (!gl) {
      canvas.remove();
      return undefined;
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const preset = QUALITY[quality] ?? QUALITY.medium;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, fragment(preset.octaves, preset.steps));
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
      return undefined;
    }
    gl.useProgram(program);
    // One triangle that covers the screen.
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const a = (sunAngle * Math.PI) / 180;
    const sun = [Math.sin(a), sunHeight, Math.cos(a)];
    const len = Math.hypot(...sun);
    gl.uniform3fv(u('uSun'), sun.map(v => v / len));
    gl.uniform3fv(u('uTop'), rgb(topColor));
    gl.uniform3fv(u('uBottom'), rgb(bottomColor));
    gl.uniform3fv(u('uCloud'), rgb(cloudColor));
    gl.uniform3fv(u('uShade'), rgb(shadeColor));
    gl.uniform1f(u('uCover'), coverage);
    const uTime = u('uTime');
    const uRes = u('uRes');

    let visible = true;
    let raf = 0;
    let last = 0;
    const size = () => {
      const scale = pixelSize > 0 ? 1 / pixelSize : preset.scale * Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const draw = () => {
      gl.uniform1f(uTime, timeRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const tick = (now: number) => {
      timeRef.current += (Math.min(50, now - last) / 1000) * speed;
      last = now;
      draw();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || reduced || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = new ResizeObserver(() => {
      size();
      draw();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    observer.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    size();
    draw();
    start();
    return () => {
      stop();
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, [quality, pixelSize, speed, coverage, sunAngle, sunHeight, topColor, bottomColor, cloudColor, shadeColor]);

  return (
    <div ref={rootRef} className={className} style={{ position: 'relative', width: '100%', height, overflow: 'hidden', background: `linear-gradient(${topColor}, ${bottomColor})`, ...style }}>
      {children && <div style={{ position: 'relative', height: '100%' }}>{children}</div>}
    </div>
  );
}
