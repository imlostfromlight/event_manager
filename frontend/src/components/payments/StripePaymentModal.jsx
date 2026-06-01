import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const CARD_BRANDS = {
  '4': { name: 'Visa', color: '#1a1f71', logo: '💳' },
  '5': { name: 'Mastercard', color: '#eb001b', logo: '💳' },
  '3': { name: 'Amex', color: '#007bc1', logo: '💳' },
}

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

export default function StripePaymentModal({ paymentId, amount, ticketName, method, onSuccess, onClose }) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form') // 'form' | 'processing' | 'success'
  const [ticket, setTicket] = useState(null)

  const brand = CARD_BRANDS[cardNumber.replace(/\s/g, '')[0]] || null
  const isStripe = method === 'stripe'

  const isComplete = cardNumber.replace(/\s/g, '').length === 16
    && expiry.length === 5
    && cvc.length >= 3
    && name.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isComplete) return
    setLoading(true)
    setStep('processing')

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1800))

    try {
      const { data } = await api.post(`/payments/confirm/${paymentId}/`, {
        card_last4: cardNumber.replace(/\s/g, '').slice(-4),
      })
      setTicket(data)
      setStep('success')
      toast.success('Оплата прошла успешно!')
      onSuccess?.(data)
    } catch (err) {
      setStep('form')
      toast.error(err.response?.data?.detail || 'Ошибка оплаты')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between ${isStripe ? 'bg-[#635bff]' : 'bg-[#e31837]'}`}>
          <div className="flex items-center gap-3">
            {isStripe ? (
              <svg viewBox="0 0 60 25" className="h-7 fill-white"><path d="M59.64 14.28h-8.06v-2.5h5.46c.17-.14.17-.31 0-.45h-5.46v-2.14h8.06c.21 0 .36.15.36.36v4.37c0 .2-.15.36-.36.36zm-13.62 0h-3.26l-4.16-6.22v6.22h-2.9V7.53h3.45l3.97 5.95V7.53h2.9v6.75zM23.7 14.28h-9.25V7.53h2.9v4.47h6.35v2.28zm-12.26 0H8.53L5.22 7.53h3.13l2.1 4.44 2.1-4.44h3.12l-3.31 6.75zM0 14.28V7.53h2.9v6.75H0z"/></svg>
            ) : (
              <span className="text-white font-bold text-lg">Kaspi Pay</span>
            )}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl">✕</button>
        </div>

        {step === 'processing' && (
          <div className="p-10 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-[#635bff] animate-spin" />
            </div>
            <p className="text-gray-600 font-medium">Обработка платежа...</p>
            <p className="text-xs text-gray-400">Пожалуйста, не закрывайте окно</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">✓</div>
            <h3 className="text-xl font-semibold text-gray-800">Оплата прошла!</h3>
            <p className="text-gray-500 text-sm">Билет «{ticketName}» доступен в личном кабинете</p>
            {ticket?.qr_code && (
              <img src={ticket.qr_code} alt="QR" className="w-36 h-36 rounded-lg border" />
            )}
            <button onClick={onClose} className="btn-primary w-full">Отлично</button>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amount */}
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Билет</p>
                <p className="font-medium text-gray-800">{ticketName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Сумма</p>
                <p className="text-xl font-bold text-gray-900">{amount} ₸</p>
              </div>
            </div>

            {/* Card number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Номер карты</label>
              <div className="relative">
                <input
                  className="input pr-16 font-mono tracking-widest"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  inputMode="numeric"
                  maxLength={19}
                />
                {brand && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                    style={{ color: brand.color }}>{brand.name}</span>
                )}
              </div>
            </div>

            {/* Expiry + CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Срок действия</label>
                <input
                  className="input font-mono"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC / CVV</label>
                <input
                  className="input font-mono"
                  placeholder="123"
                  value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  type="password"
                />
              </div>
            </div>

            {/* Cardholder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя на карте</label>
              <input
                className="input uppercase"
                placeholder="IVAN PETROV"
                value={name}
                onChange={e => setName(e.target.value.toUpperCase())}
              />
            </div>

            {/* Test hint */}
            <div className="bg-blue-50 rounded-lg p-2.5 text-xs text-blue-700">
              💡 Тест: карта <span className="font-mono font-semibold">4242 4242 4242 4242</span>, любые дата и CVC
            </div>

            <button
              type="submit"
              disabled={!isComplete || loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                isComplete ? (isStripe ? 'bg-[#635bff] hover:bg-[#4f46e5]' : 'bg-[#e31837] hover:bg-[#c41530]')
                : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Оплатить {amount} ₸
            </button>

            <p className="text-center text-xs text-gray-400">
              🔒 Защищено {isStripe ? 'Stripe' : 'Kaspi Pay'} · Тестовый режим
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
