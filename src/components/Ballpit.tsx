import { useRef, useEffect } from 'react';
import {
  Clock as ThreeClock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SRGBColorSpace,
  MathUtils,
  Vector2,
  Vector3,
  MeshPhysicalMaterial,
  ShaderChunk,
  Color,
  Object3D,
  InstancedMesh,
  PMREMGenerator,
  SphereGeometry,
  AmbientLight,
  PointLight,
  ACESFilmicToneMapping,
  Raycaster,
  Plane,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// --- Utilidades de interacción y físicas ---
const pointerMap = new Map<any, any>();
const pointerPos = new Vector2();
let pointerActive = false;
function setupPointer(domElement: HTMLElement, handlers: any) {
  const state = {
    position: new Vector2(),
    nPosition: new Vector2(),
    hover: false,
    ...handlers,
  };
  if (!pointerMap.has(domElement)) {
    pointerMap.set(domElement, state);
    if (!pointerActive) {
      document.body.addEventListener('pointermove', onPointerMove as EventListener);
      document.body.addEventListener('pointerleave', onPointerLeave as EventListener);
      document.body.addEventListener('pointerdown', onPointerClick as EventListener);
      pointerActive = true;
    }
  }
  state.dispose = () => {
    pointerMap.delete(domElement);
    if (pointerMap.size === 0) {
      document.body.removeEventListener('pointermove', onPointerMove as EventListener);
      document.body.removeEventListener('pointerleave', onPointerLeave as EventListener);
      document.body.removeEventListener('pointerdown', onPointerClick as EventListener);
      pointerActive = false;
    }
  };
  return state;
}
function onPointerMove(e: PointerEvent) {
  pointerPos.x = e.clientX;
  pointerPos.y = e.clientY;
  for (const [elem, state] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    if (
      pointerPos.x >= rect.left &&
      pointerPos.x <= rect.left + rect.width &&
      pointerPos.y >= rect.top &&
      pointerPos.y <= rect.top + rect.height
    ) {
      state.position.x = pointerPos.x - rect.left;
      state.position.y = pointerPos.y - rect.top;
      state.nPosition.x = (state.position.x / rect.width) * 2 - 1;
      state.nPosition.y = (-state.position.y / rect.height) * 2 + 1;
      if (!state.hover) {
        state.hover = true;
        state.onEnter && state.onEnter(state);
      }
      state.onMove && state.onMove(state);
    } else if (state.hover) {
      state.hover = false;
      state.onLeave && state.onLeave(state);
    }
  }
}
function onPointerClick(e: PointerEvent) {
  pointerPos.x = e.clientX;
  pointerPos.y = e.clientY;
  for (const [elem, state] of pointerMap) {
    const rect = elem.getBoundingClientRect();
    state.position.x = pointerPos.x - rect.left;
    state.position.y = pointerPos.y - rect.top;
    state.nPosition.x = (state.position.x / rect.width) * 2 - 1;
    state.nPosition.y = (-state.position.y / rect.height) * 2 + 1;
    if (
      pointerPos.x >= rect.left &&
      pointerPos.x <= rect.left + rect.width &&
      pointerPos.y >= rect.top &&
      pointerPos.y <= rect.top + rect.height
    ) {
      state.onClick && state.onClick(state);
    }
  }
}
function onPointerLeave() {
  for (const state of pointerMap.values()) {
    if (state.hover) {
      state.hover = false;
      state.onLeave && state.onLeave(state);
    }
  }
}

// --- Físicas y utilidades de esferas ---
const { randFloat, randFloatSpread } = MathUtils;
const TMP_VEC3 = new Vector3();
const TMP_VEC3_2 = new Vector3();
const TMP_VEC3_4 = new Vector3();
const TMP_VEC3_5 = new Vector3();
const TMP_VEC3_6 = new Vector3();
const TMP_VEC3_7 = new Vector3();
const TMP_VEC3_8 = new Vector3();
const TMP_VEC3_9 = new Vector3();

class BallPhysics {
  config: any;
  positionData: Float32Array;
  velocityData: Float32Array;
  sizeData: Float32Array;
  center: Vector3;
  motionForce: Vector3;
  constructor(config: any) {
    this.config = config;
    this.positionData = new Float32Array(3 * config.count).fill(0);
    this.velocityData = new Float32Array(3 * config.count).fill(0);
    this.sizeData = new Float32Array(config.count).fill(1);
    this.center = new Vector3();
    this.motionForce = new Vector3();
    this.resetPositions();
    this.setSizes();
  }
  resetPositions() {
    const { config, positionData } = this;
    this.center.toArray(positionData, 0);
    for (let i = 1; i < config.count; i++) {
      const idx = 3 * i;
      positionData[idx] = randFloatSpread(2 * config.maxX);
      positionData[idx + 1] = randFloatSpread(2 * config.maxY);
      positionData[idx + 2] = randFloatSpread(2 * config.maxZ);
    }
  }
  setSizes() {
    const { config, sizeData } = this;
    sizeData[0] = config.size0;
    for (let i = 1; i < config.count; i++) {
      sizeData[i] = randFloat(config.minSize, config.maxSize);
    }
  }
  applyMotionForce(normalizedX: number, normalizedY: number, normalizedZ: number) {
    this.motionForce.set(-normalizedX, normalizedY, normalizedZ * 0.5);
  }
  update(e: { delta: number }) {
    const { config, center, positionData, sizeData, velocityData } = this;
    
    // Aplicar fuerzas de movimiento a todas las bolas
    if (this.motionForce.lengthSq() > 0) {
      for (let idx = 0; idx < config.count; idx++) {
        const base = 3 * idx;
        TMP_VEC3.fromArray(velocityData, base);
        
        // Calcular fuerza basada en el tamaño de la bola y su posición
        const size = sizeData[idx];
        const forceFactor = 0.05 * size; // Las bolas más grandes se mueven más lento
        
        // Añadir variación basada en la posición
        TMP_VEC3_2.fromArray(positionData, base);
        const distanceFromCenter = TMP_VEC3_2.length();
        const positionFactor = Math.max(0.5, 1 - distanceFromCenter / (config.maxX * 2));
        
        // Aplicar la fuerza del movimiento
        TMP_VEC3.add(this.motionForce.clone().multiplyScalar(forceFactor * positionFactor));
        TMP_VEC3.toArray(velocityData, base);
      }
    }

    // Resto del código de update original
    for (let idx = 0; idx < config.count; idx++) {
      const base = 3 * idx;
      TMP_VEC3.fromArray(positionData, base);
      TMP_VEC3_4.fromArray(velocityData, base);
      TMP_VEC3_4.y -= e.delta * config.gravity * sizeData[idx];
      TMP_VEC3_4.multiplyScalar(config.friction);
      TMP_VEC3_4.clampLength(0, config.maxVelocity);
      TMP_VEC3.add(TMP_VEC3_4);
      TMP_VEC3.toArray(positionData, base);
      TMP_VEC3_4.toArray(velocityData, base);
    }
    for (let idx = 0; idx < config.count; idx++) {
      const base = 3 * idx;
      TMP_VEC3.fromArray(positionData, base);
      TMP_VEC3_4.fromArray(velocityData, base);
      const radius = sizeData[idx];
      for (let jdx = idx + 1; jdx < config.count; jdx++) {
        const otherBase = 3 * jdx;
        TMP_VEC3_2.fromArray(positionData, otherBase);
        TMP_VEC3_5.fromArray(velocityData, otherBase);
        const otherRadius = sizeData[jdx];
        TMP_VEC3_6.copy(TMP_VEC3_2).sub(TMP_VEC3);
        const dist = TMP_VEC3_6.length();
        const sumRadius = radius + otherRadius;
        if (dist < sumRadius) {
          const overlap = sumRadius - dist;
          TMP_VEC3_7.copy(TMP_VEC3_6).normalize().multiplyScalar(0.5 * overlap);
          TMP_VEC3_8.copy(TMP_VEC3_7).multiplyScalar(Math.max(TMP_VEC3_4.length(), 1));
          TMP_VEC3_9.copy(TMP_VEC3_7).multiplyScalar(Math.max(TMP_VEC3_5.length(), 1));
          TMP_VEC3.sub(TMP_VEC3_7);
          TMP_VEC3_4.sub(TMP_VEC3_8);
          TMP_VEC3.toArray(positionData, base);
          TMP_VEC3_4.toArray(velocityData, base);
          TMP_VEC3_2.add(TMP_VEC3_7);
          TMP_VEC3_5.add(TMP_VEC3_9);
          TMP_VEC3_2.toArray(positionData, otherBase);
          TMP_VEC3_5.toArray(velocityData, otherBase);
        }
      }
      if (config.controlSphere0) {
        TMP_VEC3_6.copy(center).sub(TMP_VEC3);
        const dist = TMP_VEC3_6.length();
        const sumRadius0 = radius + sizeData[0];
        if (dist < sumRadius0) {
          const diff = (sumRadius0 - dist) * 2;
          TMP_VEC3_7.copy(TMP_VEC3_6.normalize()).multiplyScalar(diff);
          TMP_VEC3_8.copy(TMP_VEC3_7).multiplyScalar(Math.max(TMP_VEC3_4.length(), 2));
          TMP_VEC3.sub(TMP_VEC3_7);
          TMP_VEC3_4.sub(TMP_VEC3_8);
        }
      }
      if (Math.abs(TMP_VEC3.x) + radius > config.maxX) {
        TMP_VEC3.x = Math.sign(TMP_VEC3.x) * (config.maxX - radius);
        TMP_VEC3_4.x = -TMP_VEC3_4.x * config.wallBounce;
      }
      if (config.gravity === 0) {
        if (Math.abs(TMP_VEC3.y) + radius > config.maxY) {
          TMP_VEC3.y = Math.sign(TMP_VEC3.y) * (config.maxY - radius);
          TMP_VEC3_4.y = -TMP_VEC3_4.y * config.wallBounce;
        }
      } else if (TMP_VEC3.y - radius < -config.maxY) {
        TMP_VEC3.y = -config.maxY + radius;
        TMP_VEC3_4.y = -TMP_VEC3_4.y * config.wallBounce;
      }
      const maxBoundary = Math.max(config.maxZ, config.maxSize);
      if (Math.abs(TMP_VEC3.z) + radius > maxBoundary) {
        TMP_VEC3.z = Math.sign(TMP_VEC3.z) * (config.maxZ - radius);
        TMP_VEC3_4.z = -TMP_VEC3_4.z * config.wallBounce;
      }
      TMP_VEC3.toArray(positionData, base);
      TMP_VEC3_4.toArray(velocityData, base);
    }
  }
}

class BallMaterial extends MeshPhysicalMaterial {
  uniforms: any;
  defines: any;
  onBeforeCompile2?: (shader: any) => void;
  constructor(params: any) {
    super(params);
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 },
    };
    this.defines = { USE_UV: '' };
    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.fragmentShader =
        `\n        uniform float thicknessPower;\n        uniform float thicknessScale;\n        uniform float thicknessDistortion;\n        uniform float thicknessAmbient;\n        uniform float thicknessAttenuation;\n      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `\n        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {\n          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));\n          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;\n          #ifdef USE_COLOR\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;\n          #else\n            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;\n          #endif\n          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;\n        }\n\n        void main() {\n      `
      );
      const lightsFrag = ShaderChunk.lights_fragment_begin.split(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );'
      ).join(
        `\n          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);\n        `
      );
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', lightsFrag);
      if (this.onBeforeCompile2) this.onBeforeCompile2(shader);
    };
  }
}

