#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script para optimizar assets del portfolio
console.log('🚀 Iniciando optimización de assets...');

// Función para obtener el tamaño de archivo en MB
function getFileSizeMB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
}

// Función para listar archivos en un directorio
function listFiles(dir, extensions = []) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...listFiles(fullPath, extensions));
    } else if (extensions.length === 0 || extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  });
  
  return files;
}

// Analizar assets
const publicDir = path.join(__dirname, '../public');
const distDir = path.join(__dirname, '../dist');

console.log('\n📊 Análisis de assets:');

// Modelos 3D
const modelsDir = path.join(publicDir, 'models');
if (fs.existsSync(modelsDir)) {
  const models = listFiles(modelsDir, ['.glb', '.gltf']);
  console.log('\n🎯 Modelos 3D:');
  models.forEach(model => {
    const size = getFileSizeMB(model);
    const relativePath = path.relative(publicDir, model);
    console.log(`  ${relativePath}: ${size} MB`);
    
    if (parseFloat(size) > 10) {
      console.log(`    ⚠️  Archivo muy pesado - considera optimizar`);
    }
  });
}

// Imágenes
const imagesDir = path.join(publicDir, 'imgs');
if (fs.existsSync(imagesDir)) {
  const images = listFiles(imagesDir, ['.jpg', '.jpeg', '.png', '.webp']);
  console.log('\n🖼️  Imágenes:');
  let totalImageSize = 0;
  
  images.forEach(image => {
    const size = getFileSizeMB(image);
    totalImageSize += parseFloat(size);
    const relativePath = path.relative(publicDir, image);
    console.log(`  ${relativePath}: ${size} MB`);
  });
  
  console.log(`  Total imágenes: ${totalImageSize.toFixed(2)} MB`);
  
  if (totalImageSize > 2) {
    console.log(`    ⚠️  Total de imágenes muy pesado - considera optimizar`);
  }
}

// Sonidos
const soundsDir = path.join(publicDir, 'sounds');
if (fs.existsSync(soundsDir)) {
  const sounds = listFiles(soundsDir, ['.mp3', '.wav', '.ogg']);
  console.log('\n🎵 Sonidos:');
  let totalSoundSize = 0;
  
  sounds.forEach(sound => {
    const size = getFileSizeMB(sound);
    totalSoundSize += parseFloat(size);
    const relativePath = path.relative(publicDir, sound);
    console.log(`  ${relativePath}: ${size} MB`);
  });
  
  console.log(`  Total sonidos: ${totalSoundSize.toFixed(2)} MB`);
  
  if (totalSoundSize > 5) {
    console.log(`    ⚠️  Total de sonidos muy pesado - considera optimizar`);
  }
}

// Verificar bundle size
if (fs.existsSync(distDir)) {
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const jsFiles = listFiles(assetsDir, ['.js']);
    const cssFiles = listFiles(assetsDir, ['.css']);
    
    console.log('\n📦 Bundle:');
    
    let totalJSSize = 0;
    jsFiles.forEach(file => {
      const size = getFileSizeMB(file);
      totalJSSize += parseFloat(size);
      const fileName = path.basename(file);
      console.log(`  ${fileName}: ${size} MB`);
    });
    
    let totalCSSSize = 0;
    cssFiles.forEach(file => {
      const size = getFileSizeMB(file);
      totalCSSSize += parseFloat(size);
      const fileName = path.basename(file);
      console.log(`  ${fileName}: ${size} MB`);
    });
    
    console.log(`  Total JS: ${totalJSSize.toFixed(2)} MB`);
    console.log(`  Total CSS: ${totalCSSSize.toFixed(2)} MB`);
    console.log(`  Total Bundle: ${(totalJSSize + totalCSSSize).toFixed(2)} MB`);
    
    if (totalJSSize > 1) {
      console.log(`    ⚠️  Bundle JS muy pesado - considera code splitting`);
    }
  }
}

console.log('\n✅ Análisis completado');
console.log('\n💡 Recomendaciones:');
console.log('  1. Optimizar modelos 3D con herramientas como gltf-pipeline');
console.log('  2. Convertir imágenes a WebP y diferentes tamaños');
console.log('  3. Comprimir archivos de audio');
console.log('  4. Implementar lazy loading para assets pesados');
console.log('  5. Usar CDN para assets estáticos');
