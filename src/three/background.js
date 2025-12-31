import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"

let scene, camera, renderer, composer
let particles, stars, dust
let mouseX = 0, mouseY = 0
let explode = false
let shakePower = 0

/* ===============================
   🌌 INIT
================================ */
export function initThree() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  )
  camera.position.z = 140

  const canvas = document.getElementById("bg")
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  /* ===============================
     ✨ GOLD CORE PARTICLES
  =============================== */
  particles = createParticles(4200, 380, 1.2, 0xd4af37)
  scene.add(particles)

  /* ===============================
     🌌 STARFIELD DEPTH
  =============================== */
  stars = createParticles(2800, 1600, 0.7, 0xffffff, true)
  scene.add(stars)

  /* ===============================
     🌫 SPACE DUST LAYER
  =============================== */
  dust = createParticles(1800, 800, 0.4, 0xfff1c1)
  scene.add(dust)

  /* ===============================
     🎬 POST PROCESSING
  =============================== */
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.85,   // strength
    0.35,   // radius
    0.15    // threshold
  )
  composer.addPass(bloomPass)

  /* ===============================
     🌊 DISTORTION SHADER
  =============================== */
  const distortionPass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0 },
      strength: { value: 0.015 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float time;
      uniform float strength;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        uv.y += sin(uv.x * 6.0 + time * 0.6) * strength;
        uv.x += sin(uv.y * 4.0 + time * 0.4) * strength * 0.7;
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    `
  })

  composer.addPass(distortionPass)

  /* ===============================
     🎥 INTERACTION
  =============================== */
  window.addEventListener("mousemove", e => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 12
    mouseY = (e.clientY / window.innerHeight - 0.5) * 12
  })

  window.addEventListener("resize", onResize)

  animate(distortionPass)
}

/* ===============================
   ✨ PARTICLE GENERATOR
================================ */
function createParticles(count, spread, size, color, deep = false) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const vel = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    pos[i3]     = (Math.random() - 0.5) * spread
    pos[i3 + 1] = (Math.random() - 0.5) * spread
    pos[i3 + 2] = deep ? -Math.random() * spread : (Math.random() - 0.5) * spread

    vel[i3]     = (Math.random() - 0.5) * 0.6
    vel[i3 + 1] = (Math.random() - 0.5) * 0.6
    vel[i3 + 2] = (Math.random() - 0.5) * 0.6
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  geo.setAttribute("velocity", new THREE.BufferAttribute(vel, 3))

  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  return new THREE.Points(geo, mat)
}

/* ===============================
   🎞 ANIMATION LOOP
================================ */
function animate(distortionPass) {
  requestAnimationFrame(() => animate(distortionPass))
  const time = performance.now() * 0.001

  particles.rotation.y += 0.0009
  stars.rotation.y += 0.00015
  dust.rotation.y -= 0.00025

  camera.position.x += (mouseX - camera.position.x) * 0.04
  camera.position.y += (-mouseY - camera.position.y) * 0.04
  camera.position.z = 140 + Math.sin(time * 0.4) * 2

  if (shakePower > 0) {
    camera.position.x += (Math.random() - 0.5) * shakePower
    camera.position.y += (Math.random() - 0.5) * shakePower
    shakePower *= 0.92
  }

  distortionPass.uniforms.time.value = time

  if (explode) {
    shakePower = 1.8
    explodeParticles(particles)
    particles.material.color.lerp(new THREE.Color(0xffffff), 0.02)
  }

  composer.render()
}

/* ===============================
   💥 EXPLOSION
================================ */
function explodeParticles(obj) {
  const pos = obj.geometry.attributes.position
  const vel = obj.geometry.attributes.velocity
  for (let i = 0; i < pos.count; i++) {
    const i3 = i * 3
    pos.array[i3]     += vel.array[i3] * 4
    pos.array[i3 + 1] += vel.array[i3 + 1] * 4
    pos.array[i3 + 2] += vel.array[i3 + 2] * 4
  }
  pos.needsUpdate = true
}

/* ===============================
   🔔 TRIGGER 2026
================================ */
export function trigger2026() {
  explode = true
}

/* ===============================
   🔄 RESIZE
================================ */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  composer.setSize(window.innerWidth, window.innerHeight)
}
