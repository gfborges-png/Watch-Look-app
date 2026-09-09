import { useState } from 'react'
import {
  getSneakers,
  addSneaker,
  updateSneaker,
  deleteSneaker,
  getPerfumes,
  addPerfume,
  updatePerfume,
  deletePerfume,
} from '../lib/storage.js'

// Tênis + perfumes cadastrados — o guarda-roupa fora do relógio em si.
export function useWardrobe() {
  const [sneakers, setSneakers] = useState(() => getSneakers())
  const [perfumes, setPerfumes] = useState(() => getPerfumes())

  const refresh = () => {
    setSneakers(getSneakers())
    setPerfumes(getPerfumes())
  }

  return {
    sneakers,
    perfumes,
    addSneaker: (data) => setSneakers(addSneaker(data)),
    updateSneaker: (id, data) => setSneakers(updateSneaker(id, data)),
    deleteSneaker: (id) => setSneakers(deleteSneaker(id)),
    addPerfume: (data) => setPerfumes(addPerfume(data)),
    updatePerfume: (id, data) => setPerfumes(updatePerfume(id, data)),
    deletePerfume: (id) => setPerfumes(deletePerfume(id)),
    refresh,
  }
}
