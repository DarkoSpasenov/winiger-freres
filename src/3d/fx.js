// Particules légères : jet d'eau (lavage) et brouillard de peinture (cabine).
import * as THREE from 'three';
import { dotTexture } from './textures.js';

let dot = null;
export class Spray {
  constructor({ count = 600, color = 0xcfe6ff, size = 0.06, gravity = -9.8, speed = 9, spread = 0.12, life = 0.6, opacity = 0.8 } = {}) {
    dot = dot || dotTexture();
    this.n = count; this.gravity = gravity; this.speed = speed; this.spread = spread; this.life = life;
    this.pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.age = new Float32Array(count).fill(1e9);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.PointsMaterial({ color, size, map: dot, transparent: true, opacity, depthWrite: false, sizeAttenuation: true });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.origin = new THREE.Vector3(); this.dir = new THREE.Vector3(0, 0, -1);
    this.rate = 0; this.acc = 0; this.i = 0;
    this._t = new THREE.Vector3();
  }
  emit(k) {
    const { pos, vel, age } = this;
    for (let j = 0; j < k; j++) {
      const i = this.i; this.i = (this.i + 1) % this.n;
      pos[i * 3] = this.origin.x; pos[i * 3 + 1] = this.origin.y; pos[i * 3 + 2] = this.origin.z;
      const s = this.speed * (0.75 + Math.random() * 0.5);
      vel[i * 3] = (this.dir.x + (Math.random() - 0.5) * this.spread * 2) * s;
      vel[i * 3 + 1] = (this.dir.y + (Math.random() - 0.5) * this.spread * 2) * s;
      vel[i * 3 + 2] = (this.dir.z + (Math.random() - 0.5) * this.spread * 2) * s;
      age[i] = 0;
    }
  }
  update(dt) {
    this.acc += this.rate * dt;
    const k = Math.floor(this.acc); this.acc -= k;
    if (k > 0) this.emit(Math.min(k, 80));
    const { pos, vel, age } = this;
    let alive = false;
    for (let i = 0; i < this.n; i++) {
      if (age[i] > this.life) { pos[i * 3 + 1] = -999; continue; }
      alive = true;
      age[i] += dt;
      vel[i * 3 + 1] += this.gravity * dt;
      vel[i * 3] *= 0.985; vel[i * 3 + 2] *= 0.985;
      pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] < 0.05) { pos[i * 3 + 1] = 0.05; vel[i * 3 + 1] *= -0.2; }
    }
    this.points.visible = alive;
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}