const DEFAULT_CONFIG = {
  count: 200,
  mobileCount: 100, // Cantidad de bolas para dispositivos móviles
  colors: [0, 0, 0],
  ambientColor: 0xffffff,
  ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: {
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  },
  minSize: 0.5,
  maxSize: 1,
  // Tamaños para móviles
  mobileMinSize: 0.3,
  mobileMaxSize: 0.6,
  size0: 1,
  gravity: 0.5,
  friction: 0.9975,
  wallBounce: 0.95,
  maxVelocity: 0.15,
  maxX: 5,
  maxY: 5,
  maxZ: 2,
  // Límites para móviles
  mobileMaxX: 7,
  mobileMaxY: 7,
  mobileMaxZ: 3,
  controlSphere0: false,
  followCursor: true,
};

const TMP_OBJ3D = new Object3D();

class BallpitMesh extends InstancedMesh {
  config: any;
  physics: BallPhysics;
  ambientLight: AmbientLight = new AmbientLight();
  light: PointLight = new PointLight();
  cursorLight: PointLight = new PointLight();
  constructor(renderer: WebGLRenderer, config: any = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const env = new RoomEnvironment();
    const pmrem = new PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(env).texture;
    const geometry = new SphereGeometry();
    const material = new BallMaterial({ envMap, ...mergedConfig.materialParams });
    // @ts-ignore
    material.envMapRotation = { x: -Math.PI / 2 };
    super(geometry, material, mergedConfig.count);
    this.config = mergedConfig;
    this.physics = new BallPhysics(mergedConfig);
    this.setupLights();
    this.setColors(mergedConfig.colors);
  }
  setupLights() {
    this.ambientLight = new AmbientLight(
      this.config.ambientColor,
      this.config.ambientIntensity
    );
    this.add(this.ambientLight);
    this.light = new PointLight(this.config.colors[0], this.config.lightIntensity);
    this.add(this.light);
    
    // Configuración mejorada de la luz del cursor
    this.cursorLight.intensity = 3;
    this.cursorLight.distance = 4;
    this.cursorLight.decay = 1.5;
    this.cursorLight.color.set(0xffffff);
    this.add(this.cursorLight);
  }
  setCursorLightPosition(pos: Vector3) {
    this.cursorLight.position.copy(pos);
    // Asegurar que la luz esté activa
    this.cursorLight.intensity = 3;
  }
  hideCursorLight() {
    this.cursorLight.intensity = 0;
  }
  setColors(colors: any[]) {
    if (Array.isArray(colors) && colors.length > 1) {
      const colorLerp = (function (arr: any[]) {
        let arrColors = arr.map((c) => new Color(c));
        return {
          getColorAt: (ratio: number, out = new Color()) => {
            const scaled = Math.max(0, Math.min(1, ratio)) * (arrColors.length - 1);
            const idx = Math.floor(scaled);
            const start = arrColors[idx];
            if (idx >= arrColors.length - 1) return start.clone();
            const alpha = scaled - idx;
            const end = arrColors[idx + 1];
            out.r = start.r + alpha * (end.r - start.r);
            out.g = start.g + alpha * (end.g - start.g);
            out.b = start.b + alpha * (end.b - start.b);
            return out;
          },
        };
      })(colors);
      for (let idx = 0; idx < this.count; idx++) {
        this.setColorAt(idx, colorLerp.getColorAt(idx / this.count));
        if (idx === 0) {
          this.light.color.copy(colorLerp.getColorAt(idx / this.count));
        }
      }
      // @ts-ignore
      this.instanceColor.needsUpdate = true;
    }
  }
  update(e: { delta: number }) {
    this.physics.update(e);
    for (let idx = 0; idx < this.count; idx++) {
      TMP_OBJ3D.position.fromArray(this.physics.positionData, 3 * idx);
      if (idx === 0 && this.config.followCursor === false) {
        TMP_OBJ3D.scale.setScalar(0);
      } else {
        TMP_OBJ3D.scale.setScalar(this.physics.sizeData[idx]);
      }
      TMP_OBJ3D.updateMatrix();
      this.setMatrixAt(idx, TMP_OBJ3D.matrix);
      if (idx === 0) this.light.position.copy(TMP_OBJ3D.position);
    }
    // @ts-ignore
    this.instanceMatrix.needsUpdate = true;
  }
}

