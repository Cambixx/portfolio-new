import { useRef, useEffect, useCallback } from 'react';
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

// Configuración de cantidad de bolas
const BALLS_CONFIG = {
  DESKTOP_COUNT: 180,
  MOBILE_COUNT: 90,
  LOW_PERFORMANCE_COUNT: 45, // Reducido de 60 a 45 para mejor rendimiento
};

// Configuración de tamaños
const SIZE_CONFIG = {
  MIN_SIZE: 0.4,
  MAX_SIZE: 0.8,
  CURSOR_BALL_SIZE: 0.5,
  MOBILE_SCALE: 0.5, // Factor de escala para móvil
};

// Configuración de físicas
const PHYSICS_CONFIG = {
  GRAVITY: 0.5,
  FRICTION: 0.9975,
  WALL_BOUNCE: 0.95,
  MAX_VELOCITY: 0.15,
  BOUNDARIES: {
    MAX_X: 5,
    MAX_Y: 5,
    MAX_Z: 2,
  },
};

// Configuración de luces
const LIGHT_CONFIG = {
  // Paleta de colores que combina con la web
  COLORS: [
    0x4444ff,  // Azul principal
    0x6b46c1,  // Morado oscuro
    0x805ad5,  // Morado medio
    0x9f7aea,  // Morado claro
    0x667eea,  // Azul medio
    0x4299e1,  // Azul claro
  ],
  AMBIENT: {
    COLOR: 0xffffff,
    INTENSITY: 1.0,
  },
  POINT_LIGHT: {
    INTENSITY: 100,
    DISTANCE: 15,
    DECAY: 1,
  },
  CURSOR_LIGHT: {
    COLOR: 0x4444ff, // Color principal para la luz del cursor
    INTENSITY: 200,
    DISTANCE: 10,
    DECAY: 1.5,
  },
};

// Configuración del material
const MATERIAL_CONFIG = {
  METALNESS: 0.3,
  ROUGHNESS: 0.4,
  CLEARCOAT: 0.5,
  CLEARCOAT_ROUGHNESS: 0.4,
  TRANSMISSION: 0.0,
  IOR: 1.5,
  THICKNESS: {
    DISTORTION: 0.2,
    AMBIENT: 0.1,
    ATTENUATION: 0.3,
    POWER: 2,
    SCALE: 8,
  },
};

// Configuración de efectos
const EFFECTS_CONFIG = {
  SCROLL_GRAVITY_THRESHOLD: 6,
  SCROLL_GRAVITY_VALUE: -0.2,
  CURSOR_Z_OSCILLATION: 0.8,
  CURSOR_Z_FREQUENCY: 1.2,
};

// Configuración de geometría
const GEOMETRY_CONFIG = {
  HIGH_QUALITY: { widthSegments: 32, heightSegments: 24 },
  MEDIUM_QUALITY: { widthSegments: 20, heightSegments: 16 }, // Reducido de 24/18 a 20/16
  LOW_QUALITY: { widthSegments: 12, heightSegments: 8 }, // Reducido de 16/12 a 12/8
};

// Detector de dispositivo móvil simple
const isMobile = () => window.innerWidth <= 768;

// Detector de rendimiento del dispositivo
const getDevicePerformance = () => {
  // Detectar GPU de bajo rendimiento
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') as WebGLRenderingContext | null ||
    canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

  if (!gl) return 'low';

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

  // Detectar GPUs integradas o de bajo rendimiento
  const lowPerformanceGPUs = [
    'Intel HD', 'Intel UHD', 'Intel Iris',
    'Mali', 'Adreno', 'Apple GPU',
    'PowerVR', 'Tegra', 'Intel(R)',
    'AMD Radeon(TM)', 'AMD Radeon HD'
  ];

  const isLowPerformanceGPU = lowPerformanceGPUs.some(gpu =>
    renderer.toLowerCase().includes(gpu.toLowerCase())
  );

  // Factores adicionales
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  const isMobileDevice = isMobile();
  const fps = getFPSMeasurement();

  // Lógica de clasificación más estricta
  if (isLowPerformanceGPU || memory < 4 || cores < 4 || isMobileDevice || fps < 30) {
    return 'low';
  } else if (memory < 8 || cores < 8 || fps < 50) {
    return 'medium';
  }

  return 'high';
};

