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

export function closestLookColorId(hex) {
  const [r, g, b] = hexToRgb(hex)
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
  return bestId
}

// Divide a foto em 3 faixas horizontais (camisa/calça/calçado) e detecta a
// cor de cada uma — uma aproximação por zonas, não reconhecimento real de
// peça de roupa. Funciona melhor com foto de corpo inteiro, de frente,
// enquadramento vertical (tipo selfie de espelho). Pra mais precisão, usa
// o "Detectar cor por foto" de cada peça em vez desse atalho.
export function detectLookZones(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      try {
        const w = 32
        const h = 96
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        const { data } = ctx.getImageData(0, 0, w, h)

        const avgZone = (yStart, yEnd) => {
          let r = 0
          let g = 0
          let b = 0
          let count = 0
          for (let y = yStart; y < yEnd; y++) {
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4
              if (data[i + 3] < 200) continue
              r += data[i]
              g += data[i + 1]
              b += data[i + 2]
              count++
            }
          }
          return count === 0 ? null : [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
        }

        const closestFromRgb = (rgb) => {
          if (!rgb) return null
          const [r, g, b] = rgb
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
          return bestId
        }

        URL.revokeObjectURL(url)
        resolve({
          camisa: closestFromRgb(avgZone(Math.round(h * 0.18), Math.round(h * 0.45))),
          calca: closestFromRgb(avgZone(Math.round(h * 0.48), Math.round(h * 0.8))),
          calcado: closestFromRgb(avgZone(Math.round(h * 0.85), h)),
        })
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
