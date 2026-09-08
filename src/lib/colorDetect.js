// Detecta a cor predominante de uma foto (ex: foto do tênis) e acha o
// swatch mais próximo em LOOK_COLORS. Tudo roda no navegador via canvas —
// a imagem nunca sai do dispositivo nem é enviada a lugar nenhum.
import { LOOK_COLORS } from './matchEngine.js'

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function detectDominantColorId(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      try {
        const size = 48
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
        URL.revokeObjectURL(url)
        if (count === 0) {
          reject(new Error('Não foi possível ler cores nessa imagem'))
          return
        }
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)

        let bestId = null
        let bestDist = Infinity
        for (const c of LOOK_COLORS) {
          const [cr, cg, cb] = hexToRgb(c.hex)
          const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
          if (dist < bestDist) {
            bestDist = dist
            bestId = c.id
          }
        }
        resolve(bestId)
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível abrir essa imagem'))
    }

    img.src = url
  })
}