// Función para medir FPS
const getFPSMeasurement = () => {
  if (typeof window === 'undefined') return 60;
  return 'requestAnimationFrame' in window ? 60 : 30;
};

// Función para obtener configuración optimizada
const getOptimizedConfig = (baseConfig: any) => {
  const performance = getDevicePerformance();
  const mobile = isMobile();

  let optimizedConfig = { ...baseConfig };

  switch (performance) {
    case 'low':
      optimizedConfig.count = mobile ? Math.floor(BALLS_CONFIG.MOBILE_COUNT * 0.5) : BALLS_CONFIG.LOW_PERFORMANCE_COUNT;
      optimizedConfig.geometryQuality = GEOMETRY_CONFIG.LOW_QUALITY;
      optimizedConfig.enableAdvancedLighting = false;
      optimizedConfig.pixelRatioLimit = 1;
      optimizedConfig.enableShadows = false;
      optimizedConfig.enableBloom = false;
      break;
    case 'medium':
      optimizedConfig.count = mobile ? BALLS_CONFIG.MOBILE_COUNT : Math.floor(BALLS_CONFIG.DESKTOP_COUNT * 0.7);
      optimizedConfig.geometryQuality = GEOMETRY_CONFIG.MEDIUM_QUALITY;
      optimizedConfig.enableAdvancedLighting = true;
      optimizedConfig.pixelRatioLimit = 1.5;
      optimizedConfig.enableShadows = true;
      optimizedConfig.enableBloom = false;
      break;
    case 'high':
    default:
      optimizedConfig.count = mobile ? BALLS_CONFIG.MOBILE_COUNT : BALLS_CONFIG.DESKTOP_COUNT;
      optimizedConfig.geometryQuality = GEOMETRY_CONFIG.HIGH_QUALITY;
      optimizedConfig.enableAdvancedLighting = true;
      optimizedConfig.pixelRatioLimit = 2;
      optimizedConfig.enableShadows = true;
      optimizedConfig.enableBloom = true;
      break;
  }

  if (mobile) {
    optimizedConfig.minSize *= SIZE_CONFIG.MOBILE_SCALE;
    optimizedConfig.maxSize *= SIZE_CONFIG.MOBILE_SCALE;
  }

  return optimizedConfig;
};

