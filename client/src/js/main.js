import * as THREE from 'three'
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {ARButton, CSS2DRenderer} from "three/addons";
import VoxelEngine from "./VoxelEngine.js";
import VoxelRenderer from "./VoxelRenderer.js";
import {PlayerAvatar} from "./PlayerAvatar.js";

const scene = new THREE.Scene()
const fov = 75
const aspect = window.innerWidth / window.innerHeight
const near = 0.1
const far = 1000
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
const canvas = document.querySelector('#c')
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    premultipliedAlpha: false
})
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor')
renderer.setClearColor(0x000000, 0)

const labelRenderer = new CSS2DRenderer()
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)


camera.position.set(0, 5, 20)

const controls = new OrbitControls(camera, renderer.domElement)

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setAnimationLoop(animate)
document.body.appendChild(renderer.domElement)
document.body.appendChild(ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test', 'local-floor'],
}));

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
    modeBtn.textContent = `${voxelRenderer.mode === 'place' ? 'Delete' : 'Place'}`
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

let timePassed = 0
let cameraPosition = camera.position
let cameraRotation = camera.rotation

function animate() {
    controls.update()
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera)

    if (ws === null || ws.readyState !== WebSocket.OPEN) return
    const now = Date.now()
    //  Should also check if user ACTUALLY moved, not just time
    if (now - timePassed > 500) {
        const payload = JSON.stringify({
            type: 'cameraUpdate',
            data: {
                position: camera.position,
                rotation: camera.rotation
            }
        })

        ws.send(payload)
        timePassed = now
    }

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
        if (ws !== null) {
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
    labelRenderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('mousemove', onMouseMove)
window.addEventListener('click', onMouseClick)
window.addEventListener('resize', onWindowResize)

const players = new Map()
let ws = null
const username = document.querySelector('#username')
const btnConnect = document.querySelector('#connectWS')
btnConnect.addEventListener('click', () => {
    ws = new WebSocket(`${import.meta.env.VITE_API_BASE_URL_WS}`)

    ws.addEventListener('open', () => {
        if (ws.readyState !== WebSocket.OPEN) return console.log('Not connected.')
        const payload = JSON.stringify({
            type: 'join',
            username: username.value,
            coordinates: {
                position: camera.position,
                rotation: camera.rotation
            }
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

        } else if (data.type === 'users') {
            data.users.forEach((v) => {
                const pa = new PlayerAvatar(v.username, scene)
                players.set(v.username, pa)
                console.log(data)
                //pa.update(data.users.coordinates[1].position)
            })
            data.voxels.forEach((voxel) => {
                const {x, y, z, color} = voxel
                voxelRenderer.place(x, y, z, color)
            })
        } else if (data.type === 'userJoin') {
            const pa = new PlayerAvatar(data.username, scene)
            pa.update(data.coordinates.position)
            players.set(data.username, pa)
        } else if (data.type === 'voxelUpdate') {
            const {x, y, z, color} = data.data
            voxelRenderer.place(x, y, z, color)
            console.log(`Voxel with properties: x${x}, y${y}, z${z}, ${color} has been placed.`)
        } else if (data.type === 'voxelDelete') {
            const {x, y, z} = data.data
            voxelRenderer.delete(x, y, z)
            console.log(`Voxel with properties ${data.data} has been deleted.`)
        } else if (data.type === 'cameraUpdate') {
            const position = data.data.position
            players.get(data.username).update(position)
        } else if (data.type === 'userDisconnected') {
            console.log(`${data.username} has left the server.`)
            const pd = players.get(data.username)
            pd.remove()
        }
    })
})

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('SW registered'))
        .catch((err) => console.error('SW registration failed:', err))
}