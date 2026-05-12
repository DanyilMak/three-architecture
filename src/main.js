import * as THREE from 'three'
import './style.css'
import GUI from 'lil-gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

/**
 * Налаштування GUI
 */
const gui = new GUI({ title: 'Керування сценою' })
const params = {
    rotationSpeed: 0.1
}

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
const sizes = { width: window.innerWidth, height: window.innerHeight }

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
camera.position.set(25, 20, 25)
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
 * Освітлення та Тіні
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
directionalLight.position.set(20, 40, 20)
directionalLight.castShadow = true

directionalLight.shadow.mapSize.set(2048, 2048)
directionalLight.shadow.camera.left = -50
directionalLight.shadow.camera.right = 50
directionalLight.shadow.camera.top = 50
directionalLight.shadow.camera.bottom = -50
directionalLight.shadow.camera.far = 100
scene.add(directionalLight)

// GUI для світла
const lightFolder = gui.addFolder('Сонце та Світло')
lightFolder.add(directionalLight, 'intensity').min(0).max(10).name('Яскравість')
lightFolder.add(directionalLight.position, 'x').min(-50).max(50).name('Сонце X')
lightFolder.add(directionalLight.position, 'y').min(10).max(100).name('Сонце Y')
lightFolder.add(directionalLight.position, 'z').min(-50).max(50).name('Сонце Z')
lightFolder.add(renderer, 'toneMappingExposure').min(0).max(5).name('Експозиція')
lightFolder.open()

/**
 * Об'єкти оточення
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.9 })
)
floor.rotation.x = -Math.PI * 0.5
floor.receiveShadow = true
scene.add(floor)

const road = new THREE.Mesh(
    new THREE.BoxGeometry(80, 0.05, 12),
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
let textMesh = null

// 1. Будівля (Зміщена з дороги)
gltfLoader.load('/models/building.glb', (gltf) => {
    buildingModel = gltf.scene
    buildingModel.scale.set(8, 8, 8)
    
    buildingModel.position.set(0, 0, -15) 
    
    buildingModel.traverse(child => { 
        if(child.isMesh) { 
            child.castShadow = true; 
            child.receiveShadow = true; 
        } 
    })
    scene.add(buildingModel)

    directionalLight.target = buildingModel

    const buildGui = gui.addFolder('Будівля')
    buildGui.add(params, 'rotationSpeed').min(0).max(2).name('Швидкість обертання')
    buildGui.add(buildingModel.position, 'z').min(-40).max(10).name('Позиція Z (вбік)')
    buildGui.open()
})

// 2. Машина
gltfLoader.load('/models/car.glb', (gltf) => {
    carModel = gltf.scene
    carModel.scale.set(3, 3, 3)
    carModel.position.set(-20, 0.5, 0)
    carModel.traverse(child => { if(child.isMesh) child.castShadow = true })
    scene.add(carModel)
})

// 3. Дерева
gltfLoader.load('/models/tree.glb', (gltf) => {
    for(let i = -30; i <= 30; i += 10) {
        if (Math.abs(i) < 8) continue
        const treeClone = gltf.scene.clone()
        treeClone.position.set(i, 4.0, -25) 
        treeClone.scale.set(4, 4, 4)
        treeClone.traverse(child => { if(child.isMesh) child.castShadow = true })
        scene.add(treeClone)
    }
})

// 4. Текст
fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
    const textGeometry = new TextGeometry('MODERN PROJECT', {
        font: font, size: 1.8, depth: 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelSegments: 5
    })
    textGeometry.center()
    textMesh = new THREE.Mesh(textGeometry, new THREE.MeshStandardMaterial({ color: '#ffffff' }))
    textMesh.position.set(0, 20, -5)
    scene.add(textMesh)
})

/**
 * Карта оточення (HDR)
 */
rgbeLoader.load('/textures/environment.hdr', (envMap) => {
    envMap.mapping = THREE.EquirectangularReflectionMapping
    scene.background = envMap
    scene.environment = envMap
})

/**
 * Рейкастер та Миша
 */
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1
    mouse.y = -(event.clientY / sizes.height) * 2 + 1
})

window.addEventListener('click', () => {
    raycaster.setFromCamera(mouse, camera)
    
    if (buildingModel) {
        const intersectsBuilding = raycaster.intersectObject(buildingModel, true)
        if (intersectsBuilding.length > 0) alert('Будинок активовано!')
    }

    if (textMesh) {
        const intersectsText = raycaster.intersectObject(textMesh)
        if (intersectsText.length > 0) alert('Ви натиснули на текст!')
    }
})

/**
 * Анімація
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    if (buildingModel) {
        buildingModel.rotation.y += params.rotationSpeed * 0.01
    }

    if (carModel) {
        carModel.position.x = Math.sin(elapsedTime * 0.5) * 30
        carModel.rotation.y = Math.cos(elapsedTime * 0.5) > 0 ? Math.PI * 0.5 : -Math.PI * 0.5
    }

    raycaster.setFromCamera(mouse, camera)

    if (buildingModel) {
        const intersectsBuilding = raycaster.intersectObject(buildingModel, true)
        buildingModel.traverse((child) => {
            if (child.isMesh && child.material.emissive) {
                child.material.emissive.set(intersectsBuilding.length > 0 ? '#221111' : '#000000')
            }
        })
    }

    if (textMesh) {
        const intersectsText = raycaster.intersectObject(textMesh)
        if (intersectsText.length > 0) {
            textMesh.material.color.set('#ffcc00')
            textMesh.scale.set(1.1, 1.1, 1.1)
        } else {
            textMesh.material.color.set('#ffffff')
            textMesh.scale.set(1, 1, 1)
        }
    }

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()