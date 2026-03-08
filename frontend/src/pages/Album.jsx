import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPhotos, uploadPhoto } from '../lib/api'
import { useStore } from '../store/useStore'
import Skeleton from '../components/Skeleton'

const Album = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, setToast } = useStore()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('all')

  const fetchPhotos = async () => {
    try {
      const res = await getPhotos(id)
      setPhotos(res.data)
    } catch (err) {
      setToast({ message: 'Failed to load photos 📸', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [id])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      await uploadPhoto(id, file)
      setToast({ message: 'Photo uploaded! 📸', type: 'success' })
      fetchPhotos()
    } catch (err) {
      setToast({ message: 'Upload failed ❌', type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const filteredPhotos = filter === 'all'
    ? photos
    : photos.filter(p => p.uploaded_by === filter)

  const uploaders = Array.from(new Set(photos.map(p => p.user?.id))).map(id => {
    return photos.find(p => p.user?.id === id).user
  })

  return (
    <div className="p-6 pb-32 max-w-md mx-auto space-y-8 animate-in fade-in duration-500 safe-top">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass flex items-center justify-center">🔙</button>
          <h1 className="text-3xl font-display font-black italic">MEMORIES</h1>
        </div>
        <label className={`w-12 h-12 rounded-full bg-primary-red flex items-center justify-center text-background text-2xl shadow-lg shadow-primary-red/20 active:scale-90 transition-transform cursor-pointer ${uploading ? 'animate-spin' : ''}`}>
          {uploading ? '⏳' : '+'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Filter Strip */}
      {uploaders.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${filter === 'all' ? 'bg-primary-yellow text-background' : 'bg-white/5 opacity-40'}`}
          >
            All
          </button>
          {uploaders.map(u => (
            <button
              key={u.id}
              onClick={() => setFilter(u.id)}
              className={`px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase transition-all ${filter === u.id ? 'bg-primary-yellow text-background' : 'bg-white/5 opacity-40'}`}
            >
              <span>{u.emoji}</span>
              <span>{u.name?.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (
        <div className="columns-2 gap-4 space-y-4">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="relative group rounded-3xl overflow-hidden glass break-inside-avoid">
              <img
                src={photo.url}
                alt="Memory"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{photo.user?.emoji}</span>
                  <span className="text-[10px] font-black uppercase">{photo.user?.name}</span>
                </div>
              </div>
              <button className="absolute top-2 right-2 w-8 h-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                ❤️
              </button>
            </div>
          ))}

          {filteredPhotos.length === 0 && (
            <div className="col-span-2 text-center py-32 opacity-20 space-y-4">
              <span className="text-6xl block">📸</span>
              <p className="font-display font-black normal-case text-xl italic">No photos yet...</p>
              <p className="text-[10px] uppercase font-black tracking-widest leading-loose">Be the first to add <br /> a memory from the vibe.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Album
