import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../../api/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Cabinet() {
  const { user, updateUser } = useAuthStore()
  const { register, handleSubmit, reset } = useForm()
  const [categories, setCategories] = useState([])
  const [selectedPrefs, setSelectedPrefs] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/events/categories/').then(r => setCategories(r.data.results || r.data))
    if (user) {
      reset({ first_name: user.first_name, last_name: user.last_name, bio: user.bio, username: user.username })
      setSelectedPrefs(user.preferences?.map(p => p.id || p) || [])
    }
  }, [user, reset])

  const togglePref = (id) => {
    setSelectedPrefs(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined) formData.append(k, v) })
      selectedPrefs.forEach(id => formData.append('preferences', id))
      const { data: updated } = await api.patch('/auth/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      updateUser(updated)
      toast.success('Профиль обновлён')
    } catch {
      toast.error('Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Личный кабинет</h1>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { to: '/cabinet/tickets', icon: '🎫', label: 'Мои билеты' },
          { to: '/cabinet/favorites', icon: '❤️', label: 'Избранное' },
          { to: '/cabinet/friends', icon: '👥', label: 'Друзья' },
        ].map(link => (
          <Link key={link.to} to={link.to} className="card p-4 text-center hover:shadow-md transition-shadow">
            <p className="text-3xl mb-1">{link.icon}</p>
            <p className="text-sm font-medium text-gray-700">{link.label}</p>
          </Link>
        ))}
      </div>

      {/* Profile form */}
      <div className="card p-6">
        <h2 className="font-semibold text-lg mb-4">Редактировать профиль</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Имя</label>
              <input className="input" {...register('first_name')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Фамилия</label>
              <input className="input" {...register('last_name')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Логин</label>
            <input className="input" {...register('username')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">О себе</label>
            <textarea className="input" rows={3} {...register('bio')} placeholder="Расскажите о себе..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Аватар</label>
            <input type="file" accept="image/*" className="input text-sm" {...register('avatar')} />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Интересы</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button key={cat.id} type="button" onClick={() => togglePref(cat.id)}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                      selectedPrefs.includes(cat.id)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                    }`}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-sm text-gray-500 mb-1">Email: <span className="font-medium">{user?.email}</span></p>
            <p className="text-sm text-gray-500">Роль: <span className="font-medium capitalize">{user?.role}</span></p>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  )
}
