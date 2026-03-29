import * as THREE from 'three'
import {toKey} from "./helpers/helpers.js";

export default class VoxelRenderer {
    #engine
    #scene
    #voxels = new Map()
    #materials = new Map()  // Contains all different materials aka colors eventually. Not quite yet tho
    #geometry = new THREE.BoxGeometry(1, 1, 1)
    #ghostMesh
    #mode = 'place'
    #groundPlane

    constructor(engine, scene, groundPlane) {
        this.#engine = engine
        this.#scene = scene
        this.#ghostMesh = scene
        this.#groundPlane = groundPlane
        this.#ghostMesh = this.#createGhost()
    }

    get mode() {
        return this.#mode
    }

    set mode(m) {
        this.#mode = m
    }

    get targets() {
        return [this.#groundPlane, ...this.#voxels.values()]
    }

    place(x, y, z, color = 'red') {
        if (!this.#engine.place(x, y, z, color)) return
        if (!this.#materials.has(color)) {
            this.#materials.set(color, new THREE.MeshBasicMaterial({color}))
        }

        const mesh = new THREE.Mesh(this.#geometry, this.#materials.get(color))
        mesh.position.set(x, y, z)
        this.#voxels.set(toKey(x, y, z), mesh)
        this.#scene.add(mesh)
    }

    delete(x, y, z) {
        if (!this.#engine.delete(x, y, z)) return
        const key = toKey(x, y, z)
        const mesh = this.#voxels.get(key)
        if (!mesh) return
        this.#scene.remove(mesh)
        this.#voxels.delete(key)
    }

    updateGhost(x, y, z) {
        const occupied = this.#engine.has(x, y, z)

        if (this.#mode === 'delete') {
            this.#ghostMesh.material.color.set(occupied ? 'red' : 'grey')
        } else {
            this.#ghostMesh.material.color.set(occupied ? 'grey' : 'red')
        }

        this.#ghostMesh.position.set(x, y, z)
        this.#ghostMesh.visible = true
    }

    hideGhost() {
        this.#ghostMesh.visible = false
    }

    get ghostPosition() {
        return this.#ghostMesh.position
    }

    get ghostVisible() {
        return this.#ghostMesh.visible
    }

    #createGhost() {
        const material = new THREE.MeshBasicMaterial({color: 'red', opacity: 0.4, transparent: true})
        const mesh = new THREE.Mesh(this.#geometry, material)
        mesh.scale.set(1.01, 1.01, 1.01)
        mesh.visible = false
        this.#scene.add(mesh)
        return mesh
    }


}