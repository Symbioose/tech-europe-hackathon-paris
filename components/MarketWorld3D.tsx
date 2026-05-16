"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import type { BuyerAgent, Tribe } from "@/lib/types";
import { getPedestrianGeometry } from "@/lib/three/pedestrian";
import { clusterCenters as DEMO_CLUSTERS } from "@/lib/demo/agents";

type Props = {
  agents: BuyerAgent[];
  tribes: Tribe[];
  selectedAgentId: string | null;
  onSelect: (id: string | null) => void;
  isWorking: boolean;
  currentRound: 0 | 1 | 2 | 3;
  stageLabel?: string;
};

type Overlay = {
  id: string;
  type: "tribe" | "hero-bubble";
  text: string;
  sub?: string;
  emoji?: string;
  accent?: string;
  worldX: number;
  worldY: number;
  worldZ: number;
  screenX: number;
  screenY: number;
  visible: boolean;
};

const WORLD_SCALE = 0.85; // % → world meters
const GROUND_COLOR = new THREE.Color("#070811");
const HALO_INNER = new THREE.Color("#000000");

const STATE_FILL = {
  converted: new THREE.Color("#3affe9"),
  curious: new THREE.Color("#ffcf6b"),
  seen: new THREE.Color("#6b7390"),
  repelled: new THREE.Color("#ff5470"),
  idle: new THREE.Color("#2a3046"),
};
const STATE_EMISSIVE = {
  converted: new THREE.Color("#3affe9"),
  curious: new THREE.Color("#ffaa3a"),
  seen: new THREE.Color("#000000"),
  repelled: new THREE.Color("#7a1421"),
  idle: new THREE.Color("#000000"),
};
const STATE_SCALE = {
  converted: 1.16,
  curious: 1.0,
  seen: 0.94,
  repelled: 0.88,
  idle: 0.95,
};

function pctToWorld(xPct: number, yPct: number): [number, number] {
  return [(xPct - 50) * WORLD_SCALE, (yPct - 50) * WORLD_SCALE];
}

