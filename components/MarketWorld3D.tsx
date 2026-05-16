"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { BuyerAgent, Tribe } from "@/lib/types";
import { clusterCenters as DEMO_CLUSTERS } from "@/lib/demo/agents";

type Props = {
  agents: BuyerAgent[];
  tribes: Tribe[];
  selectedAgentId: string | null;
  onSelect: (id: string | null) => void;
  isWorking: boolean;
  currentRound: number;
  stageLabel?: string;
};

type Overlay = {
  id: string;
  type: "tribe" | "hero-bubble";
  text: string;
  sub?: string;
  emoji?: string;
  worldX: number;
  worldY: number;
  worldZ: number;
  screenX: number;
  screenY: number;
  visible: boolean;
};

type AvatarPart =
  | "head"
  | "hair"
  | "torso"
  | "hips"
  | "leftArm"
  | "rightArm"
  | "leftLeg"
  | "rightLeg"
  | "leftShoe"
  | "rightShoe";

type AvatarRig = {
  group: THREE.Group;
  parts: Record<AvatarPart, THREE.InstancedMesh>;
  geometries: THREE.BufferGeometry[];
  material: THREE.Material;
};

const WORLD_SCALE = 0.85;
const MAX_AGENTS = 70;

const STATE_COLOR = {
  converted: new THREE.Color("#3affe9"),
  curious: new THREE.Color("#ffcf6b"),
  seen: new THREE.Color("#6bb6ff"),
  repelled: new THREE.Color("#ff4768"),
  idle: new THREE.Color("#7c8cff"),
};

const STATE_SCALE = {
  converted: 1.18,
  curious: 1.08,
  seen: 1.0,
  repelled: 0.98,
  idle: 1.0,
};

const SKIN = ["#f3c7a3", "#d99b72", "#a9704f", "#714a38", "#efb68d"];
const HAIR = ["#15121a", "#3a241b", "#6d4a2c", "#d6b16f", "#412d4d"];
const CLOTHES = ["#22d3ee", "#a78bfa", "#fb7185", "#f59e0b", "#34d399", "#60a5fa", "#f472b6"];
const PANTS = ["#2563eb", "#334155", "#6d28d9", "#0f766e", "#be123c"];
const SHOES = ["#111827", "#1f2937", "#2e293b"];

const ARCHETYPES = [
  { width: 0.92, height: 1.08, shoulder: 0.56, hair: 0 },
  { width: 1.04, height: 0.98, shoulder: 0.64, hair: 1 },
  { width: 0.86, height: 0.94, shoulder: 0.52, hair: 2 },
  { width: 1.1, height: 1.1, shoulder: 0.68, hair: 0 },
  { width: 0.96, height: 1.0, shoulder: 0.6, hair: 2 },
];

