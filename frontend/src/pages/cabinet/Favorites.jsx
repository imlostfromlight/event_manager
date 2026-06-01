import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import EventCard from '../../components/events/EventCard'

export default function Favorites() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data } = await api.get('/events/favorites/')
    setEvents(data.results || data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Избранное</h1>
      {events.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-5xl mb-4">❤️</p>
          <p>Нет сохранённых мероприятий</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <EventCard key={event.id} event={event} onUpdate={fetch} />
          ))}
        </div>
      )}
    </div>
  )
}
