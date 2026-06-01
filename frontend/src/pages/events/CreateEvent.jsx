import { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const MapPicker = lazy(() => import('../../components/map/MapPicker'))

export default function CreateEvent() {
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm({
    defaultValues: { ticket_types: [{ name: 'Стандарт', tier: 'standard', price: 0, quantity: 100 }] }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'ticket_types' })
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [pickedLat, setPickedLat] = useState(null)
  const [pickedLng, setPickedLng] = useState(null)

  const handleMapPick = (lat, lng) => {
    setPickedLat(lat.toFixed(7))
    setPickedLng(lng.toFixed(7))
  }

  const eventFormat = watch('event_format')
  const eventType = watch('event_type')

  useEffect(() => {
    api.get('/events/categories/').then(r => setCategories(r.data.results || r.data))
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const formData = new FormData()
      const { ticket_types, cover_image, ...eventData } = data

      Object.entries(eventData).forEach(([k, v]) => {
        if (v !== undefined && v !== '') formData.append(k, v)
      })
      if (pickedLat) formData.set('latitude', pickedLat)
      if (pickedLng) formData.set('longitude', pickedLng)
      if (cover_image?.[0]) formData.append('cover_image', cover_image[0])

      const { data: event } = await api.post('/events/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Create ticket types for paid events
      if (data.event_format === 'paid') {
        await Promise.all(ticket_types.map(tt =>
          api.post('/tickets/types/', { ...tt, event: event.id })
        ))
      }

      // Publish immediately
      await api.patch(`/events/${event.id}/`, { status: 'published' })

      toast.success('Мероприятие создано!')
      navigate(`/events/${event.id}`)
    } catch (err) {
      toast.error('Ошибка при создании мероприятия')
      console.error(err.response?.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Создать мероприятие</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Основная информация</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input className="input" {...register('title', { required: true })} placeholder="Название мероприятия" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание *</label>
            <textarea className="input" rows={4} {...register('description', { required: true })} placeholder="Расскажите о мероприятии..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Категория</label>
              <select className="input" {...register('category_id')}>
                <option value="">Без категории</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Обложка</label>
              <input type="file" accept="image/*" className="input text-sm" {...register('cover_image')} />
            </div>
          </div>
        </div>

        {/* Type & Format */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Формат</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Тип</label>
              <select className="input" {...register('event_type')}>
                <option value="offline">Оффлайн</option>
                <option value="online">Онлайн</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Формат</label>
              <select className="input" {...register('event_format')}>
                <option value="free">Бесплатное</option>
                <option value="paid">Платное</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Видимость</label>
              <select className="input" {...register('visibility')}>
                <option value="public">Публичное</option>
                <option value="private">По ссылке</option>
              </select>
            </div>
          </div>

          {eventType === 'offline' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">Место проведения</label>
              <input className="input" {...register('place')} placeholder="Алматы, ул. Абая 1" />
              <p className="text-xs text-gray-500">Кликните на карте, чтобы указать точное место</p>
              <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">Загрузка карты...</div>}>
                <MapPicker lat={pickedLat} lng={pickedLng} onPick={handleMapPick} height="280px" />
              </Suspense>
              {pickedLat && (
                <p className="text-xs text-green-600">
                  📍 Выбрано: {parseFloat(pickedLat).toFixed(4)}, {parseFloat(pickedLng).toFixed(4)}
                  <button type="button" onClick={() => { setPickedLat(null); setPickedLng(null) }}
                    className="ml-2 text-red-400 hover:text-red-600">✕ сбросить</button>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Дата и время</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Начало *</label>
              <input type="datetime-local" className="input" {...register('start_time', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Конец *</label>
              <input type="datetime-local" className="input" {...register('end_time', { required: true })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Лимит участников</label>
            <input type="number" className="input" {...register('participant_limit')} placeholder="Без ограничений" min={1} />
          </div>
        </div>

        {/* Tickets (only for paid) */}
        {eventFormat === 'paid' && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Типы билетов</h2>
              <button type="button" onClick={() => append({ name: '', tier: 'standard', price: 0, quantity: 50 })}
                className="btn-secondary text-sm">+ Добавить</button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-4 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-xs text-gray-600">Название</label>
                  <input className="input text-sm" {...register(`ticket_types.${index}.name`)} placeholder="VIP" />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Тир</label>
                  <select className="input text-sm" {...register(`ticket_types.${index}.tier`)}>
                    <option value="standard">Стандарт</option>
                    <option value="vip">VIP</option>
                    <option value="early_bird">Ранняя пташка</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Цена (₸)</label>
                  <input type="number" className="input text-sm" {...register(`ticket_types.${index}.price`)} min={0} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Кол-во</label>
                    <input type="number" className="input text-sm" {...register(`ticket_types.${index}.quantity`)} min={1} />
                  </div>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700 mt-5">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? 'Создаём...' : 'Создать мероприятие'}
        </button>
      </form>
    </div>
  )
}
