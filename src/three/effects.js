import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"

/* ===============================
   👑 FINAL BOSS EFFECTS
================================ */
export class Effects {
  constructor(renderer, scene, camera) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera

    this.clock = new THREE.Clock()
    this.isMobile = window.innerWidth < 768

    this.shake = 0
    this.shockwaves = []
    this.audioPower = 0

    this.initComposer()
    this.initShaders()
    this.initAudio()
  }

  /* ===============================
     🎞 POST PROCESSING STACK
  =============================== */
  initComposer() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.composer.addPass(new RenderPass(this.scene, this.camera))

    /* 🔥 BLOOM */
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.isMobile ? 1 : 1.8,
      0.45,
      0.75
    )
    this.composer.addPass(this.bloom)
  }

  /* ===============================
     🌈 SHADERS STACK
  =============================== */
  initShaders() {
    /* 🌊 RADIAL SHOCKWAVE */
    this.shockwavePass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        strength: { value: 0 },
        center: { value: new THREE.Vector2(0.5, 0.5) }
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
        uniform vec2 center;
        varying vec2 vUv;

        void main() {
          vec2 dir = vUv - center;
          float dist = length(dir);

          float wave =
            sin(dist * 40.0 - time * 12.0) *
            smoothstep(0.6, 0.0, dist) *
            strength * 0.04;

          vec2 uv = vUv + normalize(dir) * wave;
          gl_FragColor = texture2D(tDiffuse, uv);
        }
      `
    })

    /* 🌈 CHROMATIC ABERRATION */
    this.rgbPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        strength: { value: 0 }
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
        uniform float strength;
        varying vec2 vUv;

        void main() {
          float r = texture2D(tDiffuse, vUv + strength).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv - strength).b;
          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `
    })

    this.composer.addPass(this.shockwavePass)
    this.composer.addPass(this.rgbPass)
  }

  /* ===============================
     🎵 AUDIO REACTIVE
  =============================== */
  initAudio() {
    this.listener = new THREE.AudioListener()
    this.camera.add(this.listener)

    this.sound = new THREE.Audio(this.listener)
    this.analyser = new THREE.AudioAnalyser(this.sound, 64)

    const audio = new Audio("/new-year.mp3")
    audio.crossOrigin = "anonymous"

    audio.addEventListener("canplay", () => {
      this.sound.setMediaElementSource(audio)
    })

    this.audio = audio
  }

  /* ===============================
     💥 FINAL TRIGGER 2026
  =============================== */
  triggerExplosion() {
    this.shake = 1.2

    // MULTI SHOCKWAVE BURST
    for (let i = 0; i < 3; i++) {
      this.shockwaves.push({
        strength: 1,
        delay: i * 0.12
      })
    }

    this.audio.currentTime = 0
    this.audio.play()

    this.bloom.strength = this.isMobile ? 1.8 : 3
    this.bloom.radius = 0.65
    this.bloom.threshold = 0.15
  }

  /* ===============================
     🎥 CAMERA EARTHQUAKE
  =============================== */
  updateShake() {
    if (this.shake < 0.001) return

    const s = this.shake * 0.7
    this.camera.position.x += (Math.random() - 0.5) * s
    this.camera.position.y += (Math.random() - 0.5) * s
    this.camera.rotation.z += (Math.random() - 0.5) * s * 0.04

    this.shake *= 0.88
  }

  /* ===============================
     🎶 AUDIO → EFFECTS
  =============================== */
  updateAudio() {
    const freq = this.analyser.getAverageFrequency()
    this.audioPower = THREE.MathUtils.lerp(
      this.audioPower,
      freq / 128,
      0.12
    )

    this.bloom.strength = THREE.MathUtils.clamp(
      1.5 + this.audioPower * 2.5,
      1.5,
      4
    )

    this.rgbPass.uniforms.strength.value =
      this.audioPower * 0.003
  }

  /* ===============================
     🌊 SHOCKWAVE UPDATE
  =============================== */
  updateShockwaves(delta) {
    this.shockwavePass.uniforms.time.value += delta

    let active = 0

    this.shockwaves.forEach(w => {
      if (w.delay > 0) {
        w.delay -= delta
        return
      }

      active += w.strength
      w.strength *= 0.92
    })

    this.shockwaves = this.shockwaves.filter(
      w => w.strength > 0.01
    )

    this.shockwavePass.uniforms.strength.value = active
  }

  /* ===============================
     🔁 UPDATE LOOP
  =============================== */
  update() {
    const delta = this.clock.getDelta()

    this.updateShake()
    this.updateAudio()
    this.updateShockwaves(delta)
  }

  /* ===============================
     🖥 RENDER
  =============================== */
  render() {
    this.composer.render()
  }

  /* ===============================
     🔄 RESIZE
  =============================== */
  resize(w, h) {
    this.composer.setSize(w, h)
  }
}
