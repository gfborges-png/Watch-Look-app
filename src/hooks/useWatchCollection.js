import { useState } from 'react'
import { getCollection, addWatch, updateWatch, deleteWatch, resetCollection, getFavorites, toggleFavorite } from '../lib/storage.js'

// Coleção de relógios + favoritos — o núcleo do app, isolado do resto do
// estado de App.jsx.
export function useWatchCollection() {
  const [collection, setCollection] = useState(() => getCollection())
  const [favorites, setFavorites] = useState(() => getFavorites())

  const refresh = () => {
    setCollection(getCollection())
    setFavorites(getFavorites())
  }

  return {
    collection,
    favorites,
    addWatch: (data) => setCollection(addWatch(data)),
    updateWatch: (id, data) => setCollection(updateWatch(id, data)),
    deleteWatch: (id) => setCollection(deleteWatch(id)),
    resetCollection: () => setCollection(resetCollection()),
    toggleFavorite: (id) => setFavorites(toggleFavorite(id)),
    refresh,
  }
}
