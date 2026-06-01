import { useState, useEffect, useCallback } from 'react'
import api from '../../api/axios'
import EventCard from '../../components/events/EventCard'
import useAuthStore from '../../store/authStore'

const EVENT_TYPES = [
  { value: '', label: 'Все' },
  { value: 'online', label: 'Онлайн' },
  { value: 'offline', label: 'Оффлайн' },
]
const EVENT_FORMATS = [
  { value: '', label: 'Все' },
  { value: 'free', label: 'Бесплатные' },
  { value: 'paid', label: 'Платные' },
]

export default function Feed() {
  const { isAuthenticated } = useAuthStore()
  const [events, setEvents] = useState([])
  const [recommended, setRecommended] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', category: '', event_type: '', event_format: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tab, setTab] = useState('all') // 'all' | 'recommended'

  useEffect(() => {
    api.get('/events/categories/').then(r => setCategories(r.data.results || r.data))
  }, [])

  useEffect(() => {
    if (isAuthenticated && tab === 'recommended') {
      api.get('/events/recommended/').then(r => setRecommended(r.data))
    }
  }, [isAuthenticated, tab])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
      const { data } = await api.get('/events/', { params })
      setEvents(data.results)
      setTotalPages(Math.ceil(data.count / 12))
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const setFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  const displayEvents = tab === 'recommended' ? recommended : events

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Мероприятия</h1>

        {/* Tabs */}
        {isAuthenticated && (
          <div className="flex gap-2">
            <button
              onClick={() => setTab('all')}
              className={`text-sm px-4 py-1.5 rounded-full font-medium ${tab === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
            >
              Все
            </button>
            <button
              onClick={() => setTab('recommended')}
              className={`text-sm px-4 py-1.5 rounded-full font-medium ${tab === 'recommended' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}
            >
              ✨ Рекомендации
            </button>
          </div>
        )}
      </div>

      {/* Filters (shown only for 'all' tab) */}
      {tab === 'all' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
          <input
            className="input flex-1 min-w-48"
            placeholder="🔍 Поиск мероприятий..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />

          <select className="input w-auto" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
            <option value="">Все категории</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>
            ))}
          </select>

          <select className="input w-auto" value={filters.event_type} onChange={e => setFilter('event_type', e.target.value)}>
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <select className="input w-auto" value={filters.event_format} onChange={e => setFilter('event_format', e.target.value)}>
            {EVENT_FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-5xl mb-4">🔍</p>
          <p>{tab === 'recommended' ? 'Нет рекомендаций. Добавьте интересы в профиле.' : 'Мероприятия не найдены'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayEvents.map(event => (
            <EventCard key={event.id} event={event} onUpdate={fetchEvents} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {tab === 'all' && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${p === page ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