const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

function createBallpit(canvas: HTMLCanvasElement, config: any = {}) {
  // Ajustar la configuración según el dispositivo
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  if (isMobile()) {
    mergedConfig.count = mergedConfig.mobileCount || Math.floor(mergedConfig.count / 2);
    mergedConfig.minSize = mergedConfig.mobileMinSize || mergedConfig.minSize * 0.6;
    mergedConfig.maxSize = mergedConfig.mobileMaxSize || mergedConfig.maxSize * 0.6;
    // Ajustar los límites para móvil
    mergedConfig.maxX = mergedConfig.mobileMaxX;
    mergedConfig.maxY = mergedConfig.mobileMaxY;
    mergedConfig.maxZ = mergedConfig.mobileMaxZ;
  }

  const three = new (class {
    canvas: HTMLCanvasElement;
    camera: PerspectiveCamera;
    cameraFov: number;
    cameraMinAspect?: number;
    cameraMaxAspect?: number;
    scene: Scene;
    renderer: WebGLRenderer;
    size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 };
    render = this.#render;
    onBeforeRender = (_delta?: number) => {};
    onAfterRender = () => {};
    onAfterResize = () => {};
    #raf: any;
    #clock = new ThreeClock();
    #running = false;
    #resizeObs: ResizeObserver | null = null;
    #intersectionObs: IntersectionObserver | null = null;
    #visible = true;
    constructor() {
      this.canvas = canvas;
      this.camera = new PerspectiveCamera();
      this.cameraFov = this.camera.fov;
      this.scene = new Scene();
      this.renderer = new WebGLRenderer({ 
        canvas: this.canvas, 
        powerPreference: 'high-performance', 
        antialias: true, 
        alpha: true 
      });
      this.renderer.outputColorSpace = SRGBColorSpace;
      this.renderer.toneMapping = ACESFilmicToneMapping;
      this.camera.position.set(0, 0, 20);
      this.camera.lookAt(0, 0, 0);
      this.cameraMaxAspect = 1.5;
      this.resize();
      this.render = this.#render.bind(this);
      window.addEventListener('resize', this._onResize);
      this.#resizeObs = new ResizeObserver(this._onResize);
      this.#resizeObs.observe(this.canvas.parentNode as Element);
      this.#intersectionObs = new IntersectionObserver(this._onVisibility, { root: null, rootMargin: '0px', threshold: 0 });
      this.#intersectionObs.observe(this.canvas);
      document.addEventListener('visibilitychange', this._onDocVisibility);
      this._start();
    }

    #render() {
      this.renderer.render(this.scene, this.camera);
    }

    _onResize = () => {
      this.resize();
    };

    _onVisibility = (entries: any) => {
      this.#visible = entries[0].isIntersecting;
      this.#visible ? this._start() : this._stop();
    };

    _onDocVisibility = () => {
      if (this.#visible) {
        document.hidden ? this._stop() : this._start();
      }
    };

    resize() {
      let width = this.canvas.parentNode ? (this.canvas.parentNode as HTMLElement).offsetWidth : window.innerWidth;
      let height = this.canvas.parentNode ? (this.canvas.parentNode as HTMLElement).offsetHeight : window.innerHeight;
      
      this.size.width = width;
      this.size.height = height;
      this.size.ratio = width / height;
      this.camera.aspect = this.size.width / this.size.height;
      
      if (this.camera.isPerspectiveCamera && this.cameraFov) {
        if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
          this._adjustFov(this.cameraMinAspect);
        } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
          this._adjustFov(this.cameraMaxAspect);
        } else {
          this.camera.fov = this.cameraFov;
        }
      }
      
      this.camera.updateProjectionMatrix();
      this.updateWorldSize();
      this.renderer.setSize(this.size.width, this.size.height);
      const pixelRatio = Math.min(window.devicePixelRatio, 2); // Limitar el pixel ratio para mejor rendimiento
      this.renderer.setPixelRatio(pixelRatio);
      this.size.pixelRatio = pixelRatio;
      this.onAfterResize();
    }

    _adjustFov(aspect: number) {
      const t = Math.tan(MathUtils.degToRad(this.cameraFov / 2)) / (this.camera.aspect / aspect);
      this.camera.fov = 2 * MathUtils.radToDeg(Math.atan(t));
    }

    updateWorldSize() {
      if (this.camera.isPerspectiveCamera) {
        const e = (this.camera.fov * Math.PI) / 180;
        this.size.wHeight = 2 * Math.tan(e / 2) * this.camera.position.length();
        this.size.wWidth = this.size.wHeight * this.camera.aspect;
      }
    }

    _start() {
      if (this.#running) return;
      const animate = () => {
        this.#raf = requestAnimationFrame(animate);
        const delta = this.#clock.getDelta();
        this.onBeforeRender(delta);
        this.render();
        this.onAfterRender();
      };
      this.#running = true;
      this.#clock.start();
      animate();
    }

    _stop() {
      if (this.#running) {
        cancelAnimationFrame(this.#raf);
        this.#running = false;
        this.#clock.stop();
      }
    }

    dispose() {
      window.removeEventListener('resize', this._onResize);
      this.#resizeObs?.disconnect();
      this.#intersectionObs?.disconnect();
      document.removeEventListener('visibilitychange', this._onDocVisibility);
      this._stop();
      this.scene.clear();
      this.renderer.dispose();
    }
  })();

  let mesh: BallpitMesh;
  let paused = false;
  let pointerHandler: any;
  let isUsingMotion = false;

  function initialize(config: any) {
    if (mesh) {
      three.scene.remove(mesh);
    }
    // Asegurar que se mantenga la cantidad correcta al reinicializar
    if (isMobile() && !config.mobileCount) {
      config.count = config.mobileCount || Math.floor(config.count / 2);
      config.minSize = config.mobileMinSize || config.minSize * 0.6;
      config.maxSize = config.mobileMaxSize || config.maxSize * 0.6;
    }
    mesh = new BallpitMesh(three.renderer, config);
    three.scene.add(mesh);
  }

  initialize(mergedConfig);

  // Interacción con el cursor y sensores de movimiento
  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const intersection = new Vector3();
  
  // Configuración para dispositivos móviles
  if (isMobile()) {
    // Verificar si el dispositivo tiene sensores de movimiento
    if (typeof DeviceMotionEvent !== 'undefined') {
      // Solicitar permiso en iOS 13+
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              setupMotionControls();
            }
          })
          .catch(console.error);
      } else {
        // Android y versiones anteriores de iOS
        setupMotionControls();
      }
    }
  }

  function setupMotionControls() {
    isUsingMotion = true;
    let motionX = 0;
    let motionY = 0;
    let motionZ = 0;

    window.addEventListener('devicemotion', (event) => {
      if (!paused) {
        // Obtener datos del acelerómetro
        const accelerationX = event.accelerationIncludingGravity?.x ?? 0;
        const accelerationY = event.accelerationIncludingGravity?.y ?? 0;
        const accelerationZ = event.accelerationIncludingGravity?.z ?? 0;

        // Suavizar los movimientos con interpolación
        const smoothingFactor = 0.1;
        motionX += (accelerationX - motionX) * smoothingFactor;
        motionY += (accelerationY - motionY) * smoothingFactor;
        motionZ += (accelerationZ - motionZ) * smoothingFactor;

        // Calcular la posición basada en la orientación del dispositivo
        const maxTilt = 5; // Máximo desplazamiento
        const normalizedX = (motionX / 9.81) * maxTilt;
        const normalizedY = (motionY / 9.81) * maxTilt;
        const normalizedZ = ((motionZ - 9.81) / 9.81) * maxTilt;

        // Aplicar la fuerza del movimiento a todas las bolas
        mesh.physics.applyMotionForce(normalizedX, normalizedY, normalizedZ);

        // Actualizar la luz del cursor si está habilitada
        if (mesh.cursorLight) {
          const lightPos = new Vector3(-normalizedX, normalizedY, normalizedZ * 0.5);
          mesh.setCursorLightPosition(lightPos);
        }
      }
    });
  }

  // Mantener el control del cursor para dispositivos no móviles
  if (!isMobile()) {
    pointerHandler = setupPointer(canvas, {
      onMove(state: any) {
        raycaster.setFromCamera(state.nPosition, three.camera);
        three.camera.getWorldDirection(plane.normal);
        raycaster.ray.intersectPlane(plane, intersection);
        
        const t = performance.now() * 0.001;
        const zOsc = Math.sin(t * 1.2) * 0.8;
        const cursorPos = new Vector3(
          intersection.x,
          intersection.y,
          zOsc
        );
        mesh.physics.center.copy(cursorPos);
        mesh.config.controlSphere0 = true;
        
        mesh.setCursorLightPosition(cursorPos);
      },
      onLeave() {
        if (!isUsingMotion) {
          mesh.config.controlSphere0 = false;
          mesh.hideCursorLight();
        }
      },
    });
  }

  three.onBeforeRender = (delta?: number) => {
    if (!paused) {
      mesh.update({ delta: delta || 0 });
    }
  };

  three.onAfterResize = () => {
    // Ajustar los límites basados en el tamaño de la pantalla
    const aspectRatio = three.size.width / three.size.height;
    if (isMobile()) {
      mesh.config.maxX = Math.max(three.size.wWidth / 1.5, mergedConfig.mobileMaxX);
      mesh.config.maxY = Math.max(three.size.wHeight / 1.5, mergedConfig.mobileMaxY);
    } else {
      mesh.config.maxX = three.size.wWidth / 2;
      mesh.config.maxY = three.size.wHeight / 2;
    }
  };

  return {
    three,
    get spheres() {
      return mesh;
    },
    setCount(count: number) {
      initialize({ ...mesh.config, count });
    },
    togglePause() {
      paused = !paused;
    },
    dispose() {
      if (!isMobile()) {
        pointerHandler?.dispose();
      }
      three.dispose();
    },
  };
}

