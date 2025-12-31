import * as THREE from "three"

/* ===============================
   🔥 PARTICLE SYSTEM CLASS
================================ */
export class ParticleSystem {
  constructor({
    count = 3000,
    spread = 400,
    size = 1,
    color = 0xd4af37,
    depth = false,
    opacity = 0.9
  }) {
    this.count = count
    this.spread = spread
    this.exploding = false

    this.geometry = new THREE.BufferGeometry()
    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)
    this.origins = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      const x = (Math.random() - 0.5) * spread
      const y = (Math.random() - 0.5) * spread
      const z = depth
        ? -Math.random() * spread
        : (Math.random() - 0.5) * spread

      this.positions[i3]     = x
      this.positions[i3 + 1] = y
      this.positions[i3 + 2] = z

      this.origins[i3]     = x
      this.origins[i3 + 1] = y
      this.origins[i3 + 2] = z

      this.velocities[i3]     = (Math.random() - 0.5) * 0.6
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.6
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.6
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    )

    this.geometry.setAttribute(
      "velocity",
      new THREE.BufferAttribute(this.velocities, 3)
    )

    this.material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.points = new THREE.Points(this.geometry, this.material)
  }

  /* ===============================
     🌊 IDLE ENERGY MOTION
  =============================== */
  updateIdle(time) {
    const pos = this.geometry.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3

      pos.array[i3 + 1] =
        this.origins[i3 + 1] +
        Math.sin(time * 0.8 + this.origins[i3]) * 0.6

      pos.array[i3] =
        this.origins[i3] +
        Math.sin(time * 0.4 + this.origins[i3 + 1]) * 0.3
    }

    pos.needsUpdate = true
  }

  /* ===============================
     💥 EXPLOSION MODE
  =============================== */
  explode(power = 4) {
    this.exploding = true
    this.explodePower = power
  }

  updateExplosion() {
    if (!this.exploding) return

    const pos = this.geometry.attributes.position
    const vel = this.geometry.attributes.velocity

    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3
      pos.array[i3]     += vel.array[i3] * this.explodePower
      pos.array[i3 + 1] += vel.array[i3 + 1] * this.explodePower
      pos.array[i3 + 2] += vel.array[i3 + 2] * this.explodePower
    }

    pos.needsUpdate = true
  }

  /* ===============================
     🔁 RESET (REWIND EFFECT)
  =============================== */
  reset(speed = 0.05) {
    const pos = this.geometry.attributes.position

    for (let i = 0; i < pos.count; i++) {
      const i3 = i * 3

      pos.array[i3] +=
        (this.origins[i3] - pos.array[i3]) * speed
      pos.array[i3 + 1] +=
        (this.origins[i3 + 1] - pos.array[i3 + 1]) * speed
      pos.array[i3 + 2] +=
        (this.origins[i3 + 2] - pos.array[i3 + 2]) * speed
    }

    pos.needsUpdate = true
  }

  /* ===============================
     🎨 COLOR TRANSITION
  =============================== */
  lerpColor(targetColor, speed = 0.02) {
    this.material.color.lerp(
      new THREE.Color(targetColor),
      speed
    )
  }

  /* ===============================
     📦 GET OBJECT
  =============================== */
  get mesh() {
    return this.points
  }
}
