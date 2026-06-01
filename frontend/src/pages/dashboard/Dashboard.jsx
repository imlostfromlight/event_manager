import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}
const STATUS_LABELS = { draft: 'Черновик', published: 'Опубликовано', cancelled: 'Отменено', completed: 'Завершено' }

export default function Dashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [participants, setParticipants] = useState([])

  useEffect(() => {
    api.get('/events/my/').then(r => {
      setEvents(r.data.results || r.data)
      setLoading(false)
    })
  }, [])

  const selectEvent = async (event) => {
    setSelected(event)
    setAnalytics(null)
    setParticipants([])
    const [a, p] = await Promise.all([
      api.get(`/events/${event.id}/analytics/`),
      api.get(`/events/${event.id}/participants/`),
    ])
    setAnalytics(a.data)
    setParticipants(p.data.results || p.data)
  }

  const exportExcel = async () => {
    const res = await api.get(`/events/${selected.id}/export/excel/`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `participants_${selected.id}.xlsx`
    a.click()
  }

  const exportPdf = async () => {
    const res = await api.get(`/events/${selected.id}/export/pdf/`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `participants_${selected.id}.pdf`
    a.click()
  }

  const chartData = analytics?.daily?.map(d => ({
    date: format(new Date(d.day), 'd MMM', { locale: ru }),
    count: d.count,
  })) || []

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Дашборд организатора</h1>
        <Link to="/events/create" className="btn-primary">+ Создать мероприятие</Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Events list */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold mb-3 text-gray-700">Мои мероприятия ({events.length})</h2>
          {events.length === 0 ? (
            <div className="card p-6 text-center text-gray-500">
              <p className="text-4xl mb-2">📭</p>
              <p>Нет мероприятий</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(event => (
                <button
                  key={event.id}
                  onClick={() => selectEvent(event)}
                  className={`w-full text-left card p-4 hover:shadow-md transition-shadow ${selected?.id === event.id ? 'ring-2 ring-primary-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${STATUS_COLORS[event.status]}`}>
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {event.start_time && format(new Date(event.start_time), 'd MMM yyyy', { locale: ru })}
                    {' · '}{event.registrations_count} участников
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Analytics panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card p-12 text-center text-gray-400">
              <p className="text-5xl mb-3">📊</p>
              <p>Выберите мероприятие для просмотра аналитики</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selected.title}</h3>
                    <p className="text-sm text-gray-500">
                      {selected.start_time && format(new Date(selected.start_time), 'd MMMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/events/${selected.id}/edit`} className="btn-secondary text-sm">✏️ Ред.</Link>
                    <Link to={`/events/${selected.id}`} className="btn-secondary text-sm">👁 Просмотр</Link>
                  </div>
                </div>

                {analytics && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-primary-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-primary-700">{analytics.total}</p>
                      <p className="text-xs text-gray-500">Участников</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">
                        {analytics.limit ? `${Math.round(analytics.total / analytics.limit * 100)}%` : '∞'}
                      </p>
                      <p className="text-xs text-gray-500">Заполненность</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-orange-700">{analytics.limit || '∞'}</p>
                      <p className="text-xs text-gray-500">Лимит мест</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="card p-5">
                  <h4 className="font-medium mb-4">Регистрации по дням</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Регистраций" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Participants table */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Участники ({participants.length})</h4>
                  <div className="flex gap-2">
                    <button onClick={exportExcel} className="btn-secondary text-xs">📊 Excel</button>
                    <button onClick={exportPdf} className="btn-secondary text-xs">📄 PDF</button>
                  </div>
                </div>
                {participants.length === 0 ? (
                  <p className="text-gray-500 text-sm">Нет участников</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-gray-600">#</th>
                          <th className="text-left py-2 font-medium text-gray-600">Имя</th>
                          <th className="text-left py-2 font-medium text-gray-600">Email</th>
                          <th className="text-left py-2 font-medium text-gray-600">Дата</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p, i) => (
                          <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 text-gray-400">{i + 1}</td>
                            <td className="py-2">{p.user_name}</td>
                            <td className="py-2 text-gray-500">{p.user_email}</td>
                            <td className="py-2 text-gray-500 text-xs">
                              {p.registered_at && format(new Date(p.registered_at), 'd MMM, HH:mm', { locale: ru })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