const Ballpit = ({ className = '', followCursor = true, ...props }: any) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spheresInstanceRef = useRef<any>(null);
  const originalGravity = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ajustar la configuración según el dispositivo
    const config = { followCursor, ...props };
    if (isMobile()) {
      config.count = config.mobileCount || Math.floor((config.count || DEFAULT_CONFIG.count) / 2);
      config.minSize = config.mobileMinSize || (config.minSize || DEFAULT_CONFIG.minSize) * 0.6;
      config.maxSize = config.mobileMaxSize || (config.maxSize || DEFAULT_CONFIG.maxSize) * 0.6;
    }

    spheresInstanceRef.current = createBallpit(canvas, config);

    // Efecto de scroll para cambiar la gravedad
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const instance = spheresInstanceRef.current;
      if (!instance) return;
      const mesh = instance.spheres;
      if (!mesh) return;
      // Guarda la gravedad original solo la primera vez
      if (originalGravity.current === null) {
        originalGravity.current = mesh.physics.config.gravity;
      }
      if (scrollY > 6) {
        mesh.physics.config.gravity = -0.2;
      } else {
        mesh.physics.config.gravity = originalGravity.current;
      }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      if (spheresInstanceRef.current) {
        spheresInstanceRef.current.dispose();
      }
      window.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      className={className}
      ref={canvasRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Ballpit; 