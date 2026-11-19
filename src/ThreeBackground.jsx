import React, { useEffect, useRef } from 'react';

const randomBetween = (min, max) => min + Math.random() * (max - min);

function makeStarGeometry(THREE) {
  const shape = new THREE.Shape();
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 === 0 ? 0.32 : 0.14;
    const angle = (point / 10) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (point === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.02,
  });
  geometry.center();
  return geometry;
}

function makeRainbowMaterial(THREE) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float hue = vUv.x * 6.28318 + uTime * 0.12;
        vec3 color = 0.5 + 0.5 * cos(hue + vec3(0.0, 2.094, 4.188));
        float edge = 1.0 - smoothstep(0.16, 0.5, abs(vUv.y - 0.5));
        float shimmer = 0.72 + 0.18 * sin(vUv.x * 34.0 - uTime * 0.8);
        gl_FragColor = vec4(color, edge * shimmer * 0.2);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export default function ThreeBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const THREE = window.THREE;
    const container = containerRef.current;
    if (!THREE || !container) {
      console.error('Three.js background could not start: the Three.js CDN script did not load.');
      return undefined;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch (error) {
      console.error('Three.js background could not create a WebGL renderer.', error);
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 18;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x9bcde8, 1.6));
    const keyLight = new THREE.PointLight(0x79cfff, 2.2, 55);
    keyLight.position.set(-5, 6, 12);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0xec91ff, 1.1, 45);
    fillLight.position.set(6, -4, 8);
    scene.add(fillLight);

    const shapes = [
      new THREE.BoxGeometry(0.42, 0.42, 0.42),
      new THREE.SphereGeometry(0.25, 12, 10),
      new THREE.TorusGeometry(0.23, 0.075, 6, 14),
      new THREE.OctahedronGeometry(0.32, 0),
      new THREE.DodecahedronGeometry(0.29, 0),
      makeStarGeometry(THREE),
    ];
    const materials = [0, 1, 2, 3, 4, 5].map((index) => new THREE.MeshPhysicalMaterial({
      color: new THREE.Color().setHSL(0.52 + index * 0.085, 0.75, 0.62),
      emissive: new THREE.Color().setHSL(0.54 + index * 0.08, 0.7, 0.22),
      emissiveIntensity: 0.5,
      metalness: 0.55,
      roughness: 0.24,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 700],
      transparent: true,
      opacity: 0.8,
    }));

    const shapeCount = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches ? 11 : 18;
    const objects = Array.from({ length: shapeCount }, (_, index) => {
      const mesh = new THREE.Mesh(
        shapes[index % shapes.length],
        materials[index % materials.length],
      );
      mesh.scale.setScalar(randomBetween(0.55, 1.15));
      scene.add(mesh);
      return {
        mesh,
        x: randomBetween(-0.43, 0.43),
        y: randomBetween(-0.43, 0.43),
        z: randomBetween(-5, 10),
        phase: randomBetween(0, Math.PI * 2),
        rotation: randomBetween(0.12, 0.42),
        drift: randomBetween(0.12, 0.3),
      };
    });

    const rainbowMaterial = makeRainbowMaterial(THREE);
    let rainbowGeometry;
    let rainbow;
    const buildRainbow = () => {
      if (rainbow) {
        scene.remove(rainbow);
        rainbowGeometry.dispose();
      }
      const distance = camera.position.z + 8;
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
      const width = height * camera.aspect;
      const points = [];
      for (let index = 0; index <= 16; index += 1) {
        const progress = index / 16;
        points.push(new THREE.Vector3(
          (progress - 0.5) * width * 1.16,
          -height * 0.08 + Math.sin(progress * Math.PI) * height * 0.27,
          -8,
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      rainbowGeometry = new THREE.TubeGeometry(curve, 128, 0.18, 8, false);
      rainbow = new THREE.Mesh(rainbowGeometry, rainbowMaterial);
      scene.add(rainbow);
    };
    buildRainbow();

    const dummy = new THREE.Object3D();
    const rainMaterial = new THREE.MeshBasicMaterial({
      color: 0x9de8ff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rainGeometry = new THREE.CylinderGeometry(0.006, 0.012, 0.16, 4);
    let rain;
    let rainDrops = [];
    let rainCount = 0;
    const buildRain = () => {
      const mobile = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches;
      const nextCount = mobile ? 130 : 380;
      if (rain && rainCount === nextCount) return;
      if (rain) {
        scene.remove(rain);
        rain.dispose();
      }
      rainCount = nextCount;
      rain = new THREE.InstancedMesh(rainGeometry, rainMaterial, rainCount);
      rain.frustumCulled = false;
      rainDrops = Array.from({ length: rainCount }, () => ({
        x: 0,
        y: 0,
        z: randomBetween(-6, 12),
        speed: randomBetween(3.2, 7.5),
        scale: randomBetween(0.65, 1.4),
      }));
      scene.add(rain);
      resetRainPositions();
    };

    const viewHeightAt = (z) => 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z - z);
    const resetRainPositions = () => {
      rainDrops.forEach((drop) => {
        const height = viewHeightAt(drop.z);
        const width = height * camera.aspect;
        drop.x = randomBetween(-width / 2, width / 2);
        drop.y = randomBetween(-height / 2, height / 2);
      });
    };

    buildRain();

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame = 0;
    let elapsed = 0;
    let lastFrameTime = 0;
    const handlePointerMove = (event) => {
      if (event.pointerType === 'touch') return;
      pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      buildRainbow();
      buildRain();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      } else if (!reducedMotion.matches && !animationFrame) {
        lastFrameTime = 0;
        animationFrame = requestAnimationFrame(animate);
      } else {
        renderer.render(scene, camera);
      }
    };
    const animate = (now) => {
      animationFrame = 0;
      if (document.hidden) return;
      const delta = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.04) : 0;
      lastFrameTime = now;
      elapsed += delta;
      pointer.x += (pointer.targetX - pointer.x) * 0.035;
      pointer.y += (pointer.targetY - pointer.y) * 0.035;

      objects.forEach((item) => {
        const height = viewHeightAt(item.z);
        const width = height * camera.aspect;
        item.mesh.position.set(
          item.x * width + pointer.x * item.drift,
          item.y * height + Math.sin(elapsed * 0.55 + item.phase) * 0.28 + pointer.y * item.drift,
          item.z,
        );
        item.mesh.rotation.x += item.rotation * delta;
        item.mesh.rotation.y += item.rotation * delta * 0.72;
        item.mesh.rotation.z += item.rotation * delta * 0.43;
      });

      rainDrops.forEach((drop, index) => {
        const height = viewHeightAt(drop.z);
        const width = height * camera.aspect;
        drop.y -= drop.speed * delta;
        drop.x += drop.speed * delta * 0.18;
        if (drop.y < -height / 2 - 0.2 || drop.x > width / 2 + 0.2) {
          drop.y = height / 2 + randomBetween(0, 1);
          drop.x = randomBetween(-width / 2, width / 2);
        }
        dummy.position.set(drop.x, drop.y, drop.z);
        dummy.rotation.set(0, 0, -0.18);
        dummy.scale.set(drop.scale, drop.scale, drop.scale);
        dummy.updateMatrix();
        rain.setMatrixAt(index, dummy.matrix);
      });
      rain.instanceMatrix.needsUpdate = true;
      rainbowMaterial.uniforms.uTime.value = elapsed;
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    if (reducedMotion.matches) renderer.render(scene, camera);
    else animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      scene.remove(rain, rainbow);
      rainGeometry.dispose();
      rainMaterial.dispose();
      rainbowGeometry.dispose();
      rainbowMaterial.dispose();
      shapes.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="three-background" ref={containerRef} aria-hidden="true" />;
}
