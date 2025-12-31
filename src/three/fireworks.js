import * as THREE from "three"

/* ===============================
   FIREWORKS SYSTEM
================================ */
export class Fireworks {
  constructor(scene) {
    this.scene = scene
    this.fireworks = []
    this.gravity = -0.018
    this.clock = new THREE.Clock()
  }

  /* ===============================
     LAUNCH FIREWORK
  ================================ */
  launch({
    position = new THREE.Vector3(0, -8, 0),
    color = 0xffd700,
    count = window.innerWidth < 768 ? 80 : 160,
    power = 6
  } = {}) {
    const rocket = {
      type: "rocket",
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        power + Math.random(),
        (Math.random() - 0.5) * 0.4
      ),
      exploded: false,
      color
    }

    this.fireworks.push(rocket)
  }

  /* ===============================
     EXPLOSION
  ================================ */
  explode(firework) {
    const particles = []

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(firework.count * 3)
    const velocities = []

    for (let i = 0; i < firework.count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = Math.random() * 3 + 1

      const vx = speed * Math.sin(phi) * Math.cos(theta)
      const vy = speed * Math.cos(phi)
      const vz = speed * Math.sin(phi) * Math.sin(theta)

      positions[i * 3] = firework.position.x
      positions[i * 3 + 1] = firework.position.y
      positions[i * 3 + 2] = firework.position.z

      velocities.push(new THREE.Vector3(vx, vy, vz))
    }

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    )

    const material = new THREE.PointsMaterial({
      color: firework.color,
      size: 0.12,
      transparent: true,
      opacity: 1,
      depthWrite: false
    })

    const points = new THREE.Points(geometry, material)
    this.scene.add(points)

    particles.push({
      type: "explosion",
      points,
      velocities,
      life: 1.8,
      geometry,
      material
    })

    return particles
  }

  /* ===============================
     UPDATE LOOP
  ================================ */
  update() {
    const delta = this.clock.getDelta()

    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i]

      /* ROCKET */
      if (fw.type === "rocket") {
        fw.velocity.y += this.gravity * 0.3
        fw.position.add(fw.velocity)

        /* SPARK TRAIL */
        this.spawnTrail(fw.position, fw.color)

        if (fw.velocity.y <= 0 && !fw.exploded) {
          fw.exploded = true

          const explosion = this.explode({
            position: fw.position,
            color: fw.color,
            count: window.innerWidth < 768 ? 120 : 220
          })

          this.fireworks.push(...explosion)
          this.fireworks.splice(i, 1)
        }
      }

      /* EXPLOSION */
      if (fw.type === "explosion") {
        fw.life -= delta
        fw.material.opacity = fw.life / 1.8

        const pos = fw.geometry.attributes.position.array

        fw.velocities.forEach((v, idx) => {
          v.y += this.gravity
          pos[idx * 3] += v.x
          pos[idx * 3 + 1] += v.y
          pos[idx * 3 + 2] += v.z
        })

        fw.geometry.attributes.position.needsUpdate = true

        if (fw.life <= 0) {
          this.scene.remove(fw.points)
          fw.geometry.dispose()
          fw.material.dispose()
          this.fireworks.splice(i, 1)
        }
      }
    }
  }

  /* ===============================
     TRAIL SPARK
  ================================ */
  spawnTrail(position, color) {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([position.x, position.y, position.z]),
        3
      )
    )

    const mat = new THREE.PointsMaterial({
      color,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    })

    const spark = new THREE.Points(geo, mat)
    this.scene.add(spark)

    setTimeout(() => {
      this.scene.remove(spark)
      geo.dispose()
      mat.dispose()
    }, 200)
  }
}
