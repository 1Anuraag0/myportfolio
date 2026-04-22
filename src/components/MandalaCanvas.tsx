import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MandalaCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    const container = containerRef.current;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Build 9 rings
    const ringCount = 9;
    const ringGroups: THREE.Points[] = [];
    const goldColor = new THREE.Color(0.788, 0.635, 0.153);
    const saffronColor = new THREE.Color(0.878, 0.412, 0.051);
    const speeds = [0.0008, -0.0006, 0.0005, -0.0004, 0.00035, -0.0003, 0.00025, -0.00022, 0.0002];

    for (let i = 0; i < ringCount; i++) {
      const radius = 0.5 + i * 0.55;
      const pointCount = 60 + i * 30;
      const positions = new Float32Array(pointCount * 3);
      const colors = new Float32Array(pointCount * 3);

      const t = i / (ringCount - 1);
      const color = new THREE.Color().lerpColors(goldColor, saffronColor, t);

      for (let j = 0; j < pointCount; j++) {
        const angle = (j / pointCount) * Math.PI * 2;
        positions[j * 3] = Math.cos(angle) * radius;
        positions[j * 3 + 1] = Math.sin(angle) * radius;
        positions[j * 3 + 2] = (Math.random() - 0.5) * 0.06;

        colors[j * 3] = color.r;
        colors[j * 3 + 1] = color.g;
        colors[j * 3 + 2] = color.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.018,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);
      ringGroups.push(points);
    }

    // Mouse tracking for repulsion
    const mouse = new THREE.Vector2(9999, 9999);
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const worldMouse = new THREE.Vector3();

    const handleMouse = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    container.addEventListener('mousemove', handleMouse, { passive: true });

    // Animation
    const originalPositions: Float32Array[] = ringGroups.map(
      (rg) => new Float32Array((rg.geometry.getAttribute('position') as THREE.BufferAttribute).array)
    );

    const animate = () => {
      if (reducedMotion) {
        renderer.render(scene, camera);
        return;
      }

      // Rotate rings
      ringGroups.forEach((rg, i) => {
        rg.rotation.z += speeds[i];
      });

      // Mouse repulsion
      raycaster.setFromCamera(mouse, camera);
      const ray = raycaster.ray;
      ray.intersectPlane(plane, worldMouse);

      ringGroups.forEach((rg, ri) => {
        const posAttr = rg.geometry.getAttribute('position') as THREE.BufferAttribute;
        const origPos = originalPositions[ri];
        for (let j = 0; j < posAttr.count; j++) {
          const ox = origPos[j * 3];
          const oy = origPos[j * 3 + 1];

          // Apply ring rotation to get world position
          const cos = Math.cos(rg.rotation.z);
          const sin = Math.sin(rg.rotation.z);
          const wx = ox * cos - oy * sin;
          const wy = ox * sin + oy * cos;

          const dx = wx - worldMouse.x;
          const dy = wy - worldMouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 1.8) {
            const force = 0.012 * (1 - dist / 1.8);
            const nx = dx / dist;
            const ny = dy / dist;
            posAttr.setX(j, ox + nx * force * 5);
            posAttr.setY(j, oy + ny * force * 5);
          } else {
            // Decay back
            const cx = posAttr.getX(j);
            const cy = posAttr.getY(j);
            posAttr.setX(j, cx + (ox - cx) * 0.016);
            posAttr.setY(j, cy + (oy - cy) * 0.016);
          }
        }
        posAttr.needsUpdate = true;
      });

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    // Visibility API pause
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouse);

      /**
       * PERF: Dispose all GPU resources held by Three.js objects.
       * Without this, geometries/materials leak VRAM on component unmount.
       */
      scene.traverse((child) => {
        if (child instanceof THREE.Points || child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="mandala-canvas"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        opacity: typeof window !== 'undefined' && window.innerWidth < 768 ? 0.3 : 0.45,
        pointerEvents: 'none',
      }}
    />
  );
}