function pctToWorld(xPct: number, yPct: number): [number, number] {
  return [(xPct - 50) * WORLD_SCALE, (yPct - 50) * WORLD_SCALE];
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function unit(seed: number, salt: number) {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pick<T>(items: T[], seed: number, salt: number): T {
  return items[Math.floor(unit(seed, salt) * items.length) % items.length];
}

function makeAvatarRig(max: number): AvatarRig {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  // InstancedMesh.setColorAt(i, color) populates the `instanceColor` attribute,
  // which is multiplied with material.color (white = pass-through).
  // `vertexColors: true` is wrong here — there are no per-vertex colors on these
  // primitive geometries, so the shader samples nothing and renders black.
  const material = new THREE.MeshLambertMaterial({ color: 0xffffff });

  function add(name: AvatarPart, geometry: THREE.BufferGeometry) {
    geometries.push(geometry);
    const mesh = new THREE.InstancedMesh(geometry, material, max);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.userData = { avatarPart: name };
    group.add(mesh);
    return mesh;
  }

  return {
    group,
    geometries,
    material,
    parts: {
      head: add("head", new THREE.SphereGeometry(0.42, 12, 8)),
      hair: add("hair", new THREE.BoxGeometry(0.84, 0.32, 0.78)),
      torso: add("torso", new THREE.BoxGeometry(0.84, 1.05, 0.5)),
      hips: add("hips", new THREE.BoxGeometry(0.74, 0.32, 0.48)),
      leftArm: add("leftArm", new THREE.CapsuleGeometry(0.12, 0.72, 3, 7)),
      rightArm: add("rightArm", new THREE.CapsuleGeometry(0.12, 0.72, 3, 7)),
      leftLeg: add("leftLeg", new THREE.CapsuleGeometry(0.16, 0.78, 3, 7)),
      rightLeg: add("rightLeg", new THREE.CapsuleGeometry(0.16, 0.78, 3, 7)),
      leftShoe: add("leftShoe", new THREE.BoxGeometry(0.28, 0.16, 0.48)),
      rightShoe: add("rightShoe", new THREE.BoxGeometry(0.28, 0.16, 0.48)),
    },
  };
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
  const agentsRef = useRef(agents);
  const tribesRef = useRef(tribes);
  const selectedRef = useRef<string | null>(selectedAgentId);

  agentsRef.current = agents;
  tribesRef.current = tribes;
  selectedRef.current = selectedAgentId;

  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [webglOk, setWebglOk] = useState(true);

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

    const initW = Math.max(1, mount.clientWidth || 1);
    const initH = Math.max(1, mount.clientHeight || 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(initW, initH, false);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070811);
    scene.fog = new THREE.Fog(0x070811, 140, 320);

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 600);
    camera.position.set(0, 55, 78);
    camera.lookAt(0, 2, 0);

    scene.add(new THREE.HemisphereLight(0xffd0a6, 0x263450, 1.6));
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.8);
    sun.position.set(40, 70, 30);
    scene.add(sun);

    const groundGeo = new THREE.CircleGeometry(140, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#070811"),
      roughness: 0.95,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const grid = new THREE.GridHelper(130, 26, 0x1c2236, 0x12172a);
    (grid.material as THREE.Material).opacity = 0.4;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.01;
    scene.add(grid);

    const tribeCenters = new Map<string, { x: number; z: number }>();
    for (const [id, c] of Object.entries(DEMO_CLUSTERS)) {
      const [x, z] = pctToWorld(c.cx, c.cy);
      tribeCenters.set(id, { x, z });
    }

    const halos = new THREE.Group();
    scene.add(halos);
    for (const tribe of tribesRef.current) {
      const center = tribeCenters.get(tribe.id);
      if (!center) continue;
      const color = new THREE.Color(tribe.accent);

      const halo = new THREE.Mesh(
        new THREE.CircleGeometry(10, 48),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.18,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(center.x, 0.03, center.z);
      halos.add(halo);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(9, 9.5, 64),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(center.x, 0.04, center.z);
      halos.add(ring);
    }

    const avatars = makeAvatarRig(MAX_AGENTS);
    scene.add(avatars.group);

    // Invisible click hitbox cylinder per agent — big enough to catch sloppy clicks
    // at the diorama scale. Material is fully transparent but `visible: true` so the
    // raycaster considers it. depthWrite off so it never occludes anything visually.
    const hitGeometry = new THREE.CylinderGeometry(1.6, 1.6, 4.6, 10);
    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const hitMesh = new THREE.InstancedMesh(hitGeometry, hitMaterial, MAX_AGENTS);
    hitMesh.count = 0;
    hitMesh.frustumCulled = false;
    scene.add(hitMesh);

    const agentHalo = new THREE.InstancedMesh(
      new THREE.RingGeometry(0.7, 1.15, 24),
      new THREE.MeshBasicMaterial({
        color: 0x3affe9,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      MAX_AGENTS,
    );
    agentHalo.count = 0;
    agentHalo.frustumCulled = false;
    scene.add(agentHalo);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredIdx = -1;

    function setPointer(event: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function intersectAvatar() {
      // Raycast against the invisible hitbox cylinders first — wider catch zone.
      const hits = raycaster.intersectObject(hitMesh, false);
      const match = hits.find((hit) => hit.instanceId !== undefined);
      if (match) return match;
      // Fallback: precise hit on the avatar rig parts.
      return raycaster
        .intersectObjects(Object.values(avatars.parts), false)
        .find((hit) => hit.instanceId !== undefined);
    }

    function handlePointerMove(event: MouseEvent) {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = intersectAvatar();
      hoveredIdx = hit?.instanceId ?? -1;
      renderer.domElement.style.cursor = hoveredIdx >= 0 ? "pointer" : "default";
    }

    function handlePointerDown(event: MouseEvent) {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = intersectAvatar();
      if (hit?.instanceId !== undefined) {
        const agent = agentsRef.current[hit.instanceId];
        if (agent) onSelect(selectedRef.current === agent.id ? null : agent.id);
      } else {
        onSelect(null);
      }
    }

    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    const matrix = new THREE.Matrix4();
    const rootPos = new THREE.Vector3();
    const offset = new THREE.Vector3();
    const worldOffset = new THREE.Vector3();
    const partPos = new THREE.Vector3();
    const rootEuler = new THREE.Euler();
    const partEuler = new THREE.Euler();
    const rootQuat = new THREE.Quaternion();
    const partQuat = new THREE.Quaternion();
    const partScale = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const screenProjector = new THREE.Vector3();

    function setPart(
      part: AvatarPart,
      index: number,
      color: THREE.Color,
      local: THREE.Vector3,
      rotation: THREE.Euler,
      localScale: THREE.Vector3,
    ) {
      worldOffset.copy(local).multiply(partScale).applyQuaternion(rootQuat);
      partPos.copy(rootPos).add(worldOffset);
      partQuat.setFromEuler(rotation).premultiply(rootQuat);
      scale.copy(localScale).multiply(partScale);
      matrix.compose(partPos, partQuat, scale);
      avatars.parts[part].setMatrixAt(index, matrix);
      avatars.parts[part].setColorAt(index, color);
    }

    let frameId = 0;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const t = now / 1000;
      lastTime = now;

      const bobX = Math.sin(t * 0.18) * 3;
      const bobZ = Math.cos(t * 0.14) * 1.5;
      camera.position.set(bobX, 55 + Math.sin(t * 0.22) * 1.2, 78 + bobZ);
      camera.lookAt(0, 2, 0);

      const list = agentsRef.current;
      for (const mesh of Object.values(avatars.parts)) mesh.count = list.length;
      agentHalo.count = list.length;
      hitMesh.count = list.length;

      for (let i = 0; i < list.length; i++) {
        const agent = list[i];
        const seed = hash(agent.id);
        const tribe = tribesRef.current.find((item) => item.id === agent.tribeId);
        const [homeX, homeZ] = pctToWorld(agent.x, agent.y);
        const selected = selectedRef.current === agent.id;
        const hovered = hoveredIdx === i;
        const archetype = ARCHETYPES[seed % ARCHETYPES.length];

        const speed =
          agent.state === "converted"
            ? 1.35
            : agent.state === "repelled"
              ? 1.1
              : agent.state === "curious"
                ? 1.0
                : 0.8;
        const orbit = t * speed * 0.55 + unit(seed, 1) * Math.PI * 2;
        const walk = orbit * 7.4 + unit(seed, 2) * Math.PI * 2;
        const step = Math.sin(walk);
        const pulse = Math.abs(step);
        const radius = agent.isHero ? 1.35 : 0.75 + unit(seed, 3) * 1.15;
        const wx = homeX + Math.cos(orbit) * radius + Math.sin(orbit * 2.1) * 0.18;
        const wz = homeZ + Math.sin(orbit) * radius * 0.72 + Math.cos(orbit * 1.7) * 0.18;

        const center = tribeCenters.get(agent.tribeId);
        let rotY = 0;
        if (center) {
          const tangent = Math.atan2(-Math.sin(orbit), Math.cos(orbit) * 0.72);
          const inward = Math.atan2(center.x - wx, center.z - wz);
          rotY = THREE.MathUtils.lerp(tangent, inward, 0.25);
        }

        const stateColor = STATE_COLOR[agent.state] ?? STATE_COLOR.idle;
        const baseShirt = new THREE.Color(tribe?.accent ?? pick(CLOTHES, seed, 4));
        const basePants = new THREE.Color(pick(PANTS, seed, 5));
        const baseSkin = new THREE.Color(pick(SKIN, seed, 6));
        const baseHair = new THREE.Color(pick(HAIR, seed, 7));
        const baseShoes = new THREE.Color(pick(SHOES, seed, 8));

        // Before exposure, agents keep their own colorful population identity.
        // After a round, the main clothes/body clearly encode the reaction state.
        const exposed = currentRound > 0 && agent.state !== "idle";
        const shirt = exposed ? stateColor.clone() : baseShirt;
        const pants = exposed ? stateColor.clone().lerp(basePants, 0.22) : basePants;
        const arms = exposed ? stateColor.clone().lerp(baseSkin, 0.18) : baseShirt.clone().lerp(baseSkin, 0.25);
        const skin = exposed && agent.state === "repelled" ? baseSkin.clone().lerp(stateColor, 0.2) : baseSkin;
        const hair = exposed && agent.state === "converted" ? baseHair.clone().lerp(stateColor, 0.25) : baseHair;
        const shoes = exposed ? stateColor.clone().lerp(baseShoes, 0.34) : baseShoes;

        if (selected) {
          shirt.lerp(new THREE.Color("#ffffff"), 0.22);
          pants.lerp(new THREE.Color("#ffffff"), 0.12);
        }

        const baseScale = STATE_SCALE[agent.state] ?? 1;
        const finalScale =
          baseScale +
          (agent.isHero ? 0.06 * (1 + Math.sin(t * 3.4)) : 0) +
          (hovered ? 0.1 : 0) +
          (selected ? 0.18 : 0);
        const sideSway = Math.sin(walk * 0.5) * 0.055;
        const stride = step * (agent.state === "idle" ? 0.08 : 0.28);
        const armSwing = step * (agent.state === "idle" ? 0.14 : 0.68);
        const legSwing = step * (agent.state === "idle" ? 0.1 : 0.56);
        const leftLift = Math.max(0, step) * 0.18;
        const rightLift = Math.max(0, -step) * 0.18;

        rootPos.set(wx, (selected ? 0.45 : 0) + pulse * 0.1, wz);
        rootEuler.set(0, rotY + sideSway, -sideSway * 0.35);
        rootQuat.setFromEuler(rootEuler);
        partScale.set(
          finalScale * archetype.width,
          finalScale * archetype.height,
          finalScale,
        );

        setPart("torso", i, shirt, new THREE.Vector3(0, 1.65, 0), new THREE.Euler(pulse * 0.04, 0, sideSway * 2), new THREE.Vector3(1, 1, 1));
        setPart("hips", i, pants, new THREE.Vector3(0, 1.02, 0), new THREE.Euler(0, 0, -sideSway), new THREE.Vector3(1, 1, 1));
        setPart("head", i, skin, new THREE.Vector3(0, 2.42 + pulse * 0.035, 0), new THREE.Euler(0, Math.sin(orbit * 1.7) * 0.12, sideSway), new THREE.Vector3(1, 1, 1));
        setPart("hair", i, hair, new THREE.Vector3(0, 2.72, archetype.hair === 1 ? -0.02 : 0.02), new THREE.Euler(0, Math.sin(orbit * 1.7) * 0.12, sideSway), new THREE.Vector3(archetype.hair === 2 ? 0.74 : 1, archetype.hair === 0 ? 0.72 : 1.12, archetype.hair === 1 ? 1.12 : 1));
        setPart("leftArm", i, arms, new THREE.Vector3(-archetype.shoulder, 1.5, 0), new THREE.Euler(-armSwing, 0, 0.22), new THREE.Vector3(1, 1, 1));
        setPart("rightArm", i, arms, new THREE.Vector3(archetype.shoulder, 1.5, 0), new THREE.Euler(armSwing, 0, -0.22), new THREE.Vector3(1, 1, 1));
        setPart("leftLeg", i, pants, new THREE.Vector3(-0.24, 0.43 + leftLift * 0.45, stride * 0.2), new THREE.Euler(legSwing, 0, 0.04), new THREE.Vector3(1, 1, 1));
        setPart("rightLeg", i, pants, new THREE.Vector3(0.24, 0.43 + rightLift * 0.45, -stride * 0.2), new THREE.Euler(-legSwing, 0, -0.04), new THREE.Vector3(1, 1, 1));
        setPart("leftShoe", i, shoes, new THREE.Vector3(-0.24, 0.06 + leftLift, 0.14 + stride * 0.34), new THREE.Euler(leftLift > 0 ? -0.18 : 0.08, 0, 0), new THREE.Vector3(1, 1, 1));
        setPart("rightShoe", i, shoes, new THREE.Vector3(0.24, 0.06 + rightLift, 0.14 - stride * 0.34), new THREE.Euler(rightLift > 0 ? -0.18 : 0.08, 0, 0), new THREE.Vector3(1, 1, 1));

        const haloVisible = agent.state === "converted" || selected;
        const haloScale = haloVisible ? 1 + Math.sin(t * 2 + i) * 0.1 : 0.0001;
        matrix.compose(
          new THREE.Vector3(wx, 0.05, wz),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)),
          new THREE.Vector3(haloScale, haloScale, haloScale),
        );
        agentHalo.setMatrixAt(i, matrix);

        // Invisible click hitbox cylinder — centered on the buyer, big radius.
        const hitScale = finalScale * (hovered || selected ? 1.15 : 1);
        matrix.compose(
          new THREE.Vector3(wx, 2.2, wz),
          new THREE.Quaternion(),
          new THREE.Vector3(hitScale, hitScale, hitScale),
        );
        hitMesh.setMatrixAt(i, matrix);
      }

      for (const mesh of Object.values(avatars.parts)) {
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
      agentHalo.instanceMatrix.needsUpdate = true;
      hitMesh.instanceMatrix.needsUpdate = true;

      const labels: Overlay[] = [];
      const rect = renderer.domElement.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      for (const tribe of agentsRef.current.length > 0 ? tribesRef.current : []) {
        const center = tribeCenters.get(tribe.id);
        if (!center) continue;
        screenProjector.set(center.x, 8.5, center.z).project(camera);
        labels.push({
          id: `tribe-${tribe.id}`,
          type: "tribe",
          text: tribe.name,
          emoji: tribe.emoji,
          worldX: center.x,
          worldY: 8.5,
          worldZ: center.z,
          screenX: (screenProjector.x * 0.5 + 0.5) * w,
          screenY: (-screenProjector.y * 0.5 + 0.5) * h,
          visible: screenProjector.z < 1,
        });
      }

      const hero = agentsRef.current.find((agent) => agent.isHero);
      if (hero && selectedRef.current === hero.id) {
        const [hx, hz] = pctToWorld(hero.x, hero.y);
        screenProjector.set(hx, 5.2, hz).project(camera);
        labels.push({
          id: `hero-${hero.id}`,
          type: "hero-bubble",
          text: hero.name,
          sub:
            hero.state === "converted"
              ? "It wasn't on me. Bought before coffee."
              : "Reading the page now...",
          worldX: hx,
          worldY: 5.2,
          worldZ: hz,
          screenX: (screenProjector.x * 0.5 + 0.5) * w,
          screenY: (-screenProjector.y * 0.5 + 0.5) * h,
          visible: screenProjector.z < 1,
        });
      }
      setOverlays(labels);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      avatars.geometries.forEach((geometry) => geometry.dispose());
      avatars.material.dispose();
      agentHalo.geometry.dispose();
      if (agentHalo.material instanceof THREE.Material) agentHalo.material.dispose();
      hitMesh.geometry.dispose();
      if (hitMesh.material instanceof THREE.Material) hitMesh.material.dispose();
      halos.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        if (mesh.material instanceof THREE.Material) mesh.material.dispose();
      });
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!webglOk) {
    return (
      <div className="w-full h-full rounded-2xl border border-ink-700/70 bg-ink-900/60 flex items-center justify-center text-ink-400 text-sm p-6 text-center">
        WebGL is unavailable in this browser. The simulation still runs; the
        visual is disabled here.
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-ink-700/70 bg-ink-900/60 backdrop-blur-sm">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="absolute inset-0 pointer-events-none">
        {overlays
          .filter((overlay) => overlay.visible)
          .map((overlay) =>
            overlay.type === "tribe" ? (
              <div
                key={overlay.id}
                className="absolute"
                style={{
                  left: overlay.screenX,
                  top: overlay.screenY,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="text-[11px] font-medium tracking-wide text-white/90 px-2 py-1 rounded-md bg-white/10 border border-white/20 backdrop-blur-md whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <span className="mr-1">{overlay.emoji}</span>
                  {overlay.text}
                </div>
              </div>
            ) : (
              <div
                key={overlay.id}
                className="absolute"
                style={{
                  left: overlay.screenX,
                  top: overlay.screenY,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="max-w-[220px] px-3 py-2 rounded-xl bg-white/12 border border-white/25 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_22px_rgba(0,0,0,0.35)]">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-plasma">
                    {overlay.text} · hero buyer
                  </div>
                  <div className="text-[12px] text-white/95 leading-snug mt-0.5">
                    {overlay.sub}
                  </div>
                </div>
              </div>
            ),
          )}
      </div>

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

      {agents.length > 0 && (
        <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/8 border border-white/15 backdrop-blur-md z-10 pointer-events-none">
          {[
            { label: "Converted", color: "#3affe9" },
            { label: "Curious", color: "#ffcf6b" },
            { label: "Saw it", color: "#6bb6ff" },
            { label: "Repelled", color: "#ff4768" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-white/70">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
              />
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
