import { useState } from 'react'
import {
  getSneakers,
  addSneaker,
  addSneakers,
  updateSneaker,
  deleteSneaker,
  getPerfumes,
  addPerfume,
  addPerfumes,
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
    addSneakers: (dataList) => setSneakers(addSneakers(dataList)),
    updateSneaker: (id, data) => setSneakers(updateSneaker(id, data)),
    deleteSneaker: (id) => setSneakers(deleteSneaker(id)),
    addPerfume: (data) => setPerfumes(addPerfume(data)),
    addPerfumes: (dataList) => setPerfumes(addPerfumes(dataList)),
    updatePerfume: (id, data) => setPerfumes(updatePerfume(id, data)),
    deletePerfume: (id) => setPerfumes(deletePerfume(id)),
    refresh,
  }
}
