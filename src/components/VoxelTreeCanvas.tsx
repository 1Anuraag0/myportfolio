import { useEffect, useRef } from 'react';

/**
 * VoxelTreeCanvas — Embeds the exact 3d-tree scene.js inside the React app.
 * 
 * Because scene.js uses top-level `await` and WebGPU renderer that expects
 * to own the full page, we dynamically import and execute the scene logic
 * targeting our container div instead of document.body.
 */
export default function VoxelTreeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const container = containerRef.current;

    // We dynamically run the scene code targeting our container
    const initScene = async () => {
      try {
        // @ts-ignore - Import three.js WebGPU
        const THREE = await import('three/webgpu');
        const TSL = await import('three/tsl');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js');

        const { color, float, vec3, normalize, positionWorld, cameraPosition, pow, max, dot, reflect, mix, uniform, materialReference, pass, mrt, output, normalView, normalWorld, metalness, roughness } = TSL;

        // Dynamic import for GTAO, SSR, Bloom
        let ao: any, denoise: any, ssrModule: any, bloomModule: any;
        try {
          const gtaoMod = await import('three/examples/jsm/tsl/display/GTAONode.js');
          ao = (gtaoMod as any).ao;
        } catch (e: any) { console.warn('GTAO not available:', e.message); }
        try {
          const denoiseMod = await import('three/examples/jsm/tsl/display/DenoiseNode.js');
          denoise = (denoiseMod as any).denoise;
        } catch (e: any) { console.warn('Denoise not available:', e.message); }
        try {
          ssrModule = await import('three/examples/jsm/tsl/display/SSRNode.js');
        } catch (e: any) { console.warn('SSR not available:', e.message); }
        try {
          bloomModule = await import('three/examples/jsm/tsl/display/BloomNode.js');
        } catch (e: any) { console.warn('Bloom not available:', e.message); }

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.5, 500);
        camera.position.set(28, 28, 58);
        camera.lookAt(0, 10, 0);

        let renderer: any;
        try {
          renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true });
          renderer.setSize(container.clientWidth, container.clientHeight);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.0;
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.VSMShadowMap;
          container.appendChild(renderer.domElement);
          await renderer.init();
        } catch (e) {
          console.warn('WebGPU not available, falling back:', e);
          renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL: true, alpha: true });
          renderer.setSize(container.clientWidth, container.clientHeight);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.0;
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.VSMShadowMap;
          container.appendChild(renderer.domElement);
          await renderer.init();
        }

        // Procedural sky environment
        const pmremGenerator = new THREE.PMREMGenerator(renderer);

        function createSkyEnvironment() {
          const envScene = new THREE.Scene();
          const skyGeo = new THREE.SphereGeometry(50, 32, 16);
          const skyMat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
          const skyUV = normalWorld;
          skyMat.colorNode = mix(
            color(0x87ceeb),
            color(0xffeedd),
            pow(max(float(0).sub(skyUV.y), float(0)), float(0.8))
          ).add(
            mix(color(0x000000), color(0xfff5e0), max(skyUV.y, float(0)).mul(float(0.3)))
          );
          const skyMesh = new THREE.Mesh(skyGeo, skyMat);
          skyMesh.name = 'skyDome';
          envScene.add(skyMesh);

          const sunGeo = new THREE.SphereGeometry(3, 16, 8);
          const sunMat = new THREE.MeshBasicNodeMaterial();
          sunMat.colorNode = color(0xffffee).mul(float(2.0));
          const sunMesh = new THREE.Mesh(sunGeo, sunMat);
          sunMesh.name = 'sunGlow';
          sunMesh.position.set(15, 20, 10);
          envScene.add(sunMesh);

          const envRT = pmremGenerator.fromScene(envScene, 0.04);
          // Use procedural sky only for environment lighting/reflections
          scene.environment = envRT.texture;
          // No background — transparent canvas so hero mandala shows through
          scene.background = null;

          envScene.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          });
        }
        createSkyEnvironment();

        // Lazy-load HDR for higher quality reflections only (no background change)
        const rgbeLoader = new RGBELoader();
        requestIdleCallback(() => {
          rgbeLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr', (texture: any) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            if (scene.environment) (scene.environment as any).dispose();
            // Only update environment for reflections, keep background as ink color
            scene.environment = texture;
          });
        }, { timeout: 3000 });

        // Shared geometry
        const voxelSize = 1.0;
        const gap = 0.0;
        const step = voxelSize + gap;
        const voxelGeo = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize, 1, 1, 1);

        // Color palettes
        const grassColors = ['#4a8c3f', '#3d7a34', '#5a9e4a', '#2d6b24', '#68ad58', '#3f8535', '#4d9040', '#55a048'];
        const rockColors = ['#a0978a', '#8c8478', '#b5ad9e', '#9a9184', '#c2bab0', '#7d756a', '#bbb3a6', '#938b7f'];
        const trunkColors = ['#4a3728', '#3d2e20', '#5c4535', '#2e2218', '#6b5444'];
        const leafColors = ['#e63c2e', '#d4452f', '#f05a3a', '#c93525', '#ff6b45', '#e8502a', '#d94a30', '#f24832', '#ff7f50', '#e06030'];
        const flowerColors = ['#e63c2e', '#f05a3a', '#ff6b45', '#f5a623', '#ff8c42', '#e8502a'];
        const dirtColors = ['#8B6914', '#7A5C12', '#6B4E10', '#9C7A1E', '#5C4010', '#A07828', '#6E5518'];
        const stoneUndersideColors = ['#706860', '#5E564F', '#887F75', '#4D4640', '#63594F', '#7A7068'];

        // Instanced rendering batches
        const voxelMats: any[] = [];
        const voxels: any[] = [];
        const categoryBatches: any = {};
        const occupiedPositions = new Set();

        function posKey(x: number, y: number, z: number) {
          return `${Math.round(x * 100)},${Math.round(y * 100)},${Math.round(z * 100)}`;
        }
        function pickRandom(arr: string[]) {
          return arr[Math.floor(Math.random() * arr.length)];
        }

        function createVoxel(name: string, x: number, y: number, z: number, hex: string, roughnessVal: number, metalnessVal: number, category: string) {
          const pk = posKey(x, y, z);
          if (occupiedPositions.has(pk)) return;
          occupiedPositions.add(pk);
          const cat = category || 'default';
          if (!categoryBatches[cat]) {
            categoryBatches[cat] = { rough: roughnessVal ?? 0.60, metal: metalnessVal ?? 0.15, geo: 'voxel', transforms: [], colors: [] };
          }
          categoryBatches[cat].transforms.push({ x, y, z, sx: 1, sy: 1, sz: 1, rx: 0, rz: 0 });
          categoryBatches[cat].colors.push(hex);
        }

        function createCustomVoxel(hex: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, rz: number, roughnessVal: number, metalnessVal: number, category: string) {
          const pk = posKey(x, y, z);
          if (occupiedPositions.has(pk)) return;
          occupiedPositions.add(pk);
          const cat = category || 'custom';
          const geoKey = sx.toFixed(2) + '_' + sy.toFixed(2) + '_' + sz.toFixed(2);
          const catKey = cat + '|' + geoKey;
          if (!categoryBatches[catKey]) {
            categoryBatches[catKey] = { rough: roughnessVal ?? 0.60, metal: metalnessVal ?? 0.15, geo: geoKey, transforms: [], colors: [] };
          }
          categoryBatches[catKey].transforms.push({ x, y, z, sx: 1, sy: 1, sz: 1, rx: rx || 0, rz: rz || 0 });
          categoryBatches[catKey].colors.push(hex);
        }

        const geoCache: any = { 'voxel': voxelGeo };
        function getGeo(key: string, sx: number, sy: number, sz: number) {
          if (key === 'voxel') return voxelGeo;
          if (!geoCache[key]) {
            geoCache[key] = new THREE.BoxGeometry(voxelSize * sx, voxelSize * sy, voxelSize * sz);
          }
          return geoCache[key];
        }

        const categoryMatPresets: any = {
          grass:     { rough: 0.85, metal: 0.05, clearcoat: 0, physical: false },
          underside: { rough: 0.92, metal: 0.03, clearcoat: 0, physical: false },
          rock:      { rough: 0.75, metal: 0.10, clearcoat: 0.3, physical: true },
          trunk:     { rough: 0.90, metal: 0.05, clearcoat: 0, physical: false },
          leaf:      { rough: 0.70, metal: 0.05, clearcoat: 0.3, physical: true },
          flower:    { rough: 0.70, metal: 0.00, clearcoat: 0, physical: false },
          grassTuft: { rough: 0.90, metal: 0.00, clearcoat: 0, physical: false },
          mushroom:  { rough: 0.80, metal: 0.00, clearcoat: 0, physical: false },
        };

        function buildInstancedMeshes() {
          const dummy = new THREE.Object3D();
          const tmpColor = new THREE.Color();
          for (const catKey in categoryBatches) {
            const batch = categoryBatches[catKey];
            const count = batch.transforms.length;
            if (count === 0) continue;

            const baseCat = catKey.split('|')[0];
            const preset = categoryMatPresets[baseCat] || { rough: 0.60, metal: 0.15, clearcoat: 0.3, physical: true };

            let mat: any;
            if (preset.physical) {
              mat = new THREE.MeshPhysicalNodeMaterial();
              mat.clearcoat = preset.clearcoat;
              mat.clearcoatRoughness = 0.5;
              mat.reflectivity = 0.3;
              mat.ior = 1.5;
            } else {
              mat = new THREE.MeshStandardNodeMaterial();
            }
            mat.color = new THREE.Color(0xffffff);
            mat.roughness = preset.rough;
            mat.metalness = preset.metal;
            mat.envMapIntensity = 1.2;
            mat.flatShading = true;
            mat.polygonOffset = true;
            mat.polygonOffsetFactor = 1;
            mat.polygonOffsetUnits = 1;
            voxelMats.push(mat);

            let geo;
            if (batch.geo === 'voxel') {
              geo = voxelGeo;
            } else {
              const parts = batch.geo.split('_').map(Number);
              geo = getGeo(batch.geo, parts[0], parts[1], parts[2]);
            }

            const im = new THREE.InstancedMesh(geo, mat, count);
            im.name = 'cat_' + catKey.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
            im.castShadow = true;
            im.receiveShadow = true;

            for (let i = 0; i < count; i++) {
              const t = batch.transforms[i];
              dummy.position.set(t.x, t.y, t.z);
              dummy.rotation.set(t.rx, 0, t.rz);
              dummy.scale.set(t.sx, t.sy, t.sz);
              dummy.updateMatrix();
              im.setMatrixAt(i, dummy.matrix);
              tmpColor.set(batch.colors[i]);
              im.setColorAt(i, tmpColor);
            }
            im.instanceMatrix.needsUpdate = true;
            if (im.instanceColor) im.instanceColor.needsUpdate = true;
            im.frustumCulled = true;
            scene.add(im);
            voxels.push(im);
          }
        }

        // === FLOATING ISLAND ===
        const hillData: any[] = [];
        const undersideData: any[] = [];

        function pseudoNoise(x: number, z: number) {
          return Math.sin(x * 1.7 + z * 0.9) * 0.4 + Math.cos(z * 2.1 - x * 0.6) * 0.35 + Math.sin((x + z) * 1.1) * 0.25;
        }

        // Base layer (y=0)
        for (let x = -8; x <= 8; x++) {
          for (let z = -6; z <= 6; z++) {
            const dist = Math.sqrt(x * x * 0.45 + z * z * 0.55);
            if (dist < 7.5 + pseudoNoise(x, z) * 1.5) {
              hillData.push({ x, y: 0, z, type: 'grass' });
            }
          }
        }

        // Sub-base fill (y=-1)
        for (let x = -9; x <= 9; x++) {
          for (let z = -7; z <= 7; z++) {
            const dist = Math.sqrt(x * x * 0.4 + z * z * 0.5);
            if (dist < 8.5 + pseudoNoise(x * 0.7, z * 0.7) * 1.2) {
              hillData.push({ x, y: -1, z, type: 'grass' });
            }
          }
        }

        // Layer 1 (y=1)
        for (let x = -7; x <= 6; x++) {
          for (let z = -5; z <= 5; z++) {
            const dist = Math.sqrt(x * x * 0.5 + z * z * 0.6);
            if (dist < 6.0 + pseudoNoise(x, z) * 1.2) {
              hillData.push({ x, y: 1, z, type: 'grass' });
            }
          }
        }

        // Layer 2 (y=2)
        for (let x = -5; x <= 4; x++) {
          for (let z = -4; z <= 3; z++) {
            const dist = Math.sqrt(x * x * 0.55 + z * z * 0.65);
            if (dist < 4.5 + pseudoNoise(x, z) * 0.9) {
              hillData.push({ x, y: 2, z, type: 'grass' });
            }
          }
        }

        // Layer 3 (y=3)
        for (let x = -4; x <= 3; x++) {
          for (let z = -3; z <= 2; z++) {
            const dist = Math.sqrt(x * x * 0.6 + z * z * 0.7);
            if (dist < 3.5 + pseudoNoise(x, z) * 0.7) {
              hillData.push({ x, y: 3, z, type: 'grass' });
            }
          }
        }

        // Layer 4 (y=4)
        for (let x = -3; x <= 2; x++) {
          for (let z = -2; z <= 2; z++) {
            const dist = Math.sqrt(x * x * 0.7 + z * z * 0.8);
            if (dist < 2.8 + pseudoNoise(x, z) * 0.5) {
              hillData.push({ x, y: 4, z, type: 'grass' });
            }
          }
        }

        // Layer 5 (y=5)
        for (let x = -2; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            const dist = Math.sqrt(x * x + z * z);
            if (dist < 2.0) {
              hillData.push({ x, y: 5, z, type: 'grass' });
            }
          }
        }

        // Layer 6 (y=6)
        for (let x = -1; x <= 0; x++) {
          for (let z = -1; z <= 0; z++) {
            hillData.push({ x, y: 6, z, type: 'grass' });
          }
        }

        // Secondary smaller hill
        for (let x = 4; x <= 8; x++) {
          for (let z = -2; z <= 3; z++) {
            const cx = x - 6, cz = z - 0.5;
            const dist = Math.sqrt(cx * cx + cz * cz);
            if (dist < 2.8 + pseudoNoise(x, z) * 0.5) hillData.push({ x, y: 1, z, type: 'grass' });
            if (dist < 2.0 + pseudoNoise(x, z) * 0.3) hillData.push({ x, y: 2, z, type: 'grass' });
            if (dist < 1.2) hillData.push({ x, y: 3, z, type: 'grass' });
          }
        }

        // Small mound behind
        for (let x = -6; x <= -3; x++) {
          for (let z = -5; z <= -2; z++) {
            const cx = x + 4.5, cz = z + 3.5;
            const dist = Math.sqrt(cx * cx + cz * cz);
            if (dist < 2.0 + pseudoNoise(x, z) * 0.4) hillData.push({ x, y: 1, z, type: 'grass' });
            if (dist < 1.2) hillData.push({ x, y: 2, z, type: 'grass' });
          }
        }

        // === FLOATING ISLAND UNDERSIDE ===
        for (let y = -2; y >= -14; y--) {
          const depth = Math.abs(y + 1);
          const maxRadius = Math.max(0.5, 8.5 - depth * 0.55 + Math.sin(depth * 0.8) * 0.8);
          const cx = Math.sin(depth * 0.7) * 0.4;
          const cz = Math.cos(depth * 0.9) * 0.3;
          for (let x = -10; x <= 10; x++) {
            for (let z = -8; z <= 8; z++) {
              const dx = x - cx;
              const dz = z - cz;
              const dist = Math.sqrt(dx * dx * 0.45 + dz * dz * 0.55);
              const noise = pseudoNoise(x * 0.8 + depth * 0.3, z * 0.8 - depth * 0.2) * (1.0 + depth * 0.08);
              if (dist < maxRadius + noise) {
                const isDirt = depth < 4;
                undersideData.push({ x, y, z, type: isDirt ? 'dirt' : 'stone' });
              }
            }
          }
        }

        // Stalactites
        const stalactites = [
          { cx: 0, cz: 0, length: 4, r: 1.2 },
          { cx: -3, cz: -1, length: 3, r: 0.9 },
          { cx: 2, cz: 2, length: 3, r: 0.8 },
          { cx: -1, cz: -3, length: 2, r: 0.7 },
          { cx: 3, cz: -2, length: 2, r: 0.6 },
          { cx: -4, cz: 1, length: 2, r: 0.7 },
          { cx: 1, cz: -4, length: 2, r: 0.5 },
          { cx: -2, cz: 3, length: 3, r: 0.8 },
        ];
        stalactites.forEach(st => {
          for (let y = -14; y >= -14 - st.length; y--) {
            const tipDist = Math.abs(y + 14);
            const r = Math.max(0.3, st.r - tipDist * 0.25);
            for (let x = Math.floor(st.cx - r - 1); x <= Math.ceil(st.cx + r + 1); x++) {
              for (let z = Math.floor(st.cz - r - 1); z <= Math.ceil(st.cz + r + 1); z++) {
                const dx = x - st.cx;
                const dz = z - st.cz;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < r + pseudoNoise(x + tipDist, z - tipDist) * 0.3) {
                  undersideData.push({ x, y, z, type: 'stone' });
                }
              }
            }
          }
        });

        // Place underside voxels
        undersideData.forEach((d: any, i: number) => {
          const c = d.type === 'dirt' ? pickRandom(dirtColors) : pickRandom(stoneUndersideColors);
          createVoxel(`underside_${i}`, d.x * step, d.y * step + voxelSize / 2, d.z * step, c, 0.92, 0.03, 'underside');
        });

        // Place grass voxels
        hillData.forEach((d: any, i: number) => {
          const c = pickRandom(grassColors);
          createVoxel(`grass_${i}`, d.x * step, d.y * step + voxelSize / 2, d.z * step, c, 0.85, 0.05, 'grass');
        });

        // === ROCKS ===
        const rockPositions = [
          { x: -2, y: 5, z: -1 }, { x: -1, y: 5, z: -1 }, { x: 0, y: 5, z: -1 }, { x: 1, y: 5, z: -1 },
          { x: -2, y: 5, z: 0 }, { x: -1, y: 5, z: 0 }, { x: 0, y: 5, z: 0 }, { x: 1, y: 5, z: 0 },
          { x: -1, y: 5, z: 1 }, { x: 0, y: 5, z: 1 }, { x: 1, y: 5, z: 1 },
          { x: -2, y: 5, z: 1 },
          { x: -1, y: 6, z: -1 }, { x: 0, y: 6, z: -1 }, { x: 1, y: 6, z: -1 },
          { x: -2, y: 6, z: 0 }, { x: -1, y: 6, z: 0 }, { x: 0, y: 6, z: 0 }, { x: 1, y: 6, z: 0 },
          { x: -1, y: 6, z: 1 }, { x: 0, y: 6, z: 1 },
          { x: -2, y: 6, z: -1 },
          { x: -1, y: 7, z: -1 }, { x: 0, y: 7, z: -1 },
          { x: -1, y: 7, z: 0 }, { x: 0, y: 7, z: 0 }, { x: 1, y: 7, z: 0 },
          { x: 0, y: 7, z: 1 }, { x: -1, y: 7, z: 1 },
          { x: 0, y: 8, z: 0 }, { x: -1, y: 8, z: 0 }, { x: 0, y: 8, z: -1 },
          { x: -1, y: 8, z: -1 },
          { x: 3, y: 2, z: 2 }, { x: 3, y: 3, z: 2 },
          { x: 4, y: 1, z: -1 }, { x: 4, y: 2, z: -1 },
          { x: -4, y: 1, z: -2 }, { x: -4, y: 2, z: -2 },
          { x: -3, y: 2, z: 2 }, { x: -3, y: 3, z: 2 },
          { x: 5, y: 1, z: 1 }, { x: 5, y: 1, z: 0 },
          { x: -5, y: 1, z: 0 },
          { x: 2, y: 3, z: -2 }, { x: 2, y: 4, z: -2 },
          { x: -3, y: 3, z: -1 },
          { x: 6, y: 1, z: -2 }, { x: -6, y: 0, z: 2 },
          { x: 1, y: 4, z: 2 }, { x: -2, y: 4, z: -2 },
          { x: 3, y: 1, z: -3 }, { x: -2, y: 1, z: 3 },
          { x: 6, y: 2, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 7, y: 2, z: 1 },
        ];
        rockPositions.forEach((d, i) => {
          const c = pickRandom(rockColors);
          createVoxel(`rock_${i}`, d.x * step, d.y * step + voxelSize / 2, d.z * step, c, 0.75, 0.1, 'rock');
        });

        // === TREE TRUNK ===
        const trunkPositions = [
          { x: 0, y: 9, z: 0 }, { x: -1, y: 9, z: 0 }, { x: 0, y: 9, z: -1 }, { x: -1, y: 9, z: -1 },
          { x: 0, y: 10, z: 0 }, { x: -1, y: 10, z: 0 }, { x: 0, y: 10, z: -1 }, { x: -1, y: 10, z: -1 },
          { x: 0, y: 11, z: 0 }, { x: -1, y: 11, z: 0 }, { x: 0, y: 11, z: -1 },
          { x: 0, y: 12, z: 0 }, { x: -1, y: 12, z: 0 }, { x: 0, y: 12, z: -1 },
          { x: 0, y: 13, z: 0 }, { x: -1, y: 13, z: 0 },
          { x: 0, y: 14, z: 0 }, { x: -1, y: 14, z: 0 },
          { x: 0, y: 15, z: 0 },
          { x: 0, y: 16, z: 0 },
          { x: -1, y: 14, z: 0 }, { x: -2, y: 15, z: 0 }, { x: -3, y: 15, z: 0 },
          { x: -3, y: 16, z: 0 }, { x: -4, y: 16, z: 0 }, { x: -4, y: 16, z: 1 },
          { x: -5, y: 17, z: 0 }, { x: -5, y: 17, z: 1 },
          { x: 1, y: 14, z: 0 }, { x: 2, y: 14, z: 0 }, { x: 2, y: 15, z: 0 },
          { x: 3, y: 15, z: 0 }, { x: 3, y: 16, z: 0 }, { x: 4, y: 16, z: 0 },
          { x: 4, y: 17, z: 0 }, { x: 5, y: 17, z: -1 },
          { x: 0, y: 14, z: 1 }, { x: 0, y: 15, z: 1 }, { x: 0, y: 15, z: 2 },
          { x: 1, y: 16, z: 2 }, { x: 1, y: 16, z: 3 },
          { x: 0, y: 13, z: -1 }, { x: 0, y: 14, z: -2 }, { x: 0, y: 15, z: -2 },
          { x: -1, y: 15, z: -2 }, { x: -1, y: 16, z: -3 }, { x: 0, y: 16, z: -3 },
          { x: 0, y: 17, z: 0 }, { x: 0, y: 18, z: 0 },
          { x: 1, y: 13, z: -1 }, { x: -2, y: 14, z: -1 },
          { x: 2, y: 16, z: 1 }, { x: -3, y: 17, z: -1 },
          { x: 1, y: 8, z: 0 }, { x: -2, y: 8, z: 0 }, { x: 0, y: 8, z: 1 }, { x: -1, y: 8, z: -1 },
          { x: 1, y: 7, z: 1 }, { x: -2, y: 7, z: -1 },
        ];
        trunkPositions.forEach((d, i) => {
          const c = pickRandom(trunkColors);
          createVoxel(`trunk_${i}`, d.x * step, d.y * step + voxelSize / 2, d.z * step, c, 0.9, 0.05, 'trunk');
        });

        // === LEAVES / CANOPY ===
        const leafPositions: any[] = [];
        const leafSet = new Set();

        function addLeaf(x: number, y: number, z: number) {
          const key = `${x},${y},${z}`;
          if (!leafSet.has(key)) {
            leafSet.add(key);
            leafPositions.push({ x, y, z });
          }
        }

        const canopyCenterX = 0, canopyCenterY = 20, canopyCenterZ = 0;
        const canopyRadiusH = 6.5;
        const canopyRadiusV = 4.5;

        for (let x = -8; x <= 8; x++) {
          for (let y = 15; y <= 26; y++) {
            for (let z = -7; z <= 7; z++) {
              const dx = x - canopyCenterX;
              const dy = (y - canopyCenterY) * (canopyRadiusH / canopyRadiusV);
              const dz = z - canopyCenterZ;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              const edgeNoise = Math.sin(x * 1.8 + z * 1.4) * 0.7 + Math.cos(y * 1.1 + x * 0.7) * 0.6 + Math.sin(z * 2.3 - y * 0.5) * 0.4;
              if (dist < canopyRadiusH + edgeNoise) {
                if (Math.random() > 0.18) addLeaf(x, y, z);
              }
            }
          }
        }

        const branchTips = [
          { cx: -5, cy: 17, cz: 0, r: 3.5 },
          { cx: -5, cy: 17, cz: 1, r: 2.8 },
          { cx: 5, cy: 17, cz: -1, r: 3.5 },
          { cx: 4, cy: 18, cz: 0, r: 3.0 },
          { cx: 1, cy: 17, cz: 3, r: 3.2 },
          { cx: 1, cy: 17, cz: -3, r: 3.0 },
          { cx: -1, cy: 17, cz: -3, r: 2.8 },
          { cx: 0, cy: 24, cz: 0, r: 3.0 },
          { cx: -2, cy: 23, cz: 1, r: 2.5 },
          { cx: 2, cy: 23, cz: -1, r: 2.5 },
          { cx: 1, cy: 24, cz: 1, r: 2.0 },
          { cx: -1, cy: 24, cz: -1, r: 2.0 },
          { cx: -7, cy: 18, cz: 0, r: 2.0 },
          { cx: 6, cy: 18, cz: 0, r: 2.0 },
          { cx: 0, cy: 18, cz: 5, r: 2.2 },
          { cx: 0, cy: 18, cz: -5, r: 2.2 },
          { cx: -3, cy: 15, cz: 2, r: 2.5 },
          { cx: 3, cy: 15, cz: -2, r: 2.5 },
          { cx: -2, cy: 15, cz: -3, r: 2.0 },
          { cx: 2, cy: 15, cz: 3, r: 2.0 },
        ];
        branchTips.forEach(tip => {
          for (let x = Math.floor(tip.cx - tip.r - 1); x <= Math.ceil(tip.cx + tip.r + 1); x++) {
            for (let y = Math.floor(tip.cy - tip.r); y <= Math.ceil(tip.cy + tip.r + 1); y++) {
              for (let z = Math.floor(tip.cz - tip.r - 1); z <= Math.ceil(tip.cz + tip.r + 1); z++) {
                const dx = x - tip.cx;
                const dy = (y - tip.cy) * 1.15;
                const dz = z - tip.cz;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < tip.r && Math.random() > 0.2) addLeaf(x, y, z);
              }
            }
          }
        });

        // Scattered falling leaves near ground
        for (let i = 0; i < 25; i++) {
          const x = Math.round((Math.random() - 0.5) * 14);
          const z = Math.round((Math.random() - 0.5) * 10);
          const y = Math.floor(Math.random() * 3) + 1;
          addLeaf(x, y, z);
        }

        leafPositions.forEach((d: any, i: number) => {
          const c = pickRandom(leafColors);
          createVoxel(`leaf_${i}`, d.x * step, d.y * step + voxelSize / 2, d.z * step, c, 0.7, 0.05, 'leaf');
        });

        // === FLOWERS + GRASS TUFTS ===
        const grassTopMap: any = {};
        hillData.forEach((d: any) => {
          const key = `${d.x},${d.z}`;
          if (!grassTopMap[key] || d.y > grassTopMap[key]) grassTopMap[key] = d.y;
        });

        const grassTuftColors = ['#3a8530', '#4a9540', '#2d7020', '#5aad50', '#3d8a35'];
        const rockSet = new Set(rockPositions.map(r => `${r.x},${r.z}`));

        Object.entries(grassTopMap).forEach(([key, topY]: any) => {
          const [gx, gz] = key.split(',').map(Number);
          const blocked = rockSet.has(key);

          if (!blocked && Math.random() < 0.40) {
            const numFlowers = Math.random() < 0.3 ? 2 : 1;
            for (let f = 0; f < numFlowers; f++) {
              const c = pickRandom(flowerColors);
              const offsetX = (Math.random() - 0.5) * 0.5;
              const offsetZ = (Math.random() - 0.5) * 0.5;
              createCustomVoxel(c,
                gx * step + offsetX, (topY + 1) * step + voxelSize * 0.22, gz * step + offsetZ,
                0.35, 0.35, 0.35, 0, 0, 0.7, 0.0, 'flower'
              );
            }
          }

          if (!blocked && Math.random() < 0.30) {
            const c = pickRandom(grassTuftColors);
            const offsetX = (Math.random() - 0.5) * 0.6;
            const offsetZ = (Math.random() - 0.5) * 0.6;
            const rx = (Math.random() - 0.5) * 0.15;
            const rz = (Math.random() - 0.5) * 0.15;
            createCustomVoxel(c,
              gx * step + offsetX, (topY + 1) * step + voxelSize * 0.32, gz * step + offsetZ,
              0.25, 0.55, 0.25, rx, rz, 0.9, 0.0, 'grassTuft'
            );
          }
        });

        // === MUSHROOMS ===
        const mushroomColors = ['#f5e6c8', '#e8d5b0', '#d4c49a', '#c9b88e'];
        Object.entries(grassTopMap).forEach(([key, topY]: any) => {
          const [gx, gz] = key.split(',').map(Number);
          if (gx < -2 && Math.random() < 0.15 && !rockSet.has(key)) {
            const c = pickRandom(mushroomColors);
            createCustomVoxel(c,
              gx * step + (Math.random() - 0.5) * 0.3, (topY + 1) * step + voxelSize * 0.15, gz * step + (Math.random() - 0.5) * 0.3,
              0.25, 0.22, 0.25, 0, 0, 0.8, 0.0, 'mushroom'
            );
          }
        });

        // === BUILD ALL INSTANCED MESHES ===
        buildInstancedMeshes();

        // === INSTANCE DATA for repulsion ===
        const instanceData = new Map();
        const _islandBBox = new THREE.Box3();

        {
          const dummy = new THREE.Object3D();
          const mat4 = new THREE.Matrix4();
          voxels.forEach((im: any) => {
            const count = im.count;
            const orig = new Float32Array(count * 3);
            const offsets = new Float32Array(count * 3);
            const randDirs = new Float32Array(count * 3);
            for (let i = 0; i < count; i++) {
              im.getMatrixAt(i, mat4);
              mat4.decompose(dummy.position, dummy.quaternion, dummy.scale);
              orig[i * 3] = dummy.position.x;
              orig[i * 3 + 1] = dummy.position.y;
              orig[i * 3 + 2] = dummy.position.z;
              _islandBBox.expandByPoint(dummy.position);

              const theta = Math.random() * Math.PI * 2;
              const phi = Math.acos(2 * Math.random() - 1);
              randDirs[i * 3] = Math.sin(phi) * Math.cos(theta);
              randDirs[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
              randDirs[i * 3 + 2] = Math.cos(phi);
            }
            instanceData.set(im, { origPositions: orig, offsets, randDirs, count });
          });
          _islandBBox.expandByScalar(3.0);
        }

        // === PARTICLE SYSTEM ===
        const particleGroup = new THREE.Group();
        particleGroup.name = 'particleGroup';
        scene.add(particleGroup);

        // Dust motes
        const dustCount = 120;
        const dustGeo = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustCount * 3);
        const dustVelocities = new Float32Array(dustCount * 3);
        const dustSizes = new Float32Array(dustCount);
        const dustOpacities = new Float32Array(dustCount);
        const dustLifetimes = new Float32Array(dustCount);
        const dustSpeeds = new Float32Array(dustCount);

        for (let i = 0; i < dustCount; i++) {
          dustPositions[i * 3] = (Math.random() - 0.5) * 30;
          dustPositions[i * 3 + 1] = Math.random() * 35 - 5;
          dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 24;
          dustVelocities[i * 3] = (Math.random() - 0.5) * 0.3;
          dustVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
          dustVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
          dustSizes[i] = 0.18 + Math.random() * 0.25;
          dustLifetimes[i] = Math.random();
          dustSpeeds[i] = 0.02 + Math.random() * 0.04;
          dustOpacities[i] = 0.4 + Math.random() * 0.5;
        }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dustSizes, 1));
        dustGeo.setAttribute('aOpacity', new THREE.BufferAttribute(dustOpacities, 1));

        const dustMat = new THREE.PointsNodeMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        });
        dustMat.colorNode = color(0xffffcc);
        dustMat.opacityNode = float(0.65);

        const dustPoints = new THREE.Points(dustGeo, dustMat);
        dustPoints.name = 'dustMotes';
        dustPoints.frustumCulled = false;
        particleGroup.add(dustPoints);

        // Falling leaves
        const fallingLeafCount = 40;
        const leafQuadGeo = new THREE.PlaneGeometry(0.5, 0.5);
        const leafQuadMat = new THREE.MeshBasicNodeMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        leafQuadMat.colorNode = color(0xffffff);
        leafQuadMat.opacityNode = float(0.8);

        const fallingLeaves = new THREE.InstancedMesh(leafQuadGeo, leafQuadMat, fallingLeafCount);
        fallingLeaves.name = 'fallingLeaves';
        fallingLeaves.frustumCulled = false;
        particleGroup.add(fallingLeaves);

        const leafState: any[] = [];
        const leafDummy = new THREE.Object3D();
        const leafParticleColors = ['#e63c2e', '#d4452f', '#f05a3a', '#ff6b45', '#f5a623', '#ff8c42'];

        function resetLeaf(i: number) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 6.0;
          leafState[i] = {
            x: Math.cos(angle) * radius,
            y: 18 + Math.random() * 8,
            z: Math.sin(angle) * radius,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(1.5 + Math.random() * 1.5),
            vz: (Math.random() - 0.5) * 0.8,
            rotX: Math.random() * Math.PI * 2,
            rotY: Math.random() * Math.PI * 2,
            rotZ: Math.random() * Math.PI * 2,
            spinX: (Math.random() - 0.5) * 2.0,
            spinY: (Math.random() - 0.5) * 1.5,
            spinZ: (Math.random() - 0.5) * 2.0,
            scale: 0.25 + Math.random() * 0.45,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleFreq: 1.5 + Math.random() * 2.0,
            wobbleAmp: 0.3 + Math.random() * 0.5,
            life: 0,
            maxLife: 4 + Math.random() * 6,
          };
        }
        for (let i = 0; i < fallingLeafCount; i++) {
          resetLeaf(i);
          leafState[i].life = Math.random() * leafState[i].maxLife;
        }

        // Initialize falling leaf colors
        for (let i = 0; i < fallingLeafCount; i++) {
          const c = new THREE.Color(leafParticleColors[Math.floor(Math.random() * leafParticleColors.length)]);
          fallingLeaves.setColorAt(i, c);
        }
        if (fallingLeaves.instanceColor) fallingLeaves.instanceColor.needsUpdate = true;

        function updateParticles(dt: number) {
          const dtCl = Math.min(dt, 0.05);
          const time = performance.now() * 0.001;

          // Dust motes
          const dPos = dustGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < dustCount; i++) {
            dustLifetimes[i] += dustSpeeds[i] * dtCl;
            if (dustLifetimes[i] > 1) dustLifetimes[i] -= 1;
            dPos[i * 3] += (dustVelocities[i * 3] + Math.sin(time * 0.5 + i * 0.7) * 0.15) * dtCl;
            dPos[i * 3 + 1] += (dustVelocities[i * 3 + 1] + Math.sin(time * 0.3 + i * 1.1) * 0.08) * dtCl;
            dPos[i * 3 + 2] += (dustVelocities[i * 3 + 2] + Math.cos(time * 0.4 + i * 0.9) * 0.15) * dtCl;
            if (dPos[i * 3] > 18) dPos[i * 3] = -18;
            if (dPos[i * 3] < -18) dPos[i * 3] = 18;
            if (dPos[i * 3 + 1] > 35) dPos[i * 3 + 1] = -5;
            if (dPos[i * 3 + 1] < -5) dPos[i * 3 + 1] = 35;
            if (dPos[i * 3 + 2] > 14) dPos[i * 3 + 2] = -14;
            if (dPos[i * 3 + 2] < -14) dPos[i * 3 + 2] = 14;
          }
          dustGeo.attributes.position.needsUpdate = true;

          // Falling leaves
          for (let i = 0; i < fallingLeafCount; i++) {
            const s = leafState[i];
            s.life += dtCl;

            if (s.life >= s.maxLife || s.y < -16) {
              resetLeaf(i);
              const c = new THREE.Color(leafParticleColors[Math.floor(Math.random() * leafParticleColors.length)]);
              fallingLeaves.setColorAt(i, c);
              if (fallingLeaves.instanceColor) fallingLeaves.instanceColor.needsUpdate = true;
            }

            const wobble = Math.sin(time * s.wobbleFreq + s.wobblePhase) * s.wobbleAmp;
            s.x += (s.vx + wobble) * dtCl;
            s.y += s.vy * dtCl;
            s.z += (s.vz + Math.cos(time * s.wobbleFreq * 0.7 + s.wobblePhase) * s.wobbleAmp * 0.6) * dtCl;

            s.rotX += s.spinX * dtCl;
            s.rotY += s.spinY * dtCl;
            s.rotZ += s.spinZ * dtCl;

            const lifeFrac = s.life / s.maxLife;
            const alpha = lifeFrac < 0.1 ? lifeFrac / 0.1 : lifeFrac > 0.85 ? (1 - lifeFrac) / 0.15 : 1.0;

            leafDummy.position.set(s.x, s.y, s.z);
            leafDummy.rotation.set(s.rotX, s.rotY, s.rotZ);
            leafDummy.scale.setScalar(s.scale * alpha);
            leafDummy.updateMatrix();
            fallingLeaves.setMatrixAt(i, leafDummy.matrix);
          }
          fallingLeaves.instanceMatrix.needsUpdate = true;
        }

        // === MOUSE REPULSION ===
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(9999, 9999);
        const repulsionRadius = 10.0;
        const repulsionStrength = 18.0;
        const returnSpeed = 2.5;
        let lastMouseMoveTime = 0;
        const mouseIdleTimeout = 0.08;
        let mouseActive = false;
        const _smoothHitPoint = new THREE.Vector3(9999, 9999, 9999);
        let _hasSmoothedHit = false;
        const hitSmoothSpeed = 12.0;

        const _bboxCenter = new THREE.Vector3();
        _islandBBox.getCenter(_bboxCenter);
        const _rayPlane = new THREE.Plane();
        const _planeIntersect = new THREE.Vector3();

        const handleMouseMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          lastMouseMoveTime = performance.now();
          mouseActive = true;
        };
        container.addEventListener('mousemove', handleMouseMove);

        const handleMouseLeave = () => {
          mouse.x = 9999;
          mouse.y = 9999;
          mouseActive = false;
        };
        container.addEventListener('mouseleave', handleMouseLeave);

        const _hitPoint = new THREE.Vector3();
        const _dir = new THREE.Vector3();
        const _dummy = new THREE.Object3D();
        const _mat4 = new THREE.Matrix4();
        let hasHit = false;

        function updateRepulsion(dt: number) {
          const now = performance.now();
          const mouseIdle = (now - lastMouseMoveTime) / 1000 > mouseIdleTimeout;

          raycaster.setFromCamera(mouse, camera);
          const camDir = raycaster.ray.direction;
          _rayPlane.setFromNormalAndCoplanarPoint(camDir.clone().negate(), _bboxCenter);
          const rawHit = raycaster.ray.intersectPlane(_rayPlane, _planeIntersect) !== null;

          const distToCenter = _planeIntersect.distanceTo(_bboxCenter);
          const maxProxyDist = Math.max(_islandBBox.getSize(new THREE.Vector3()).length() * 0.55, 15);
          const validHit = rawHit && distToCenter < maxProxyDist;

          if (validHit) {
            _hitPoint.copy(_planeIntersect);
            if (!_hasSmoothedHit) {
              _smoothHitPoint.copy(_hitPoint);
              _hasSmoothedHit = true;
            } else if (!mouseIdle) {
              const smoothFactor = 1.0 - Math.exp(-hitSmoothSpeed * Math.min(dt, 0.05));
              _smoothHitPoint.lerp(_hitPoint, smoothFactor);
            }
          } else {
            _hasSmoothedHit = false;
          }

          hasHit = validHit;
          const dtClamped = Math.min(dt, 0.05);

          voxels.forEach((im: any) => {
            const data = instanceData.get(im);
            if (!data) return;
            const { origPositions, offsets, randDirs, count } = data;
            let needsUpdate = false;

            for (let i = 0; i < count; i++) {
              const ox = origPositions[i * 3];
              const oy = origPositions[i * 3 + 1];
              const oz = origPositions[i * 3 + 2];

              let targetOffX = 0, targetOffY = 0, targetOffZ = 0;

              if (hasHit) {
                _dir.set(ox - _smoothHitPoint.x, oy - _smoothHitPoint.y, oz - _smoothHitPoint.z);
                const dist = _dir.length();

                if (dist < repulsionRadius && dist > 0.01) {
                  const falloff = 1.0 - (dist / repulsionRadius);
                  const strength = falloff * falloff * falloff * repulsionStrength;
                  _dir.normalize();

                  const pulsePhase = (ox * 1.3 + oy * 0.7 + oz * 1.1);
                  const pulseTime = performance.now();
                  const pulseAmount = Math.sin(pulseTime * 0.003 + pulsePhase) * 0.15 + Math.sin(pulseTime * 0.0017 + pulsePhase * 0.6) * 0.1;
                  const breathScale = 1.0 + pulseAmount * falloff;

                  const rx = randDirs[i * 3];
                  const ry = randDirs[i * 3 + 1];
                  const rz = randDirs[i * 3 + 2];
                  const radialMix = 0.6;
                  const mx = _dir.x * radialMix + rx * (1.0 - radialMix);
                  const my = _dir.y * radialMix + ry * (1.0 - radialMix);
                  const mz = _dir.z * radialMix + rz * (1.0 - radialMix);
                  const ml = Math.sqrt(mx * mx + my * my + mz * mz) || 1;

                  targetOffX = (mx / ml) * strength * breathScale;
                  targetOffY = (my / ml) * strength * breathScale;
                  targetOffZ = (mz / ml) * strength * breathScale;
                }
              }

              const activeSpeed = hasHit ? 8.0 : returnSpeed;
              const lerpFactor = 1.0 - Math.exp(-activeSpeed * dtClamped);
              const curX = offsets[i * 3];
              const curY = offsets[i * 3 + 1];
              const curZ = offsets[i * 3 + 2];

              const newX = curX + (targetOffX - curX) * lerpFactor;
              const newY = curY + (targetOffY - curY) * lerpFactor;
              const newZ = curZ + (targetOffZ - curZ) * lerpFactor;

              if (Math.abs(newX - curX) > 0.0001 || Math.abs(newY - curY) > 0.0001 || Math.abs(newZ - curZ) > 0.0001) {
                offsets[i * 3] = newX;
                offsets[i * 3 + 1] = newY;
                offsets[i * 3 + 2] = newZ;

                im.getMatrixAt(i, _mat4);
                _mat4.decompose(_dummy.position, _dummy.quaternion, _dummy.scale);
                _dummy.position.set(ox + newX, oy + newY, oz + newZ);
                _dummy.updateMatrix();
                im.setMatrixAt(i, _dummy.matrix);
                needsUpdate = true;
              } else if (Math.abs(curX) > 0.0001 || Math.abs(curY) > 0.0001 || Math.abs(curZ) > 0.0001) {
                offsets[i * 3] = newX;
                offsets[i * 3 + 1] = newY;
                offsets[i * 3 + 2] = newZ;

                im.getMatrixAt(i, _mat4);
                _mat4.decompose(_dummy.position, _dummy.quaternion, _dummy.scale);
                _dummy.position.set(ox + newX, oy + newY, oz + newZ);
                _dummy.updateMatrix();
                im.setMatrixAt(i, _dummy.matrix);
                needsUpdate = true;
              }
            }

            if (needsUpdate) im.instanceMatrix.needsUpdate = true;
          });
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffeedd, 0.5);
        ambientLight.name = 'ambientLight';
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
        mainLight.name = 'mainLight';
        mainLight.position.set(6, 14, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 40;
        mainLight.shadow.camera.left = -32;
        mainLight.shadow.camera.right = 32;
        mainLight.shadow.camera.top = 32;
        mainLight.shadow.camera.bottom = -32;
        mainLight.shadow.bias = 0.0001;
        mainLight.shadow.normalBias = 0.05;
        mainLight.shadow.radius = 5.0;
        mainLight.shadow.blurSamples = 16;
        scene.add(mainLight);

        const softShadowLight = new THREE.DirectionalLight(0xffeedd, 0.6);
        softShadowLight.name = 'softShadowLight';
        softShadowLight.position.set(-3, 8, 6);
        softShadowLight.castShadow = true;
        softShadowLight.shadow.mapSize.width = 512;
        softShadowLight.shadow.mapSize.height = 512;
        softShadowLight.shadow.camera.near = 0.5;
        softShadowLight.shadow.camera.far = 30;
        softShadowLight.shadow.camera.left = -24;
        softShadowLight.shadow.camera.right = 24;
        softShadowLight.shadow.camera.top = 24;
        softShadowLight.shadow.camera.bottom = -24;
        softShadowLight.shadow.bias = 0.0001;
        softShadowLight.shadow.normalBias = 0.05;
        softShadowLight.shadow.radius = 3.75;
        softShadowLight.shadow.blurSamples = 16;
        scene.add(softShadowLight);

        const fillLight = new THREE.DirectionalLight(0x88bbff, 1.0);
        fillLight.name = 'fillLight';
        fillLight.position.set(-5, 8, -3);
        scene.add(fillLight);

        const rimLight = new THREE.PointLight(0xffaa66, 1.5, 30);
        rimLight.name = 'rimLight';
        rimLight.position.set(-4, 12, -5);
        scene.add(rimLight);

        const accentLight = new THREE.PointLight(0xff8844, 1.2, 25);
        accentLight.name = 'accentLight';
        accentLight.position.set(4, 10, 4);
        scene.add(accentLight);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableZoom = false;   // Disable scroll zoom so page scrolls normally
        controls.enablePan = false;    // Disable pan — only rotation allowed
        controls.minDistance = 2;
        controls.maxDistance = 500;
        controls.target.set(0, 8, 0);

        // Post-processing disabled for transparent background
        // (GTAO/SSR/Bloom pipelines render to opaque framebuffers that kill alpha)
        const postProcessing: any = null;

        // Adaptive quality (simplified — no post-processing passes)
        let lastAdaptiveDist = -1;

        function updateAdaptiveQuality() {
          const dist = camera.position.length();
          if (Math.abs(dist - lastAdaptiveDist) < 0.15) return;
          lastAdaptiveDist = dist;
          const maxDPR = Math.min(window.devicePixelRatio, 1.5);
          const t = Math.min(Math.max((dist - 3) / 5, 0), 1);
          const s = t * t * (3 - 2 * t);
          renderer.setPixelRatio(Math.max(1, maxDPR * (0.75 + 0.25 * s)));
        }

        // Animation
        let lastTime = performance.now();
        let animating = true;

        function animate() {
          if (!animating) return;
          const now = performance.now();
          const dt = (now - lastTime) / 1000;
          lastTime = now;

          controls.update();
          updateAdaptiveQuality();
          updateRepulsion(dt);
          updateParticles(dt);

          if (postProcessing) {
            postProcessing.render();
          } else {
            renderer.render(scene, camera);
          }
        }
        renderer.setAnimationLoop(animate);

        // Resize - use container dimensions
        const handleResize = () => {
          if (!container) return;
          const w = container.clientWidth;
          const h = container.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          lastAdaptiveDist = -1;
        };
        window.addEventListener('resize', handleResize);

        // Store cleanup
        cleanupRef.current = () => {
          animating = false;
          renderer.setAnimationLoop(null);
          window.removeEventListener('resize', handleResize);
          container.removeEventListener('mousemove', handleMouseMove);
          container.removeEventListener('mouseleave', handleMouseLeave);
          controls.dispose();
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };

      } catch (err) {
        console.error('VoxelTreeCanvas init error:', err);
      }
    };

    initScene();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="voxel-tree-canvas"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    />
  );
}
