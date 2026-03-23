import {toKey} from "./helpers/helpers.js";


export default class VoxelEngine {
    #voxels = new Map()

    place(x, y, z, color) {
        const key = toKey(x, y, z)
        if (this.#voxels.has(key)) return false
        this.#voxels.set(key, color)
        return true
    }

    delete(x, y, z) {
        const key = toKey(x, y, z)
        if (!this.#voxels.has(key)) return false
        this.#voxels.delete(key)
        return true
    }

    has(x, y, z) {
        return this.#voxels.has(toKey(x, y, z))
    }

    getAll() {
        return [...this.#voxels.entries()]
    }


}