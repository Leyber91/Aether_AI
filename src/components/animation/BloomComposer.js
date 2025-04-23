// BloomComposer.js
// Three.js postprocessing composer for bloom effect
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class BloomComposer {
  constructor(renderer, scene, camera, bloomStrength = 1.6, bloomRadius = 0.15, bloomThreshold = 0.0) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloomStrength, bloomRadius, bloomThreshold
    );
    this.composer.addPass(this.bloomPass);
  }

  render() {
    this.composer.render();
  }

  setSize(w, h) {
    this.composer.setSize(w, h);
  }

  setBloomStrength(strength) {
    this.bloomPass.strength = strength;
  }
}
