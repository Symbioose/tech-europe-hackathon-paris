import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Low-poly capsule pedestrian — cylinder body + sphere head, merged.
 * Adapted from the buildgen pattern (ctrl-cheeb-del/buildgen,
 * lib/npc/npc-pedestrian-geometry.ts) for use as a singleton geometry
 * powering an InstancedMesh of 70 agents.
 */
let sharedGeometry: THREE.BufferGeometry | null = null;

export function getPedestrianGeometry(): THREE.BufferGeometry {
  if (sharedGeometry) return sharedGeometry;

  const body = new THREE.CylinderGeometry(0.55, 0.7, 2.5, 10);
  body.translate(0, 1.25, 0);

  const head = new THREE.SphereGeometry(0.45, 14, 10);
  head.translate(0, 2.9, 0);

  // Use the official merge helper — handles non-indexed/indexed mismatch + UVs.
  const merged = mergeGeometries([body, head], false) ?? body;
  merged.computeBoundingSphere();
  merged.computeBoundingBox();

  body.dispose();
  head.dispose();

  sharedGeometry = merged;
  return merged;
}

export function disposePedestrianGeometry() {
  sharedGeometry?.dispose();
  sharedGeometry = null;
}
