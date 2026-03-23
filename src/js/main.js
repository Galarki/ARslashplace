import * as THREE from 'three'
import {VRButton} from "three/addons/webxr/VRButton.js";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import VoxelEngine from "./VoxelEngine.js";
import VoxelRenderer from "./VoxelRenderer.js";

const scene = new THREE.Scene()
const fov = 75
const aspect = window.innerWidth / window.innerHeight
const near = 0.1
const far = 1000
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
const canvas = document.querySelector('#c')
const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, premultipliedAlpha: false
})
renderer.xr.enabled = true;

camera.position.set(0, 1, 6)

const controls = new OrbitControls(camera, renderer.domElement)

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animate)
document.body.appendChild(renderer.domElement)
document.body.appendChild(VRButton.createButton(renderer));

const gridHelper = new THREE.GridHelper(30, 30)
const groundGeo = new THREE.PlaneGeometry(30, 30)
const groundMat = new THREE.MeshBasicMaterial({visible: false, side: THREE.DoubleSide})
const groundPlane = new THREE.Mesh(groundGeo, groundMat)

groundPlane.rotation.x = -Math.PI / 2

scene.add(gridHelper)
scene.add(groundPlane)

const voxelEngine = new VoxelEngine()
const voxelRenderer = new VoxelRenderer(voxelEngine, scene, groundPlane)

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

let color

function onMouseClick() {
    if (!voxelRenderer.ghostVisible) return
    const {x, y, z} = voxelRenderer.ghostPosition

    if (voxelRenderer.mode === 'delete') {
        voxelRenderer.delete(x, y, z)
    } else if (voxelRenderer.mode === 'place') {
        voxelRenderer.place(x, y, z, color)
    }
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObjects(voxelRenderer.targets)
    if (!intersects.length) {
        voxelRenderer.hideGhost()
        return
    }

    const hit = intersects[0]
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    const isGround = hit.object === groundPlane

    if (isGround) {
        const X = Math.round(hit.point.x - 0.5) + 0.5
        const Y = 0.5
        const Z = Math.round(hit.point.z - 0.5) + 0.5

        voxelRenderer.updateGhost(X, Y, Z)
    } else {
        if (voxelRenderer.mode === 'delete') {
            const {x, y, z} = hit.object.position
            voxelRenderer.updateGhost(x, y, z)
        } else {
            const x = hit.object.position.x + normal.x
            const y = hit.object.position.y + normal.y
            const z = hit.object.position.z + normal.z
            if (y >= 0.5) voxelRenderer.updateGhost(x, y, z)
            else voxelRenderer.hideGhost()
        }
    }
}

const modeBtn = document.querySelector('#mode-btn')
const colorBtn = document.querySelector('.color-picker')
modeBtn.addEventListener('click', () => {
    modeBtn.style.backgroundColor = voxelRenderer.mode === 'place' ? 'red' : 'green'
    modeBtn.textContent = `Current mode: ${voxelRenderer.mode === 'place' ? 'Delete' : 'Place'}`
    voxelRenderer.mode = voxelRenderer.mode === 'place' ? 'delete' : 'place'
})

colorBtn.addEventListener('click', (event) => {
    if (event.target.classList.contains('color-button')) {
        const selectedColor = event.target.dataset.color
        const allowedColors = ['red', 'green', 'blue']
        if (!allowedColors.includes(selectedColor)) console.log(`${selectedColor} is not a valid color.`)
        else color = selectedColor
        const currentActive = colorBtn.querySelector('#active')
        if (currentActive) currentActive.id = ""
        event.target.id = 'active'
    }
})

window.addEventListener('mousemove', onMouseMove)
window.addEventListener('click', onMouseClick)

function animate() {
    controls.update()
    renderer.render(scene, camera)
}

