import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function EditEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, reset } = useForm()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}/`),
      api.get('/events/categories/'),
    ]).then(([eventRes, catRes]) => {
      const e = eventRes.data
      reset({
        title: e.title,
        description: e.description,
        category_id: e.category?.id || '',
        event_type: e.event_type,
        event_format: e.event_format,
        visibility: e.visibility,
        status: e.status,
        place: e.place,
        latitude: e.latitude,
        longitude: e.longitude,
        start_time: e.start_time?.slice(0, 16),
        end_time: e.end_time?.slice(0, 16),
        participant_limit: e.participant_limit || '',
      })
      setCategories(catRes.data.results || catRes.data)
    })
  }, [id, reset])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.patch(`/events/${id}/`, data)
      toast.success('Изменения сохранены')
      navigate(`/events/${id}`)
    } catch {
      toast.error('Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Редактировать мероприятие</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 card p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Название</label>
          <input className="input" {...register('title')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Описание</label>
          <textarea className="input" rows={4} {...register('description')} />
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
            <label className="block text-sm font-medium mb-1">Статус</label>
            <select className="input" {...register('status')}>
              <option value="draft">Черновик</option>
              <option value="published">Опубликовано</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Начало</label>
            <input type="datetime-local" className="input" {...register('start_time')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Конец</label>
            <input type="datetime-local" className="input" {...register('end_time')} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Место</label>
          <input className="input" {...register('place')} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Сохраняем...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  )
}
