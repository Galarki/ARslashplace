import * as THREE from "three";
import {CSS2DObject} from "three/addons";

export class PlayerAvatar {
    #mesh
    #name
    #scene

    constructor(username, scene) {
        this.#scene = scene
        const playerGeo = new THREE.BoxGeometry(.3, .3, .5)
        const playerMat = new THREE.MeshBasicMaterial({color: 0x000000})

        const playerMesh = new THREE.Mesh(playerGeo, playerMat)

        const playerDiv = document.createElement('div')
        playerDiv.textContent = username
        playerDiv.style.backgroundColor = 'rgba(0,0,0,0.5)'
        playerDiv.style.color = 'white'
        playerDiv.style.padding = '2px 6px'
        playerDiv.style.borderRadius = '4px'
        playerDiv.style.fontSize = '12px'
        playerDiv.style.fontFamily = 'sans-serif'
        playerDiv.style.pointerEvents = 'none'

        const playerLabel = new CSS2DObject(playerDiv)
        playerLabel.position.set(0, 0.5, 0)

        const playerGroup = new THREE.Group()
        playerGroup.add(playerMesh)
        playerGroup.add(playerLabel)
        //scene.add(playerMesh)

        // this.#mesh = playerMesh
        this.#scene.add(playerGroup)
        this.#mesh = playerGroup
        this.#name = username
    }

    update(position, quaternion) {
        const {x, y, z} = position

        this.#mesh.position.set(x, y, z)
        //this.#mesh.quaternion.copy(quaternion)
    }

    remove() {
        this.#mesh.children[1].element.remove()
        this.#scene.remove(this.#mesh)
    }
}