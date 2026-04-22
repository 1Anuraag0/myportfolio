import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { fetchGitHubContributions, ContributionDay } from '../lib/github';

// Inject BVH into Three.js core for accelerated raycasting
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

interface GithubGardenCanvasProps {
  year: string;
  onDataLoaded?: (total: number, maxDay: number, activeDays: number, streak: number) => void;
}

export default function GithubGardenCanvas({ year, onDataLoaded }: GithubGardenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ totalContributions: number; grid: ContributionDay[][] } | null>(null);

  useEffect(() => {
    setData(null);
    fetchGitHubContributions(year).then(setData);
  }, [year]);

  useEffect(() => {
    if (!containerRef.current || !data) return;
    if (data.grid.length === 0) return;

    const root = containerRef.current;
    
    // Cleanup any existing children from HMR
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }

    // Tools for UI interaction inside the container
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: absolute;
      display: none;
      background: rgba(10, 10, 15, 0.95);
      border: 1px solid rgba(255, 215, 0, 0.3);
      border-radius: 8px;
      padding: 10px 14px;
      pointer-events: none;
      z-index: 100;
      backdrop-filter: blur(10px);
      font-family: 'Inter', var(--font-sans), sans-serif;
    `;
    root.appendChild(tooltip);

    const scene = new THREE.Scene();
    scene.background = null; // Transparent or new THREE.Color(0x0a0a0f); depending on overall styling
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.008);

    const { clientWidth, clientHeight } = root;
    const camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000);
    camera.position.set(35, 30, 45);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(clientWidth, clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    root.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 80;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.enableZoom = false; // Disable scroll zoom so it doesn't break page scroll
    controls.target.set(0, 2, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x1a0a2e, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffd700, 0.8);
    mainLight.position.set(20, 30, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 100;
    const d = 40;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const accentLight1 = new THREE.PointLight(0xff6b35, 1.5, 60);
    accentLight1.position.set(-20, 15, -10);
    scene.add(accentLight1);

    const accentLight2 = new THREE.PointLight(0xd4145a, 1.2, 60);
    accentLight2.position.set(20, 10, 15);
    scene.add(accentLight2);

    const accentLight3 = new THREE.PointLight(0x9b59b6, 0.8, 50);
    accentLight3.position.set(0, 20, -20);
    scene.add(accentLight3);

    // Process data
    const monthsStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Map Deno API data to internal format
    const contributions = data.grid.map((weekData, wi) => {
      return weekData.map((dayData, di) => {
        const dateObj = new Date(dayData.date);
        return {
          count: dayData.contributionCount,
          week: wi,
          day: di,
          month: monthsStr[dateObj.getMonth()],
          dayName: daysStr[dateObj.getDay()],
          date: `${monthsStr[dateObj.getMonth()]} ${dateObj.getDate()}`
        };
      });
    });

    let maxDay = 0;
    let activeDays = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    
    contributions.flat().forEach(c => {
      if (c.count > maxDay) maxDay = c.count;
      if (c.count > 0) {
        activeDays++;
        currentStreak++;
      } else {
        if (currentStreak > maxStreak) maxStreak = currentStreak;
        currentStreak = 0;
      }
    });
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    
    if (onDataLoaded) {
      onDataLoaded(data.totalContributions, maxDay, activeDays, maxStreak);
    }

    // Color palette function
    function getColor(count: number) {
      if (count === 0) return new THREE.Color(0x161b22);
      if (count <= 2) return new THREE.Color(0x7e29a3); // Brightened purple
      if (count <= 5) return new THREE.Color(0xf2216e); // Brightened magenta
      if (count <= 9) return new THREE.Color(0xff8c40); // Brightened orange
      return new THREE.Color(0xffe53b); // Brightened gold
    }

    function getEmissiveColor(count: number) {
      if (count === 0) return new THREE.Color(0x000000);
      return getColor(count); // Match base color for a better neon/gem glow
    }

    // We will create the ground plane after computing dimensions

    const numWeeks = contributions.length;
    const cellSize = 0.7;
    const gap = 0.15;
    const totalWidth = numWeeks * (cellSize + gap);
    const totalDepth = 7 * (cellSize + gap);
    const offsetX = -totalWidth / 2;
    const offsetZ = -totalDepth / 2;

    // Give it a perfectly flat, cinematic front elevation by default
    const yHeight = Math.max(8, totalWidth * 0.15); 
    const zDistance = Math.max(30, totalWidth * 0.85);
    camera.position.set(0, yHeight, zDistance);
    controls.maxDistance = Math.max(120, totalWidth * 1.5);
    controls.target.set(0, 0, 0); // Focus closer to center
    controls.update();

    const groundGeo = new THREE.PlaneGeometry(Math.max(80, totalWidth + 20), Math.max(50, totalDepth + 20));
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x050508, // Darker ground for better contrast
      metalness: 0.9,
      roughness: 0.1, // Very reflective ground
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const barGeo = new THREE.BoxGeometry(cellSize, 1, cellSize, 1, 1, 1);
    // Build BVH tree for accelerated raycasting against instanced meshes
    barGeo.computeBoundsTree();
    const levels = [
      { min: 0, max: 0 },
      { min: 1, max: 2 },
      { min: 3, max: 5 },
      { min: 6, max: 9 },
      { min: 10, max: Infinity }
    ];

    const barDataMap = new Map();
    const allBarMeshes: THREE.InstancedMesh[] = [];

    levels.forEach((level, levelIdx) => {
      const cells: any[] = [];
      contributions.forEach((week, wi) => {
        week.forEach((cell, di) => {
          if (cell.count >= level.min && cell.count <= level.max) {
            cells.push({ wi, di, cell });
          }
        });
      });
      
      if (cells.length === 0) return;
      
      const sampleCount = cells[0].cell.count || 0;
      const color = getColor(sampleCount === 0 ? 0 : level.min + 1);
      const emissive = getEmissiveColor(sampleCount === 0 ? 0 : level.min + 1);
      
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissive,
        emissiveIntensity: sampleCount === 0 ? 0 : 0.85, // Boosted glow
        metalness: sampleCount === 0 ? 0.3 : 0.9, // Very metallic bars
        roughness: sampleCount === 0 ? 0.8 : 0.1, // Very smooth/shiny bars
      });
      
      const instancedMesh = new THREE.InstancedMesh(barGeo, mat, cells.length);
      instancedMesh.receiveShadow = true;
      instancedMesh.userData = { cells };
      
      const dummy = new THREE.Object3D();
      
      cells.forEach((item, idx) => {
        const { wi, di, cell } = item;
        const x = offsetX + wi * (cellSize + gap);
        const z = offsetZ + di * (cellSize + gap);
        const height = cell.count === 0 ? 0.15 : 0.3 + cell.count * 0.35;
        
        dummy.position.set(x, height / 2, z);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(idx, dummy.matrix);
        
        const c = getColor(cell.count);
        instancedMesh.setColorAt(idx, c);
        
        barDataMap.set(`${wi}-${di}`, { cell, x, z, height, instanceIdx: idx, levelIdx });
      });
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
      scene.add(instancedMesh);
      allBarMeshes.push(instancedMesh);
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0x4a3500,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.1,
    });

    const frameWidth = totalWidth + 3;
    const frameDepth = totalDepth + 3;
    const frameThickness = 0.15;
    const frameHeight = 0.4;

    const frameParts = [
      { sx: frameWidth, sy: frameHeight, sz: frameThickness, px: 0, pz: -frameDepth/2 },
      { sx: frameWidth, sy: frameHeight, sz: frameThickness, px: 0, pz: frameDepth/2 },
      { sx: frameThickness, sy: frameHeight, sz: frameDepth, px: -frameWidth/2, pz: 0 },
      { sx: frameThickness, sy: frameHeight, sz: frameDepth, px: frameWidth/2, pz: 0 },
    ];

    frameParts.forEach((fp) => {
      const geo = new THREE.BoxGeometry(fp.sx, fp.sy, fp.sz);
      const mesh = new THREE.Mesh(geo, frameMat);
      mesh.position.set(fp.px, fp.sy / 2 - 0.3, fp.pz);
      mesh.castShadow = false; // PERF: Only mainLight casts shadows to reduce draw calls
      scene.add(mesh);
    });

    const cornerPositions = [
      [-frameWidth/2, frameDepth/2],
      [frameWidth/2, frameDepth/2],
      [-frameWidth/2, -frameDepth/2],
      [frameWidth/2, -frameDepth/2],
    ];

    cornerPositions.forEach((pos, i) => {
      const ornGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const ornMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xff6b35,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.1,
      });
      const orn = new THREE.Mesh(ornGeo, ornMat);
      orn.position.set(pos[0], 0.3, pos[1]);
      orn.castShadow = false; // PERF: Decorative elements don't need shadow passes
      scene.add(orn);
      
      const ringGeo = new THREE.TorusGeometry(0.6, 0.06, 8, 32);
      const ring = new THREE.Mesh(ringGeo, ornMat.clone());
      ring.name = `corner_ring_${i}`;
      ring.position.set(pos[0], 0.5, pos[1]);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    });

    const particleCount = 200;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 60;
      particlePositions[i * 3 + 1] = Math.random() * 25;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      particleSizes[i] = Math.random() * 3 + 1;
      particleSpeeds[i] = Math.random() * 0.5 + 0.2;
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particlesMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    const canvas2d = document.createElement('canvas');
    const ctx2d = canvas2d.getContext('2d');

    function createTextSprite(text: string, color = '#ffd700', size = 0.8) {
      canvas2d.width = 128;
      canvas2d.height = 64;
      if (!ctx2d) return new THREE.Sprite();
      
      ctx2d.clearRect(0, 0, 128, 64);
      ctx2d.fillStyle = color;
      ctx2d.font = 'bold 28px Inter, var(--font-sans), sans-serif';
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillText(text, 64, 32);
      
      const cloneCanvas = document.createElement('canvas');
      cloneCanvas.width = 128;
      cloneCanvas.height = 64;
      const cloneCtx = cloneCanvas.getContext('2d');
      if (cloneCtx) {
        cloneCtx.clearRect(0, 0, 128, 64);
        cloneCtx.fillStyle = color;
        cloneCtx.font = 'bold 28px Inter, var(--font-sans), sans-serif';
        cloneCtx.textAlign = 'center';
        cloneCtx.textBaseline = 'middle';
        cloneCtx.fillText(text, 64, 32);
      }
      
      const tex = new THREE.CanvasTexture(cloneCanvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.85 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(size * 2, size, 1);
      return sprite;
    }

    if (numWeeks > 60) {
      let lastRenderedYear = -1;
      contributions.forEach((week, wi) => {
        if (!week || week.length === 0) return;
        const d = new Date(week[0].date);
        const year = d.getFullYear();
        if (year !== lastRenderedYear) {
          const x = offsetX + wi * (cellSize + gap);
          const sprite = createTextSprite(String(year), '#ffd700', 0.9);
          sprite.position.set(x, -0.2, offsetZ - 2);
          scene.add(sprite);
          lastRenderedYear = year;
        }
      });
    } else {
      let lastRenderedMonth = -1;
      contributions.forEach((week, wi) => {
        if (!week || week.length === 0) return;
        const d = new Date(week[0].date);
        const month = d.getMonth();
        if (month !== lastRenderedMonth) {
          const x = offsetX + wi * (cellSize + gap);
          const sprite = createTextSprite(monthsStr[month], '#ffd700', 0.7);
          sprite.position.set(x, -0.2, offsetZ - 2);
          scene.add(sprite);
          lastRenderedMonth = month;
        }
      });
    }

    daysStr.forEach((day, i) => {
      if (i % 2 === 0) return;
      const z = offsetZ + i * (cellSize + gap);
      const sprite = createTextSprite(day, '#d4145a', 0.6);
      sprite.position.set(offsetX - 2.5, 0, z);
      scene.add(sprite);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    controls.addEventListener('start', () => { isDragging = true; tooltip.style.display = 'none'; });
    controls.addEventListener('end', () => { isDragging = false; });

    // Throttle raycasting to 15 FPS for tooltip hover detection
    let lastRaycastTime = 0;
    const RAYCAST_INTERVAL = 1000 / 15;

    const onPointerMove = (e: MouseEvent) => {
      if (isDragging) return;

      const now = performance.now();
      if (now - lastRaycastTime < RAYCAST_INTERVAL) return;
      lastRaycastTime = now;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      let found = false;
      for (const mesh of allBarMeshes) {
        const intersects = raycaster.intersectObject(mesh);
        if (intersects.length > 0) {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined && mesh.userData.cells) {
            const cellData = mesh.userData.cells[instanceId].cell;
            tooltip.style.display = 'block';
            tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
            tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
            tooltip.innerHTML = `
              <div style="font-size: 13px; font-weight: 700; color: #ffd700;">${cellData.count} contributions</div>
              <div style="font-size: 11px; color: #8b8b9e; margin-top: 2px;">${cellData.dayName}, ${cellData.date}</div>
            `;
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        tooltip.style.display = 'none';
      }
    };

    renderer.domElement.addEventListener('mousemove', onPointerMove);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(root);

    function animate() {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const t = clock.getElapsedTime();
      
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += particleSpeeds[i] * 0.02;
        positions[i * 3] += Math.sin(t + i) * 0.003;
        
        if (positions[i * 3 + 1] > 25) {
          positions[i * 3 + 1] = 0;
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      
      cornerPositions.forEach((_, i) => {
        const ring = scene.getObjectByName(`corner_ring_${i}`);
        if (ring) {
          ring.position.y = 0.5 + Math.sin(t * 1.5 + i) * 0.2;
          ring.rotation.z = t * 0.5 + i;
        }
      });
      
      accentLight1.intensity = 1.5 + Math.sin(t * 0.8) * 0.3;
      accentLight2.intensity = 1.2 + Math.sin(t * 1.2 + 1) * 0.3;
      accentLight3.intensity = 0.8 + Math.sin(t * 0.6 + 2) * 0.2;
      
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!root) return;
      camera.aspect = root.clientWidth / root.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(root.clientWidth, root.clientHeight);
    });
    resizeObserver.observe(root);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      root.removeChild(renderer.domElement);
      if (root.contains(tooltip)) {
        root.removeChild(tooltip);
      }
      renderer.dispose();
      
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh || child instanceof THREE.Points) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => {
                // PERF: Dispose textures attached to materials (canvas textures from sprites)
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if ((child.material as any).map) (child.material as any).map.dispose();
              child.material.dispose();
            }
          }
        }
        // PERF: Dispose sprite materials + their canvas textures
        if (child instanceof THREE.Sprite) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    };
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!data && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-muted)' }}>
          Loading contribution garden...
        </div>
      )}
    </div>
  );
}
