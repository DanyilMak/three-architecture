import * as THREE from 'three'
import './style.css'
import GUI from 'lil-gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

/**
 * Налаштування GUI та параметрів
 */
const gui = new GUI({ title: 'Керування сценою' })
const params = {
    rotationSpeed: 0.1 // Швидкість обертання будівлі
}

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})

/**
 * Камера та Рендерер
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.set(20, 15, 20)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.2

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Налаштування GUI для рендерера
 */
const rendererFolder = gui.addFolder('Камера та Експозиція')
rendererFolder.add(renderer, 'toneMappingExposure').min(0).max(5).step(0.01).name('Експозиція')
rendererFolder.open()

/**
 * Освітлення
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
directionalLight.position.set(15, 30, 15) // Початкова позиція 
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(2048, 2048)
scene.add(directionalLight)

/**
 * Керування Напрямком Світла (Сонцем)
 */
const lightFolder = gui.addFolder('Налаштування Сонця')
lightFolder.add(directionalLight, 'intensity').min(0).max(10).step(0.1).name('Яскравість')
// Додаємо можливість міняти напрямок через координати X, Y, Z 
lightFolder.add(directionalLight.position, 'x').min(-50).max(50).step(0.1).name('Позиція X')
lightFolder.add(directionalLight.position, 'y').min(0).max(100).step(0.1).name('Висота Y')
lightFolder.add(directionalLight.position, 'z').min(-50).max(50).step(0.1).name('Позиція Z')
lightFolder.open()

/**
 * Оточення
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.9 })
)
floor.rotation.x = -Math.PI * 0.5
floor.receiveShadow = true
scene.add(floor)

const road = new THREE.Mesh(
    new THREE.BoxGeometry(60, 0.05, 10),
    new THREE.MeshStandardMaterial({ color: '#111111' })
)
road.position.y = 0.03
road.receiveShadow = true
scene.add(road)

/**
 * Завантажувачі
 */
const gltfLoader = new GLTFLoader()
const fontLoader = new FontLoader()
const rgbeLoader = new RGBELoader()

let buildingModel = null
let carModel = null

/**
 * 1. Будівля
 */
gltfLoader.load(
    '/models/building.glb',
    (gltf) => {
        buildingModel = gltf.scene
        buildingModel.scale.set(8, 8, 8) 
        buildingModel.position.set(0, 0, 0)
        
        buildingModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
            }
        })
        scene.add(buildingModel)

        const buildingFolder = gui.addFolder('Налаштування Будівлі')
        buildingFolder.add(params, 'rotationSpeed').min(0).max(2).step(0.01).name('Швидкість обертання')
        buildingFolder.add(buildingModel.scale, 'x', 1, 20).name('Загальний масштаб').onChange((val) => {
            buildingModel.scale.set(val, val, val)
        })
        buildingFolder.open()
    }
)

/**
 * 2. Машина
 */
gltfLoader.load(
    '/models/car.glb',
    (gltf) => {
        carModel = gltf.scene
        carModel.scale.set(3, 3, 3)
        carModel.position.set(-20, 0.5, 0)
        carModel.rotation.y = Math.PI * 0.5 
        
        carModel.traverse((child) => {
            if (child.isMesh) child.castShadow = true
        })
        scene.add(carModel)
    }
)

/**
 * 3. Дерева
 */
gltfLoader.load(
    '/models/tree.glb',
    (gltf) => {
        for(let i = -25; i <= 25; i += 8) {
            if (Math.abs(i) < 6) continue 
            const treeClone = gltf.scene.clone()
            treeClone.position.set(i, 4.0, -10) 
            treeClone.scale.set(3, 3, 3)
            treeClone.traverse(child => { if(child.isMesh) child.castShadow = true })
            scene.add(treeClone)
        }
    }
)

/**
 * 4. Текст
 */
fontLoader.load(
    '/fonts/helvetiker_regular.typeface.json',
    (font) => {
        const textGeometry = new TextGeometry('MODERN PROJECT', {
            font: font,
            size: 1.5,
            depth: 0.4,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.03,
            bevelSegments: 5
        })
        textGeometry.center()
        const text = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: '#ffffff' }))
        text.position.set(0, 18, -2) 
        scene.add(text)
    }
)

/**
 * 5. Карта оточення
 */
rgbeLoader.load('/textures/environment.hdr', (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping
    scene.background = envMap
    scene.environment = envMap
})

/**
 * Анімація
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    if (buildingModel) {
        buildingModel.rotation.y += params.rotationSpeed * 0.02
    }

    if (carModel) {
        carModel.position.x = Math.sin(elapsedTime * 0.4) * 25
        if (Math.cos(elapsedTime * 0.4) > 0) {
            carModel.rotation.y = Math.PI * 0.5
        } else {
            carModel.rotation.y = -Math.PI * 0.5
        }
    }

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()