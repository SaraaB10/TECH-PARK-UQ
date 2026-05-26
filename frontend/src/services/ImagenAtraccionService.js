// src/services/imagenAtraccionService.js
const KEY = (id) => `tp_img_atraccion_${id}`

export const imagenAtraccionService = {
    get(id) {
        if (!id) return null
        return localStorage.getItem(KEY(id)) || null
    },
    set(id, url) {
        if (!id) return
        if (url && url.trim()) {
            localStorage.setItem(KEY(id), url.trim())
        } else {
            localStorage.removeItem(KEY(id))
        }
    },
}