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

function animate() {
    controls.update()
    renderer.render(scene, camera);
}

function onMouseClick() {
    if (!voxelRenderer.ghostVisible) return
    const {x, y, z} = voxelRenderer.ghostPosition

    if (voxelRenderer.mode === 'delete') {
        voxelRenderer.delete(x, y, z)
        const payload = JSON.stringify({
            type: 'voxelDelete',
            data: {
                x: x,
                y: y,
                z: z,
                color: color
            }
        })
        ws.send(payload)

    } else if (voxelRenderer.mode === 'place') {
        voxelRenderer.place(x, y, z, color)
        const payload = JSON.stringify({
            type: 'voxelUpdate',
            data: {
                x: x,
                y: y,
                z: z,
                color: color
            }
        })
        ws.send(payload)
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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('mousemove', onMouseMove)
window.addEventListener('click', onMouseClick)
window.addEventListener('resize', onWindowResize)

// AI generated dummy data, too lazy to do myself
const dummyVoxels = [
    // Ground layer (y = 0.5)
    {x: 0, y: 0.5, z: 0, color: 0x8cff90},      // green
    {x: 1, y: 0.5, z: 0, color: 0x8cff90},      // green
    {x: 2, y: 0.5, z: 0, color: 0x8cff90},      // green
    {x: -1, y: 0.5, z: 0, color: 0x8cff90},     // green
    {x: -2, y: 0.5, z: 0, color: 0x8cff90},     // green
    {x: 0, y: 0.5, z: 1, color: 0x8cff90},      // green
    {x: 0, y: 0.5, z: -1, color: 0x8cff90},     // green
    {x: 1, y: 0.5, z: 1, color: 0x8cff90},      // green
    {x: -1, y: 0.5, z: -1, color: 0x8cff90},    // green

    // Second layer (y = 1.5) - pyramid shape
    {x: 0, y: 1.5, z: 0, color: 0xff0000},      // red
    {x: 1, y: 1.5, z: 0, color: 0xff0000},      // red
    {x: -1, y: 1.5, z: 0, color: 0xff0000},     // red
    {x: 0, y: 1.5, z: 1, color: 0xff0000},      // red
    {x: 0, y: 1.5, z: -1, color: 0xff0000},     // red

    // Third layer (y = 2.5)
    {x: 0, y: 2.5, z: 0, color: 0x0000ff},      // blue
    {x: 1, y: 2.5, z: 0, color: 0x0000ff},      // blue

    // Top (y = 3.5)
    {x: 0, y: 3.5, z: 0, color: 0xffff00},      // yellow
];

dummyVoxels.forEach(voxel => {
    voxelRenderer.place(voxel.x, voxel.y, voxel.z, voxel.color)
})


let ws = null
const username = document.querySelector('#username')
const btnConnect = document.querySelector('#connectWS')
btnConnect.addEventListener('click', () => {
    ws = new WebSocket(`ws://localhost:3000`)

    ws.addEventListener('open', () => {
        if (ws.readyState !== WebSocket.OPEN) return console.log('Not connected.')
        const payload = JSON.stringify({
            type: 'join',
            username: username.value
        })
        console.log('Connected.')
        btnConnect.style.display = 'none'

        ws.send(payload)
    })

    ws.addEventListener('close', () => {
        btnConnect.style.display = 'block'
        console.log('Websocket connection has been closed.')
    })

    ws.addEventListener('error', () => {
        console.log('Something went wrong with the websocket connection.')
    })

    ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'message') {

        } else if (data.type === 'voxelUpdate') {
            const {x, y, z, color} = data.data
            voxelRenderer.place(x, y, z, color)
            console.log(`Voxel with properties: x${x}, y${y}, z${z}, ${color} has been placed.`)
        } else if (data.type === 'voxelDelete') {
            const {x, y, z} = data.data
            voxelRenderer.delete(x, y, z)
            console.log(`Voxel with properties ${data.data} has been deleted.`)
        }
    })
})





