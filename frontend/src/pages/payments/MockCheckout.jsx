import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function MockCheckout() {
  const { paymentId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [ticketData, setTicketData] = useState(null)

  const payment = state?.payment
  const event = state?.event

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      const { data } = await api.post(`/payments/confirm/${paymentId}/`)
      setTicketData(data)
      setConfirmed(true)
      toast.success('Оплата прошла успешно!')
    } catch {
      toast.error('Ошибка оплаты')
    } finally {
      setConfirming(false)
    }
  }

  if (confirmed && ticketData) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="card p-8">
          <p className="text-6xl mb-4">🎉</p>
          <h1 className="text-2xl font-bold mb-2">Оплата прошла!</h1>
          <p className="text-gray-500 mb-6">Ваш билет успешно оформлен</p>
          {ticketData.qr_code && (
            <img src={ticketData.qr_code} alt="QR" className="w-40 h-40 mx-auto mb-4" />
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/cabinet/tickets')} className="btn-primary">Мои билеты</button>
            <button onClick={() => navigate(`/events/${event?.id || ''}`)} className="btn-secondary">К мероприятию</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="card p-8">
        <div className="text-center mb-6">
          <p className="text-5xl mb-3">
            {payment?.method === 'kaspi' ? '🟡' : '💳'}
          </p>
          <h1 className="text-xl font-bold">
            {payment?.method === 'kaspi' ? 'Оплата через Kaspi' : 'Оплата через Stripe'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">(Демо-режим — реальных списаний нет)</p>
        </div>

        {event && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-gray-500">ID транзакции: {payment?.transaction_id?.slice(0, 8)}...</p>
          </div>
        )}

        <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-4">
          <span className="text-gray-600">Сумма к оплате</span>
          <span className="text-2xl font-bold text-primary-600">{payment?.amount} ₸</span>
        </div>

        {payment?.method === 'kaspi' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
            💡 В реальной интеграции здесь был бы QR-код Kaspi Pay или ссылка на оплату
          </div>
        )}
        {payment?.method === 'stripe' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
            💡 В реальной интеграции здесь был бы Stripe Checkout form
          </div>
        )}

        <button onClick={handleConfirm} disabled={confirming} className="btn-primary w-full py-3 text-base">
          {confirming ? 'Обрабатываем...' : `Оплатить ${payment?.amount} ₸`}
        </button>
        <button onClick={() => navigate(-1)} className="btn-secondary w-full mt-2">
          Отмена
        </button>
      </div>
    </div>
  )
}
