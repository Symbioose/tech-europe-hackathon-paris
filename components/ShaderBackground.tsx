"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = {
  className?: string;
  /** 0..1, dims the whole shader after the lerp. Use to push it behind content. */
  intensity?: number;
};

// Fullscreen mesh-gradient shader inspired by ShaderGradient / Paper Shaders.
// Pure three.js (no @react-three/fiber) to avoid new peer-deps.
// Four moving "blobs" of colour smoothed together, plus a faint grain to kill banding.
const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uIntensity;
  uniform vec3  uBg;
  uniform vec3  uColor1;
  uniform vec3  uColor2;
  uniform vec3  uColor3;

  // Hash → grain, kills colour banding on smooth gradients.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Soft radial falloff from a moving centre.
  float blob(vec2 uv, vec2 centre, float radius) {
    float d = distance(uv, centre);
    return 1.0 - smoothstep(0.0, radius, d);
  }

  void main() {
    // Correct aspect so blobs stay round on wide screens.
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((uv.x - 0.5) * aspect + 0.5, uv.y);

    float t = uTime * 0.18;

    vec2 c1 = vec2(0.30 + 0.22 * sin(t * 1.10 + 0.0),  0.40 + 0.30 * cos(t * 0.80 + 0.4));
    vec2 c2 = vec2(0.70 + 0.18 * sin(t * 0.75 + 2.1),  0.55 + 0.25 * cos(t * 1.05 + 1.2));
    vec2 c3 = vec2(0.50 + 0.28 * sin(t * 0.60 + 4.5),  0.65 + 0.20 * cos(t * 0.95 + 3.0));

    float b1 = blob(p, c1, 0.55);
    float b2 = blob(p, c2, 0.50);
    float b3 = blob(p, c3, 0.45);

    vec3 col = uBg;
    col = mix(col, uColor1, b1 * 0.85);
    col = mix(col, uColor2, b2 * 0.80);
    col = mix(col, uColor3, b3 * 0.70);

    // Vignette — pulls the eye towards centre.
    float vig = smoothstep(1.10, 0.30, distance(uv, vec2(0.5)));
    col *= mix(0.55, 1.0, vig);

    // Grain.
    col += (hash(uv * uResolution + uTime) - 0.5) * 0.035;

    // Final intensity dial (lerp toward bg).
    col = mix(uBg, col, clamp(uIntensity, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function ShaderBackground({ className, intensity = 1 }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    } catch {
      return;
    }
    const initW = Math.max(1, mount.clientWidth || window.innerWidth);
    const initH = Math.max(1, mount.clientHeight || window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(initW, initH, false);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(initW, initH) },
      uIntensity: { value: intensityRef.current },
      // Palette aligned with the forge theme.
      uBg: { value: new THREE.Color("#070811") },        // ink-950
      uColor1: { value: new THREE.Color("#ff7a1a") },    // flame-500
      uColor2: { value: new THREE.Color("#a778ff") },    // plasma
      uColor3: { value: new THREE.Color("#22d3ee") },    // cyan accent
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    let frameId = 0;
    const start = performance.now();

    const render = () => {
      uniforms.uTime.value = (performance.now() - start) / 1000;
      uniforms.uIntensity.value = intensityRef.current;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);

    const ro = new ResizeObserver(() => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      uniforms.uResolution.value.set(w, h);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={className ?? "absolute inset-0 -z-10"} />;
}
