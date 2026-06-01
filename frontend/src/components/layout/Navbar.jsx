import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Вы вышли из системы')
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/events" className="text-xl font-bold text-primary-600">
            🎉 EventHub
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink
              to="/events"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              Мероприятия
            </NavLink>
            {isAuthenticated && ['organizer', 'admin'].includes(user?.role) && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'}`
                }
              >
                Дашборд
              </NavLink>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {['organizer', 'admin'].includes(user?.role) && (
                  <Link to="/events/create" className="btn-primary text-sm hidden md:block">
                    + Создать
                  </Link>
                )}
                <div className="relative group">
                  <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                      {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="hidden md:block">{user?.username}</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
                    <Link to="/cabinet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Личный кабинет
                    </Link>
                    <Link to="/cabinet/tickets" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Мои билеты
                    </Link>
                    <Link to="/cabinet/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Избранное
                    </Link>
                    <Link to="/cabinet/friends" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Друзья
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">Войти</Link>
                <Link to="/register" className="btn-primary text-sm">Регистрация</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