const DEFAULT_CONFIG = {
  count: BALLS_CONFIG.DESKTOP_COUNT,
  colors: LIGHT_CONFIG.COLORS,
  ambientColor: LIGHT_CONFIG.AMBIENT.COLOR,
  ambientIntensity: LIGHT_CONFIG.AMBIENT.INTENSITY,
  lightIntensity: LIGHT_CONFIG.POINT_LIGHT.INTENSITY,
  materialParams: {
    metalness: MATERIAL_CONFIG.METALNESS,
    roughness: MATERIAL_CONFIG.ROUGHNESS,
    clearcoat: MATERIAL_CONFIG.CLEARCOAT,
    clearcoatRoughness: MATERIAL_CONFIG.CLEARCOAT_ROUGHNESS,
    transmission: MATERIAL_CONFIG.TRANSMISSION,
    ior: MATERIAL_CONFIG.IOR,
  },
  minSize: SIZE_CONFIG.MIN_SIZE,
  maxSize: SIZE_CONFIG.MAX_SIZE,
  size0: SIZE_CONFIG.CURSOR_BALL_SIZE,
  gravity: PHYSICS_CONFIG.GRAVITY,
  friction: PHYSICS_CONFIG.FRICTION,
  wallBounce: PHYSICS_CONFIG.WALL_BOUNCE,
  maxVelocity: PHYSICS_CONFIG.MAX_VELOCITY,
  maxX: PHYSICS_CONFIG.BOUNDARIES.MAX_X,
  maxY: PHYSICS_CONFIG.BOUNDARIES.MAX_Y,
  maxZ: PHYSICS_CONFIG.BOUNDARIES.MAX_Z,
  controlSphere0: false,
  followCursor: true,
  spatialGridDivisions: 8,
  updateRadius: 8,
};

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

    let r = 0;
    if (config.controlSphere0) {
      r = 1;
      TMP_VEC3.fromArray(positionData, 0);
      TMP_VEC3.lerp(center, 0.1).toArray(positionData, 0);
      TMP_VEC3_4.set(0, 0, 0).toArray(velocityData, 0);
    }

    if (this.motionForce.lengthSq() > 0) {
      for (let idx = r; idx < config.count; idx++) {
        const base = 3 * idx;
        TMP_VEC3.fromArray(velocityData, base);
        const size = sizeData[idx];
        const forceFactor = 0.05 * size;
        TMP_VEC3_2.fromArray(positionData, base);
        const distanceFromCenter = TMP_VEC3_2.length();
        const positionFactor = Math.max(0.5, 1 - distanceFromCenter / (config.maxX * 2));
        TMP_VEC3.add(this.motionForce.clone().multiplyScalar(forceFactor * positionFactor));
        TMP_VEC3.toArray(velocityData, base);
      }
    }

    for (let idx = r; idx < config.count; idx++) {
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

    for (let idx = r; idx < config.count; idx++) {
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
          TMP_VEC3.toArray(positionData, base);
          TMP_VEC3_4.toArray(velocityData, base);
        }
      }

      if (Math.abs(TMP_VEC3.x) + radius > config.maxX) {
        TMP_VEC3.x = Math.sign(TMP_VEC3.x) * (config.maxX - radius);
        TMP_VEC3_4.x = -TMP_VEC3_4.x * config.wallBounce;
      }
      if (Math.abs(TMP_VEC3.y) + radius > config.maxY) {
        TMP_VEC3.y = Math.sign(TMP_VEC3.y) * (config.maxY - radius);
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
      thicknessDistortion: { value: MATERIAL_CONFIG.THICKNESS.DISTORTION },
      thicknessAmbient: { value: MATERIAL_CONFIG.THICKNESS.AMBIENT },
      thicknessAttenuation: { value: MATERIAL_CONFIG.THICKNESS.ATTENUATION },
      thicknessPower: { value: MATERIAL_CONFIG.THICKNESS.POWER },
      thicknessScale: { value: MATERIAL_CONFIG.THICKNESS.SCALE },
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
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromScene(env).texture;

    // Usar configuración de geometría optimizada
    const geometryConfig = mergedConfig.geometryQuality || GEOMETRY_CONFIG.HIGH_QUALITY;
    const geometry = new SphereGeometry(1, geometryConfig.widthSegments, geometryConfig.heightSegments);

    const material = new BallMaterial({
      envMap,
      ...mergedConfig.materialParams,
      flatShading: false,
      dithering: true,
    });

    super(geometry, material, mergedConfig.count);
    this.config = mergedConfig;
    this.physics = new BallPhysics(mergedConfig);
    this.setupLights();
    this.setColors(mergedConfig.colors);

    this.frustumCulled = true;
    this.matrixAutoUpdate = true;
  }
  setupLights() {
    this.ambientLight = new AmbientLight(
      LIGHT_CONFIG.AMBIENT.COLOR,
      LIGHT_CONFIG.AMBIENT.INTENSITY
    );
    this.add(this.ambientLight);

    this.light = new PointLight(this.config.colors[0], LIGHT_CONFIG.POINT_LIGHT.INTENSITY);
    this.light.distance = LIGHT_CONFIG.POINT_LIGHT.DISTANCE;
    this.light.decay = LIGHT_CONFIG.POINT_LIGHT.DECAY;
    this.add(this.light);

    this.cursorLight = new PointLight(
      LIGHT_CONFIG.CURSOR_LIGHT.COLOR,
      LIGHT_CONFIG.CURSOR_LIGHT.INTENSITY
    );
    this.cursorLight.distance = LIGHT_CONFIG.CURSOR_LIGHT.DISTANCE;
    this.cursorLight.decay = LIGHT_CONFIG.CURSOR_LIGHT.DECAY;
    this.add(this.cursorLight);
  }
  setCursorLightPosition(pos: Vector3) {
    this.cursorLight.position.copy(pos);
    this.cursorLight.intensity = 200;
  }
  hideCursorLight() {
    this.cursorLight.intensity = 0;
  }
  setColors(colors: any[]) {
    if (Array.isArray(colors) && colors.length > 1) {
      const colorLerp = (function (arr: any[]) {
        let arrColors = arr.map((c) => new Color(c));
        return {
          getColorAt: function (ratio: number, out = new Color()) {
            // Modificamos la distribución de colores para que sea más aleatoria
            // pero manteniendo una transición suave
            const scaled = Math.max(0, Math.min(1, ratio)) * (arrColors.length - 1);
            const idx = Math.floor(scaled);
            const start = arrColors[idx];
            if (idx >= arrColors.length - 1) return start.clone();
            const alpha = scaled - idx;
            const end = arrColors[idx + 1];

            // Añadimos una pequeña variación aleatoria al color
            const variation = 0.1; // 10% de variación
            out.r = start.r + alpha * (end.r - start.r) + (Math.random() - 0.5) * variation;
            out.g = start.g + alpha * (end.g - start.g) + (Math.random() - 0.5) * variation;
            out.b = start.b + alpha * (end.b - start.b) + (Math.random() - 0.5) * variation;

            // Aseguramos que los valores estén en el rango correcto
            out.r = Math.max(0, Math.min(1, out.r));
            out.g = Math.max(0, Math.min(1, out.g));
            out.b = Math.max(0, Math.min(1, out.b));

            return out;
          },
        };
      })(colors);

      // Asignamos colores con un poco de aleatoriedad en el orden
      for (let idx = 0; idx < this.count; idx++) {
        const randomOffset = Math.random() * 0.2 - 0.1; // ±10% de variación
        this.setColorAt(idx, colorLerp.getColorAt((idx / this.count) + randomOffset));
        if (idx === 0) {
          this.light.color.copy(colorLerp.getColorAt(0));
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

function createBallpit(canvas: HTMLCanvasElement, config: any = {}) {
  // Ajustar configuración según el dispositivo
  const mergedConfig = getOptimizedConfig({ ...DEFAULT_CONFIG, ...config });

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
    onBeforeRender = (_delta?: number) => { };
    onAfterRender = () => { };
    onAfterResize = () => { };
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
      const pixelRatio = Math.min(window.devicePixelRatio, mergedConfig.pixelRatioLimit || 2);
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

  function initialize(config: any) {
    if (mesh) {
      three.scene.remove(mesh);
    }
    mesh = new BallpitMesh(three.renderer, config);
    three.scene.add(mesh);
  }

  initialize(mergedConfig);

  const raycaster = new Raycaster();
  const plane = new Plane(new Vector3(0, 0, 1), 0);
  const intersection = new Vector3();

  pointerHandler = setupPointer(canvas, {
    onMove(state: any) {
      raycaster.setFromCamera(state.nPosition, three.camera);
      three.camera.getWorldDirection(plane.normal);
      raycaster.ray.intersectPlane(plane, intersection);

      const t = performance.now() * 0.001;
      const zOsc = Math.sin(t * EFFECTS_CONFIG.CURSOR_Z_FREQUENCY) * EFFECTS_CONFIG.CURSOR_Z_OSCILLATION;
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
      mesh.config.controlSphere0 = false;
      mesh.hideCursorLight();
    },
  });

  three.onBeforeRender = (delta?: number) => {
    if (!paused) {
      mesh.update({ delta: delta || 0 });
    }
  };

  three.onAfterResize = () => {
    // Mantener el mismo tamaño del contenedor tanto en móvil como en desktop
    mesh.config.maxX = three.size.wWidth / 2;
    mesh.config.maxY = three.size.wHeight / 2;
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
      pointerHandler?.dispose();
      three.dispose();
    },
  };
}

interface BallpitProps {
  className?: string;
  followCursor?: boolean;
  [key: string]: any;
}

const Ballpit = ({
  className = '',
  followCursor = true,
  ...props
}: BallpitProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spheresInstanceRef = useRef<any>(null);
  const originalGravity = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const config = { followCursor, ...props };
    spheresInstanceRef.current = createBallpit(canvas, config);

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const instance = spheresInstanceRef.current;
      if (!instance) return;
      const mesh = instance.spheres;
      if (!mesh) return;
      if (originalGravity.current === null) {
        originalGravity.current = mesh.physics.config.gravity;
      }
      if (scrollY > EFFECTS_CONFIG.SCROLL_GRAVITY_THRESHOLD) {
        mesh.physics.config.gravity = EFFECTS_CONFIG.SCROLL_GRAVITY_VALUE;
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
  }, []);

  return (
    <canvas
      className={className}
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        zIndex: 10,
        pointerEvents: 'auto',
      }}
    />
  );
};

export default Ballpit; 