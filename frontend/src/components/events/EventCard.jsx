import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const TYPE_LABELS = { online: 'Онлайн', offline: 'Оффлайн' }
const FORMAT_LABELS = { free: 'Бесплатно', paid: 'Платно' }
const TYPE_COLORS = { online: 'bg-blue-100 text-blue-700', offline: 'bg-green-100 text-green-700' }

export default function EventCard({ event, onUpdate }) {
  const { isAuthenticated } = useAuthStore()

  const toggleFavorite = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Войдите в систему'); return }
    try {
      if (event.is_favorite) {
        await api.delete(`/events/${event.id}/unfavorite/`)
      } else {
        await api.post(`/events/${event.id}/favorite/`)
      }
      onUpdate?.()
    } catch {
      toast.error('Ошибка')
    }
  }

  return (
    <Link to={`/events/${event.id}`} className="card hover:shadow-md transition-shadow block">
      {/* Cover */}
      <div className="relative h-44 bg-gradient-to-br from-primary-100 to-primary-200">
        {event.cover_image ? (
          <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {event.category?.icon || '🎉'}
          </div>
        )}
        <button
          onClick={toggleFavorite}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
        >
          {event.is_favorite ? '❤️' : '🤍'}
        </button>
        <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[event.event_type]}`}>
          {TYPE_LABELS[event.event_type]}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">{event.title}</h3>
          <span className={`text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded-full ${
            event.event_format === 'free' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {FORMAT_LABELS[event.event_format]}
          </span>
        </div>

        {event.category && (
          <p className="text-xs text-gray-500 mb-2">
            {event.category.icon} {event.category.name}
          </p>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p>📅 {format(new Date(event.start_time), 'd MMM yyyy, HH:mm', { locale: ru })}</p>
          {event.place && <p className="truncate">📍 {event.place}</p>}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>👤 {event.organizer_name}</span>
          <span>
            {event.registrations_count}
            {event.participant_limit ? `/${event.participant_limit}` : ''} чел.
          </span>
        </div>
      </div>
    </Link>
  )
}
