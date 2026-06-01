import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuthStore from '../../store/authStore'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const { register: authRegister } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedPrefs, setSelectedPrefs] = useState([])

  useEffect(() => {
    api.get('/events/categories/').then(r => setCategories(r.data.results || r.data))
  }, [])

  const togglePref = (id) => {
    setSelectedPrefs(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await authRegister({ ...data, preferences: selectedPrefs })
      toast.success('Аккаунт создан!')
      navigate(user.role === 'organizer' ? '/dashboard' : '/events')
    } catch (err) {
      const errs = err.response?.data
      if (errs) {
        Object.values(errs).forEach(v => toast.error(Array.isArray(v) ? v[0] : v))
      } else {
        toast.error('Ошибка регистрации')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🎉 EventHub</h1>
          <p className="text-gray-500 mt-2">Создайте аккаунт</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <input className="input" {...register('first_name')} placeholder="Алексей" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                <input className="input" {...register('last_name')} placeholder="Иванов" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
              <input
                className="input"
                {...register('username', { required: 'Обязательное поле' })}
                placeholder="alex_ivanov"
              />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="input"
                {...register('email', { required: 'Обязательное поле' })}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
              <select className="input" {...register('role')}>
                <option value="participant">Участник</option>
                <option value="organizer">Организатор</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                className="input"
                {...register('password', { required: 'Обязательное поле', minLength: { value: 6, message: 'Минимум 6 символов' } })}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
              <input
                type="password"
                className="input"
                {...register('password2', {
                  required: 'Обязательное поле',
                  validate: v => v === watch('password') || 'Пароли не совпадают'
                })}
                placeholder="••••••••"
              />
              {errors.password2 && <p className="text-red-500 text-xs mt-1">{errors.password2.message}</p>}
            </div>

            {/* Preferences */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Что вас интересует? (необязательно)
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => togglePref(cat.id)}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                        selectedPrefs.includes(cat.id)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
