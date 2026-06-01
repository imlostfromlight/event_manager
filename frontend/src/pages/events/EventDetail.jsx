import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import StripePaymentModal from '../../components/payments/StripePaymentModal'

export default function EventDetail({ isPrivate = false }) {
  const { id, token } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [ticketTypes, setTicketTypes] = useState([])
  const [comments, setComments] = useState([])
  const [reviews, setReviews] = useState([])
  const [newComment, setNewComment] = useState('')
  const [newReview, setNewReview] = useState({ rating: 5, text: '' })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showReport, setShowReport] = useState(false)
  const [paymentModal, setPaymentModal] = useState(null) // { paymentId, amount, ticketName, method }

  useEffect(() => {
    const url = isPrivate ? `/events/private/${token}/` : `/events/${id}/`
    Promise.all([
      api.get(url),
      api.get('/events/categories/'),
    ]).then(([r]) => {
      setEvent(r.data)
      setLoading(false)
    }).catch(() => { toast.error('Мероприятие не найдено'); navigate('/events') })

    if (id) {
      api.get(`/events/${id}/comments/`).then(r => setComments(r.data))
      api.get(`/events/${id}/reviews/`).then(r => setReviews(r.data))
      api.get(`/tickets/types/?event=${id}`).then(r => setTicketTypes(r.data.results || r.data))
    }
  }, [id, token, isPrivate, navigate])

  const handleRegister = async () => {
    setActionLoading(true)
    try {
      await api.post(`/events/${event.id}/register/`)
      toast.success('Вы зарегистрированы!')
      setEvent(e => ({ ...e, is_registered: true, registrations_count: e.registrations_count + 1 }))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnregister = async () => {
    setActionLoading(true)
    try {
      await api.post(`/events/${event.id}/unregister/`)
      toast.success('Регистрация отменена')
      setEvent(e => ({ ...e, is_registered: false, registrations_count: e.registrations_count - 1 }))
    } catch {
      toast.error('Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBuyTicket = async (ticketType, method = 'stripe') => {
    setActionLoading(true)
    try {
      const { data } = await api.post('/payments/initiate/', { ticket_type_id: ticketType.id, method })
      setPaymentModal({
        paymentId: data.payment_id,
        amount: data.amount,
        ticketName: ticketType.name,
        method,
      })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (!isAuthenticated) { toast.error('Войдите в систему'); return }
    try {
      if (event.is_favorite) {
        await api.delete(`/events/${event.id}/unfavorite/`)
        setEvent(e => ({ ...e, is_favorite: false }))
      } else {
        await api.post(`/events/${event.id}/favorite/`)
        setEvent(e => ({ ...e, is_favorite: true }))
      }
    } catch { toast.error('Ошибка') }
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      const { data } = await api.post(`/events/${event.id}/comments/`, { text: newComment })
      setComments(prev => [data, ...prev])
      setNewComment('')
    } catch { toast.error('Ошибка') }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/events/${event.id}/reviews/`, newReview)
      setReviews(prev => [data, ...prev])
      toast.success('Отзыв добавлен!')
    } catch { toast.error('Отзыв уже оставлен или произошла ошибка') }
  }

  const submitReport = async () => {
    if (!reportReason) return
    try {
      await api.post(`/events/${event.id}/report/`, { reason: reportReason })
      toast.success('Жалоба отправлена')
      setShowReport(false)
    } catch { toast.error('Ошибка') }
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )
  if (!event) return null

  const isOrganizer = user?.id === event.organizer_id || user?.role === 'admin'
  const canRegister = isAuthenticated && !isOrganizer
  const eventPast = new Date(event.end_time) < new Date()

  return (
    <>
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-56 bg-gradient-to-br from-primary-100 to-primary-300 relative">
          {event.cover_image && (
            <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-end p-6">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs bg-white/90 text-gray-800 px-2 py-0.5 rounded-full font-medium">
                  {event.event_type === 'online' ? '💻 Онлайн' : '📍 Оффлайн'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  event.event_format === 'free' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {event.event_format === 'free' ? 'Бесплатно' : 'Платно'}
                </span>
                {event.category && (
                  <span className="text-xs bg-white/90 text-gray-800 px-2 py-0.5 rounded-full">
                    {event.category.icon} {event.category.name}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">{event.title}</h1>
            </div>
            <button onClick={handleFavorite} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl ml-4 hover:scale-110 transition-transform">
              {event.is_favorite ? '❤️' : '🤍'}
            </button>
          </div>
        </div>

        <div className="p-6 grid md:grid-cols-3 gap-6">
          {/* Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>📅</span>
              <span>{format(new Date(event.start_time), 'd MMMM yyyy, HH:mm', { locale: ru })}</span>
              <span>—</span>
              <span>{format(new Date(event.end_time), 'HH:mm')}</span>
            </div>
            {event.place && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📍</span>
                <span>{event.place}</span>
                {event.map_link && (
                  <a href={event.map_link} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-xs">
                    Открыть карту
                  </a>
                )}
              </div>
            )}
            {event.meeting_link && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>🎥</span>
                <a href={event.meeting_link} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                  Подключиться к онлайн-встрече
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>👤</span>
              <span>Организатор: {event.organizer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>👥</span>
              <span>
                {event.registrations_count} участников
                {event.participant_limit && ` из ${event.participant_limit}`}
              </span>
            </div>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-3">
            {isOrganizer && (
              <Link to={`/events/${event.id}/edit`} className="btn-secondary text-center">
                ✏️ Редактировать
              </Link>
            )}

            {canRegister && !eventPast && (
              <>
                {event.event_format === 'free' ? (
                  event.is_registered ? (
                    <button onClick={handleUnregister} disabled={actionLoading} className="btn-secondary">
                      ✓ Отменить регистрацию
                    </button>
                  ) : (
                    <button onClick={handleRegister} disabled={actionLoading} className="btn-primary">
                      {actionLoading ? '...' : 'Записаться'}
                    </button>
                  )
                ) : (
                  ticketTypes.length > 0 && ticketTypes.map(tt => (
                    <div key={tt.id} className="space-y-1">
                      <p className="text-sm font-semibold text-gray-700">{tt.name} — {tt.price} ₸
                        <span className="text-xs text-gray-400 ml-1">({tt.available} мест)</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBuyTicket(tt, 'stripe')}
                          disabled={actionLoading || tt.available === 0}
                          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-white bg-[#635bff] hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                        >
                          💳 Stripe
                        </button>
                        <button
                          onClick={() => handleBuyTicket(tt, 'kaspi')}
                          disabled={actionLoading || tt.available === 0}
                          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-white bg-[#e31837] hover:bg-[#c41530] disabled:opacity-50 transition-colors"
                        >
                          🟠 Kaspi
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {isAuthenticated && !isOrganizer && (
              <button onClick={() => setShowReport(!showReport)} className="text-sm text-red-500 hover:underline">
                Пожаловаться
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report */}
      {showReport && (
        <div className="card p-4 mb-6">
          <h3 className="font-medium mb-2">Причина жалобы</h3>
          <select className="input mb-2" value={reportReason} onChange={e => setReportReason(e.target.value)}>
            <option value="">Выберите причину</option>
            <option value="spam">Спам</option>
            <option value="inappropriate">Неприемлемый контент</option>
            <option value="misleading">Вводит в заблуждение</option>
            <option value="other">Другое</option>
          </select>
          <button onClick={submitReport} className="btn-primary text-sm">Отправить</button>
        </div>
      )}

      {/* Description */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Описание</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
      </div>

      {/* Reviews */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Отзывы {event.avg_rating && <span className="text-yellow-500 text-base">⭐ {event.avg_rating}</span>}
        </h2>
        {isAuthenticated && eventPast && (
          <form onSubmit={submitReview} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-2 mb-2">
              {[1,2,3,4,5].map(s => (
                <button key={s} type="button" onClick={() => setNewReview(r => ({...r, rating: s}))}
                  className={`text-2xl ${s <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
              ))}
            </div>
            <textarea
              className="input mb-2"
              rows={2}
              placeholder="Ваш отзыв..."
              value={newReview.text}
              onChange={e => setNewReview(r => ({...r, text: e.target.value}))}
            />
            <button type="submit" className="btn-primary text-sm">Оставить отзыв</button>
          </form>
        )}
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">Пока нет отзывов</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{r.user_name}</span>
                  <span className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                </div>
                {r.text && <p className="text-sm text-gray-600">{r.text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Комментарии ({comments.length})</h2>
        {isAuthenticated && (
          <form onSubmit={submitComment} className="mb-4 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Написать комментарий..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button type="submit" className="btn-primary">Отправить</button>
          </form>
        )}
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm">Пока нет комментариев</p>
        ) : (
          <div className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm shrink-0">
                  {c.user_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.user_name}</p>
                  <p className="text-sm text-gray-600">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {paymentModal && (
      <StripePaymentModal
        paymentId={paymentModal.paymentId}
        amount={paymentModal.amount}
        ticketName={paymentModal.ticketName}
        method={paymentModal.method}
        onSuccess={() => {
          setPaymentModal(null)
          setEvent(e => ({ ...e, is_registered: true }))
        }}
        onClose={() => setPaymentModal(null)}
      />
    )}
    </>
  )
}
