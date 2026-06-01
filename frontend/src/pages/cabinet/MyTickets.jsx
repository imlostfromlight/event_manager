import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import api from '../../api/axios'

const STATUS_LABELS = { active: 'Активный', used: 'Использован', cancelled: 'Отменён', refunded: 'Возвращён' }
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  used: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-yellow-100 text-yellow-700',
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrModal, setQrModal] = useState(null)

  useEffect(() => {
    api.get('/tickets/my/').then(r => {
      setTickets(r.data.results || r.data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Мои билеты</h1>

      {tickets.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-5xl mb-4">🎫</p>
          <p>У вас пока нет билетов</p>
          <Link to="/events" className="btn-primary mt-4 inline-block">Найти мероприятие</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div key={ticket.id} className="card p-5 flex gap-4 items-start">
              {/* QR */}
              <div className="shrink-0">
                {ticket.qr_code ? (
                  <img
                    src={ticket.qr_code}
                    alt="QR"
                    className="w-20 h-20 cursor-pointer hover:opacity-80"
                    onClick={() => setQrModal(ticket)}
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-3xl">🎫</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <Link to={`/events/${ticket.event_id}`} className="font-semibold text-gray-900 hover:text-primary-600">
                    {ticket.event_title}
                  </Link>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status]}`}>
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  📅 {ticket.event_start && format(new Date(ticket.event_start), 'd MMM yyyy, HH:mm', { locale: ru })}
                </p>
                <p className="text-sm text-gray-600">{ticket.ticket_type_name} · {ticket.price} ₸</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{ticket.unique_code}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-xl p-6 text-center max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-2">{qrModal.event_title}</h3>
            <img src={qrModal.qr_code} alt="QR Code" className="w-48 h-48 mx-auto" />
            <p className="text-xs text-gray-500 mt-2 font-mono">{qrModal.unique_code}</p>
            <button onClick={() => setQrModal(null)} className="btn-secondary mt-4 w-full">Закрыть</button>
          </div>
        </div>
      )}
    </div>
  )
}
