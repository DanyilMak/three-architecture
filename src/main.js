import * as THREE from 'three'
import './style.css'

import GUI from 'lil-gui'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

/**
 * Canvas
 */

const canvas = document.querySelector('canvas.webgl')

/**
 * Scene
 */

const scene = new THREE.Scene()

/**
 * GUI
 */

const gui = new GUI()

/**
 * Sizes
 */

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Camera
 */

const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    1000
)

camera.position.set(12, 8, 12)

scene.add(camera)

/**
 * Renderer
 */

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})

renderer.setSize(sizes.width, sizes.height)

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

renderer.shadowMap.enabled = true

renderer.shadowMap.type = THREE.PCFSoftShadowMap

renderer.outputColorSpace = THREE.SRGBColorSpace

renderer.toneMapping = THREE.ACESFilmicToneMapping

renderer.toneMappingExposure = 1.2

/**
 * Controls
 */

const controls = new OrbitControls(camera, canvas)

controls.enableDamping = true

/**
 * Resize
 */

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth

    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height

    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
})

/**
 * Lights
 */

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)

scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 3)

directionalLight.position.set(10, 15, 10)

directionalLight.castShadow = true

directionalLight.shadow.mapSize.width = 2048

directionalLight.shadow.mapSize.height = 2048

directionalLight.shadow.camera.far = 50

directionalLight.shadow.camera.left = -20

directionalLight.shadow.camera.right = 20

directionalLight.shadow.camera.top = 20

directionalLight.shadow.camera.bottom = -20

scene.add(directionalLight)

/**
 * GUI controls
 */

gui.add(directionalLight, 'intensity')
    .min(0)
    .max(10)
    .step(0.1)

gui.add(renderer, 'toneMappingExposure')
    .min(0)
    .max(5)
    .step(0.1)

/**
 * Floor
 */

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({
        color: '#444444',
        roughness: 0.8
    })
)

floor.rotation.x = -Math.PI * 0.5

floor.receiveShadow = true

scene.add(floor)

/**
 * Road
 */

const road = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.02, 4),
    new THREE.MeshStandardMaterial({
        color: '#222222'
    })
)

road.position.y = 0.01

scene.add(road)

/**
 * Main Building
 */

const buildingMaterial = new THREE.MeshStandardMaterial({
    color: '#b0b0b0',
    metalness: 0.3,
    roughness: 0.4
})

const building = new THREE.Mesh(
    new THREE.BoxGeometry(4, 8, 4),
    buildingMaterial
)

building.position.y = 4

building.castShadow = true

building.receiveShadow = true

scene.add(building)

/**
 * Windows
 */

for(let x = -1; x <= 1; x++)
{
    for(let y = 1; y <= 6; y++)
    {
        const windowMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.1),
            new THREE.MeshStandardMaterial({
                color: '#88ccff',
                emissive: '#4488ff',
                emissiveIntensity: 1
            })
        )

        windowMesh.position.set(x * 1.2, y, 2.05)

        scene.add(windowMesh)
    }
}

/**
 * Trees
 */

for(let i = -8; i <= 8; i += 4)
{
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 2),
        new THREE.MeshStandardMaterial({
            color: '#5c4033'
        })
    )

    trunk.position.set(i, 1, -5)

    trunk.castShadow = true

    scene.add(trunk)

    const leaves = new THREE.Mesh(
        new THREE.SphereGeometry(1),
        new THREE.MeshStandardMaterial({
            color: '#228b22'
        })
    )

    leaves.position.set(i, 3, -5)

    leaves.castShadow = true

    scene.add(leaves)
}

/**
 * Car
 */

const car = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 1),
    new THREE.MeshStandardMaterial({
        color: '#ff0000'
    })
)

car.position.set(-10, 0.5, 0)

car.castShadow = true

scene.add(car)

/**
 * 3D Text
 */

const fontLoader = new FontLoader()

fontLoader.load(
    '/fonts/helvetiker_regular.typeface.json',
    (font) =>
    {
        const textGeometry = new TextGeometry(
            'Modern Tower',
            {
                font: font,
                size: 0.5,
                depth: 0.2,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.01,
                bevelSegments: 5
            }
        )

        textGeometry.center()

        const textMaterial = new THREE.MeshStandardMaterial({
            color: '#ffffff'
        })

        const text = new THREE.Mesh(
            textGeometry,
            textMaterial
        )

        text.position.set(0, 9, 0)

        scene.add(text)
    }
)

/**
 * GLTF Model
 */

const gltfLoader = new GLTFLoader()

gltfLoader.load(
    '/models/tree.glb',

    (gltf) =>
    {
        gltf.scene.position.set(6, 2, 5)

        gltf.scene.scale.set(2, 2, 2)

        scene.add(gltf.scene)
    }
)

/**
 * Environment Map
 */

const rgbeLoader = new RGBELoader()

rgbeLoader.load(
    '/textures/environment.hdr',

    (environmentMap) =>
    {
        environmentMap.mapping =
            THREE.EquirectangularReflectionMapping

        scene.background = environmentMap

        scene.environment = environmentMap
    }
)

/**
 * Raycaster
 */

const raycaster = new THREE.Raycaster()

const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) =>
{
    mouse.x = (event.clientX / sizes.width) * 2 - 1

    mouse.y = -(event.clientY / sizes.height) * 2 + 1
})

window.addEventListener('click', () =>
{
    raycaster.setFromCamera(mouse, camera)

    const intersects =
        raycaster.intersectObject(building)

    if(intersects.length)
    {
        alert('Building clicked!')
    }
})

/**
 * Clock
 */

const clock = new THREE.Clock()

/**
 * Animation Loop
 */

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    /**
     * Animate Building
     */

    building.rotation.y = elapsedTime * 0.2

    /**
     * Animate Car
     */

    car.position.x = Math.sin(elapsedTime * 0.5) * 10

    /**
     * Raycaster
     */

    raycaster.setFromCamera(mouse, camera)

    const intersects =
        raycaster.intersectObject(building)

    if(intersects.length)
    {
        building.material.color.set('#ff5555')
    }
    else
    {
        building.material.color.set('#b0b0b0')
    }

    /**
     * Controls
     */

    controls.update()

    /**
     * Render
     */

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()