export function MarketWorld3D({
  agents,
  tribes,
  selectedAgentId,
  onSelect,
  isWorking,
  currentRound,
  stageLabel,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    instanced: THREE.InstancedMesh;
    halos: THREE.Group;
    cleanup: () => void;
  } | null>(null);

  const agentsRef = useRef<BuyerAgent[]>(agents);
  agentsRef.current = agents;
  const tribesRef = useRef<Tribe[]>(tribes);
  tribesRef.current = tribes;
  const selectedRef = useRef<string | null>(selectedAgentId);
  selectedRef.current = selectedAgentId;

  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [webglOk, setWebglOk] = useState(true);

  // Build & teardown the scene once.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (err) {
      console.error("WebGL not available", err);
      setWebglOk(false);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.cursor = "default";
    // Use parent-size-driven sizing only; rely on ResizeObserver below.
    const initW = Math.max(1, mount.clientWidth || 1);
    const initH = Math.max(1, mount.clientHeight || 1);
    renderer.setSize(initW, initH, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070811);
    scene.fog = new THREE.Fog(0x070811, 130, 320);

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 600);
    camera.position.set(0, 55, 78);
    camera.lookAt(0, 2, 0);

    // Lights
    const hemi = new THREE.HemisphereLight(0xff9a4a, 0x10131f, 1.1);
    hemi.position.set(0, 50, 0);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff0d8, 1.6);
    sun.position.set(40, 70, 30);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x3affe9, 0.45);
    fill.position.set(-30, 25, -50);
    scene.add(fill);

    const ambient = new THREE.AmbientLight(0x404a66, 0.35);
    scene.add(ambient);

    // Ground plane
    const groundGeo = new THREE.CircleGeometry(140, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: GROUND_COLOR,
      roughness: 0.95,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Subtle gridded inner platform.
    const innerSize = 130;
    const grid = new THREE.GridHelper(innerSize, 26, 0x1c2236, 0x12172a);
    (grid.material as THREE.Material).opacity = 0.4;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.01;
    scene.add(grid);

    // Tribe halos — soft glowing discs under each cluster.
    const halos = new THREE.Group();
    scene.add(halos);

    // Tribe centers — deterministic from the demo cluster definitions, so the
    // scene is fully built even before the first agents prop is populated.
    const tribeCenters = new Map<string, { x: number; z: number }>();
    for (const [tid, c] of Object.entries(DEMO_CLUSTERS)) {
      const [wx, wz] = pctToWorld(c.cx, c.cy);
      tribeCenters.set(tid, { x: wx, z: wz });
    }

    for (const tribe of tribesRef.current) {
      const c = tribeCenters.get(tribe.id);
      if (!c) continue;
      const haloGeo = new THREE.CircleGeometry(10, 48);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(tribe.accent),
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(c.x, 0.03, c.z);
      halo.userData = { tribeId: tribe.id };
      halos.add(halo);

      // Inner ring
      const ringGeo = new THREE.RingGeometry(9, 9.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(tribe.accent),
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(c.x, 0.04, c.z);
      halos.add(ring);
    }

    // Instanced pedestrians.
    const geo = getPedestrianGeometry();
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.55,
      metalness: 0.15,
      vertexColors: false,
    });
    // Use emissive via per-instance via shader hack: simplest is to fake glow by
    // adding small disc halo under converted agents (already provided via state).
    const instanced = new THREE.InstancedMesh(geo, mat, 70);
    instanced.count = 0; // updated per-frame from agentsRef
    instanced.frustumCulled = false;
    scene.add(instanced);

    // Converted halo discs (one per agent, hidden by scale=0 when not converted).
    const haloGeo2 = new THREE.RingGeometry(0.7, 1.15, 24);
    const haloMat2 = new THREE.MeshBasicMaterial({
      color: 0x3affe9,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const agentHalo = new THREE.InstancedMesh(haloGeo2, haloMat2, 70);
    agentHalo.count = 0;
    agentHalo.frustumCulled = false;
    scene.add(agentHalo);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredIdx = -1;

    function setPointer(e: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function handlePointerMove(e: MouseEvent) {
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(instanced);
      if (hit.length > 0 && hit[0].instanceId !== undefined) {
        hoveredIdx = hit[0].instanceId;
        renderer.domElement.style.cursor = "pointer";
      } else {
        hoveredIdx = -1;
        renderer.domElement.style.cursor = "default";
      }
    }

    function handlePointerDown(e: MouseEvent) {
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(instanced);
      if (hit.length > 0 && hit[0].instanceId !== undefined) {
        const idx = hit[0].instanceId;
        const agent = agentsRef.current[idx];
        if (agent) {
          const next = selectedRef.current === agent.id ? null : agent.id;
          onSelect(next);
        }
      } else {
        onSelect(null);
      }
    }

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // Animation loop
    const tmpMatrix = new THREE.Matrix4();
    const tmpPos = new THREE.Vector3();
    const tmpEuler = new THREE.Euler();
    const tmpQuat = new THREE.Quaternion();
    const tmpScale = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    let frameId = 0;
    let lastTime = performance.now();

    const screenProjector = new THREE.Vector3();

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const t = now / 1000;

      // Subtle camera bob.
      const bobX = Math.sin(t * 0.18) * 3;
      const bobZ = Math.cos(t * 0.14) * 1.5;
      camera.position.set(bobX, 55 + Math.sin(t * 0.22) * 1.2, 78 + bobZ);
      camera.lookAt(0, 2, 0);

      // Update instances every frame for hero/selected pulse, scale eases.
      const list = agentsRef.current;
      instanced.count = list.length;
      agentHalo.count = list.length;
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        const [wx, wz] = pctToWorld(a.x, a.y);
        const baseScale = STATE_SCALE[a.state] ?? 1;
        const isSelected = selectedRef.current === a.id;
        const isHovered = hoveredIdx === i;
        const heroBoost = a.isHero ? 0.06 * (1 + Math.sin(t * 3.4)) : 0;
        const hoverBoost = isHovered ? 0.12 : 0;
        const selBoost = isSelected ? 0.18 : 0;
        const yLift = isSelected ? 0.6 + Math.sin(t * 2) * 0.1 : 0;
        const finalScale = baseScale + heroBoost + hoverBoost + selBoost;

        // Face slightly inward to cluster center.
        const center = tribeCenters.get(a.tribeId);
        let rotY = 0;
        if (center) {
          rotY = Math.atan2(center.x - wx, center.z - wz);
        }
        tmpPos.set(wx, yLift, wz);
        tmpEuler.set(0, rotY, 0);
        tmpQuat.setFromEuler(tmpEuler);
        tmpScale.set(finalScale, finalScale, finalScale);
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        instanced.setMatrixAt(i, tmpMatrix);

        // Color
        const baseColor = STATE_FILL[a.state] ?? STATE_FILL.idle;
        const tribe = tribesRef.current.find((tr) => tr.id === a.tribeId);
        let color = tmpColor.copy(baseColor);
        // Tint by tribe a bit on converted / curious for personality.
        if ((a.state === "converted" || a.state === "curious") && tribe) {
          color = color.lerp(new THREE.Color(tribe.accent), 0.35);
        }
        if (isSelected) {
          color.lerp(new THREE.Color(0xffffff), 0.3);
        }
        instanced.setColorAt(i, color);

        // Halo under converted agents (and selected).
        const haloVisible = a.state === "converted" || isSelected;
        const haloScale = haloVisible ? 1 + Math.sin(t * 2 + i) * 0.1 : 0.0001;
        tmpPos.set(wx, 0.05, wz);
        tmpEuler.set(-Math.PI / 2, 0, 0);
        tmpQuat.setFromEuler(tmpEuler);
        tmpScale.set(haloScale, haloScale, haloScale);
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        agentHalo.setMatrixAt(i, tmpMatrix);
      }
      instanced.instanceMatrix.needsUpdate = true;
      if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
      agentHalo.instanceMatrix.needsUpdate = true;

      // Compute overlays for tribe labels and hero bubble.
      const labelArr: Overlay[] = [];
      const rect = renderer.domElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      // Hide tribe labels until the market is populated — keeps the live wait
      // honest (no Oura labels visible while we're calling OpenAI for Linear/etc).
      const showTribeLabels = list.length > 0;
      for (const tribe of showTribeLabels ? tribesRef.current : []) {
        const c = tribeCenters.get(tribe.id);
        if (!c) continue;
        screenProjector.set(c.x, 8.5, c.z).project(camera);
        const sx = (screenProjector.x * 0.5 + 0.5) * w;
        const sy = (-screenProjector.y * 0.5 + 0.5) * h;
        labelArr.push({
          id: `tribe-${tribe.id}`,
          type: "tribe",
          text: tribe.name,
          emoji: tribe.emoji,
          accent: tribe.accent,
          worldX: c.x,
          worldY: 8.5,
          worldZ: c.z,
          screenX: sx,
          screenY: sy,
          visible: screenProjector.z < 1,
        });
      }
      // Hero bubble — only when explicitly selected, to avoid overlap noise.
      const hero = list.find((a) => a.isHero);
      if (hero && selectedRef.current === hero.id) {
        const [hx, hz] = pctToWorld(hero.x, hero.y);
        screenProjector.set(hx, 5.2, hz).project(camera);
        const sx = (screenProjector.x * 0.5 + 0.5) * w;
        const sy = (-screenProjector.y * 0.5 + 0.5) * h;
        labelArr.push({
          id: `hero-${hero.id}`,
          type: "hero-bubble",
          text: hero.name,
          sub:
            hero.state === "converted"
              ? "It wasn't on me. Bought before coffee."
              : "Reading the page now…",
          worldX: hx,
          worldY: 5.2,
          worldZ: hz,
          screenX: sx,
          screenY: sy,
          visible: screenProjector.z < 1,
        });
      }
      setOverlays(labelArr);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    // Resize — driven by the parent box, not by the canvas's own intrinsic size.
    const ro = new ResizeObserver(() => {
      if (!mount) return;
      const W = Math.max(1, mount.clientWidth);
      const H = Math.max(1, mount.clientHeight);
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    const cleanup = () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.dispose();
      mat.dispose();
      groundMat.dispose();
      groundGeo.dispose();
      haloGeo2.dispose();
      haloMat2.dispose();
      halos.children.forEach((m) => {
        const mesh = m as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      });
      mount.removeChild(renderer.domElement);
    };

    stateRef.current = { renderer, scene, camera, instanced, halos, cleanup };
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!webglOk) {
    return (
      <div className="w-full h-full rounded-2xl border border-ink-700/70 bg-ink-900/60 flex items-center justify-center text-ink-400 text-sm p-6 text-center">
        WebGL is unavailable in this browser. The simulation still runs — the
        visual is just disabled here.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-ink-700/70 bg-ink-900/60 backdrop-blur-sm">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Tribe & hero overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {overlays
          .filter((o) => o.visible)
          .map((o) =>
            o.type === "tribe" ? (
              <div
                key={o.id}
                className="absolute"
                style={{
                  left: o.screenX,
                  top: o.screenY,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="text-[11px] font-medium tracking-wide text-white/90 px-2 py-1 rounded-md bg-white/10 border border-white/20 backdrop-blur-md whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <span className="mr-1">{o.emoji}</span>
                  {o.text}
                </div>
              </div>
            ) : (
              <div
                key={o.id}
                className="absolute"
                style={{
                  left: o.screenX,
                  top: o.screenY,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="max-w-[220px] px-3 py-2 rounded-xl bg-white/12 border border-white/25 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_22px_rgba(0,0,0,0.35)]">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-plasma">
                    {o.text} · hero buyer
                  </div>
                  <div className="text-[12px] text-white/95 leading-snug mt-0.5">
                    {o.sub}
                  </div>
                </div>
              </div>
            ),
          )}
      </div>

      {/* Round overlay */}
      {agents.length > 0 && stageLabel && (
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10 pointer-events-none">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
            Market
          </div>
          <div className="h-3 w-px bg-white/20" />
          <div className="text-xs text-white/60">{stageLabel}</div>
          {isWorking && (
            <div className="text-xs text-flame-300 ml-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-flame-400 animate-pulse" />
              simulating
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {agents.length > 0 && (
        <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/8 border border-white/15 backdrop-blur-md z-10 pointer-events-none">
          {[
            { label: "Converted", color: "#3affe9" },
            { label: "Curious", color: "#ffcf6b" },
            { label: "Saw it", color: "#6b7390" },
            { label: "Repelled", color: "#ff5470" },
          ].map((it) => (
            <div key={it.label} className="flex items-center gap-1.5 text-[11px] text-white/70">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: it.color, boxShadow: `0 0 8px ${it.color}` }}
              />
              {it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
