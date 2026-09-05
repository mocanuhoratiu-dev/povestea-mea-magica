"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function LumiVisual3D({ className }: { className: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "h-full w-full";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
    camera.position.set(0, 0, 4);
    const group = new THREE.Group();
    scene.add(group);

    const sparkleGeometry = new THREE.BufferGeometry();
    sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1.15, .82, 0, -.92, -.42, .1, -.58, 1.12, -.1, .98, .72, 0, 1.18, -.34, -.1, .45, 1.28, .05, .72, -.92, .12, -.2, -1.08, .05]), 3));
    const sparkleMaterial = new THREE.PointsMaterial({ color: 0xe5b84f, size: .055, sizeAttenuation: true, transparent: true, opacity: .9, depthWrite: false });
    group.add(new THREE.Points(sparkleGeometry, sparkleMaterial));

    const orbitGeometry = new THREE.TorusGeometry(1.02, .012, 8, 48);
    const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0xe5b84f, transparent: true, opacity: .7 });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.position.set(0, -.08, -.2);
    group.add(orbit);

    const spriteMaterial = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, toneMapped: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.72, 2.58, 1);
    sprite.position.set(0, -.12, .15);
    group.add(sprite);
    const texture = new THREE.TextureLoader().load("/lumi-guardian.webp", (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      spriteMaterial.map = loaded;
      spriteMaterial.needsUpdate = true;
      host.style.backgroundImage = "none";
    });

    const pointer = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = bounds.width ? ((event.clientX - bounds.left) / bounds.width) * 2 - 1 : 0;
    };
    host.addEventListener("pointermove", onPointerMove);

    const resize = () => {
      const nextWidth = Math.max(1, host.clientWidth);
      const nextHeight = Math.max(1, host.clientHeight);
      renderer.setSize(nextWidth, nextHeight, false);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const timer = new THREE.Timer();
    timer.connect(document);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const render = () => {
      timer.update();
      const time = timer.getElapsed();
      group.position.y = reducedMotion ? 0 : Math.sin(time * 1.4) * .07;
      group.rotation.y = reducedMotion ? 0 : Math.sin(time * .55) * .07 + pointer.x * .1;
      orbit.rotation.z = reducedMotion ? 0 : time * .22;
      renderer.render(scene, camera);
      if (!reducedMotion) frame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      timer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      texture.dispose();
      sparkleGeometry.dispose();
      sparkleMaterial.dispose();
      orbitGeometry.dispose();
      orbitMaterial.dispose();
      spriteMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className={`pointer-events-none bg-[url('/lumi-guardian.webp')] bg-contain bg-center bg-no-repeat ${className}`} />;
}
