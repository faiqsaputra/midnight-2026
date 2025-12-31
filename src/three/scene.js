import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"
import { Fireworks } from "./fireworks"

/* ===============================
   CORE
================================ */
export let scene
let camera, renderer, composer
let fireworks

let particles, starsNear, starsMid, starsFar
let mouseX = 0, mouseY = 0
let explode = false
let shake = 0
let warpStrength = 0

/* ===============================
   🚀 INIT
================================ */
export function initThree() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    3000
  )
  camera.position.z = 120

  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("bg"),
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))

  /* ===============================
     🌟 PARTICLES CORE
  =============================== */
  const count = window.innerWidth < 768 ? 2500 : 5000
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const vel = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    pos[i3] = (Math.random() - 0.5) * 350
    pos[i3 + 1] = (Math.random() - 0.5) * 350
    pos[i3 + 2] = (Math.random() - 0.5) * 350

    vel[i3] = (Math.random() - 0.5) * 0.6
    vel[i3 + 1] = (Math.random() - 0.5) * 0.6
    vel[i3 + 2] = (Math.random() - 0.5) * 0.6
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  geo.setAttribute("velocity", new THREE.BufferAttribute(vel, 3))

  particles = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xffd700,
      size: window.innerWidth < 768 ? 0.6 : 1,
      opacity: 0.95,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  )
  scene.add(particles)

  /* ===============================
     🌌 STARFIELD
  =============================== */
  starsNear = createStarLayer(700, 0.35, 250, 0.6)
  starsMid  = createStarLayer(1300, 0.25, 600, 0.45)
  starsFar  = createStarLayer(1900, 0.15, 1000, 0.35)

  /* ===============================
     🎆 FIREWORKS SYSTEM
  =============================== */
  fireworks = new Fireworks(scene)

  /* ===============================
     🌈 POST PROCESSING
  =============================== */
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(innerWidth, innerHeight),
    innerWidth < 768 ? 1.1 : 1.6,
    0.45,
    0.15
  )
  composer.addPass(bloom)

  const distortionPass = new ShaderPass(DistortionShader)
  composer.addPass(distortionPass)

  /* ===============================
     🖱 INTERACTION
  =============================== */
  window.addEventListener("mousemove", e => {
    mouseX = (e.clientX / innerWidth - 0.5) * 10
    mouseY = (e.clientY / innerHeight - 0.5) * 10
  })

  window.addEventListener("resize", () => onResize(bloom, distortionPass))

  animate(bloom, distortionPass)
}

/* ===============================
   🌌 STAR LAYER
================================ */
function createStarLayer(count, size, depth, opacity) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    pos[i3] = (Math.random() - 0.5) * 1600
    pos[i3 + 1] = (Math.random() - 0.5) * 1600
    pos[i3 + 2] = -Math.random() * depth
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))

  const layer = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size,
      opacity,
      transparent: true,
      depthWrite: false
    })
  )
  scene.add(layer)
  return layer
}

/* ===============================
   🎞 ANIMATION LOOP
================================ */
function animate(bloom, distortionPass) {
  requestAnimationFrame(() => animate(bloom, distortionPass))

  particles.rotation.y += 0.0008
  particles.rotation.x += 0.0004

  starsNear.rotation.y += 0.0006
  starsMid.rotation.y += 0.00035
  starsFar.rotation.y += 0.00015

  camera.position.x += (mouseX - camera.position.x) * 0.04
  camera.position.y += (-mouseY - camera.position.y) * 0.04

  if (shake > 0.01) {
    camera.position.x += (Math.random() - 0.5) * shake
    camera.position.y += (Math.random() - 0.5) * shake
    shake *= 0.9
  }

  if (explode) {
    const pos = particles.geometry.attributes.position
    const vel = particles.geometry.attributes.velocity

    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3
      pos.array[i3]     += vel.array[i3] * 4
      pos.array[i3 + 1] += vel.array[i3 + 1] * 4
      pos.array[i3 + 2] += vel.array[i3 + 2] * 4
    }
    pos.needsUpdate = true
  }

  fireworks.update()

  distortionPass.uniforms.time.value += 0.03
  distortionPass.uniforms.strength.value = warpStrength
  warpStrength *= 0.92

  bloom.strength = explode ? 2.6 : bloom.strength

  composer.render()
}

/* ===============================
   🔄 RESIZE
================================ */
function onResize(bloom, distortionPass) {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  composer.setSize(innerWidth, innerHeight)
  bloom.setSize(innerWidth, innerHeight)
  distortionPass.setSize(innerWidth, innerHeight)
}

/* ===============================
   🔔 FINAL TRIGGER
================================ */
export function trigger2026() {
  explode = true
  shake = 1.2
  warpStrength = 1.2

  fireworks.launch({ color: 0xffd700 })

  setInterval(() => {
    fireworks.launch({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        -8,
        (Math.random() - 0.5) * 12
      ),
      color: Math.random() > 0.5 ? 0xffd700 : 0xffc14d
    })
  }, 600)
}

/* ===============================
   🌪 DISTORTION SHADER
================================ */
const DistortionShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    strength: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float strength;
    varying vec2 vUv;

    void main(){
      vec2 uv = vUv;
      uv.x += sin(uv.y * 12.0 + time) * 0.004 * strength;
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `
}
