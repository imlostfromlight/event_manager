import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

function Avatar({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
      {name?.[0]?.toUpperCase()}
    </div>
  )
}

export default function Friends() {
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [tab, setTab] = useState('friends')

  const fetchAll = async () => {
    const [f, r] = await Promise.all([
      api.get('/auth/friends/'),
      api.get('/auth/friend-requests/'),
    ])
    setFriends(f.data.results || f.data)
    setRequests(r.data.results || r.data)
  }

  useEffect(() => { fetchAll() }, [])

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const { data } = await api.get(`/auth/search/?q=${encodeURIComponent(search)}`)
      setSearchResults(data.results || data)
    } finally {
      setSearching(false)
    }
  }

  const sendRequest = async (userId) => {
    try {
      await api.post('/auth/friend-requests/', { to_user_id: userId })
      toast.success('Запрос отправлен')
      setSearchResults(prev => prev.filter(u => u.id !== userId))
    } catch {
      toast.error('Ошибка или запрос уже существует')
    }
  }

  const handleRequest = async (reqId, action) => {
    try {
      await api.post(`/auth/friend-requests/${reqId}/${action}/`)
      toast.success(action === 'accept' ? 'Заявка принята' : 'Заявка отклонена')
      fetchAll()
    } catch {
      toast.error('Ошибка')
    }
  }

  const removeFriend = async (userId) => {
    try {
      await api.delete(`/auth/friends/remove/${userId}/`)
      setFriends(prev => prev.filter(f => f.id !== userId))
      toast.success('Удалено из друзей')
    } catch {
      toast.error('Ошибка')
    }
  }

  const incoming = requests.filter(r => r.status === 'pending' && r.to_user)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Друзья</h1>

      {/* Search */}
      <div className="card p-4 mb-6">
        <h2 className="font-medium mb-3">Найти пользователей</h2>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Поиск по имени или логину..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={searching} className="btn-primary">
            {searching ? '...' : 'Найти'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Avatar name={u.full_name || u.username} />
                  <div>
                    <p className="font-medium text-sm">{u.full_name || u.username}</p>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>
                </div>
                <button onClick={() => sendRequest(u.id)} className="btn-primary text-sm">
                  Добавить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('friends')}
          className={`text-sm px-4 py-1.5 rounded-full font-medium ${tab === 'friends' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
          Друзья ({friends.length})
        </button>
        <button onClick={() => setTab('requests')}
          className={`text-sm px-4 py-1.5 rounded-full font-medium ${tab === 'requests' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-600'}`}>
          Заявки {incoming.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{incoming.length}</span>}
        </button>
      </div>

      {tab === 'friends' && (
        <div className="card divide-y divide-gray-100">
          {friends.length === 0 ? (
            <p className="p-6 text-center text-gray-500">Нет друзей. Найдите людей выше.</p>
          ) : friends.map(f => (
            <div key={f.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar name={f.full_name || f.username} />
                <div>
                  <p className="font-medium text-sm">{f.full_name || f.username}</p>
                  <p className="text-xs text-gray-500">@{f.username}</p>
                </div>
              </div>
              <button onClick={() => removeFriend(f.id)} className="text-xs text-red-500 hover:underline">
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'requests' && (
        <div className="card divide-y divide-gray-100">
          {incoming.length === 0 ? (
            <p className="p-6 text-center text-gray-500">Нет входящих заявок</p>
          ) : incoming.map(req => (
            <div key={req.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar name={req.from_user?.full_name || req.from_user?.username} />
                <div>
                  <p className="font-medium text-sm">{req.from_user?.full_name || req.from_user?.username}</p>
                  <p className="text-xs text-gray-500">@{req.from_user?.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRequest(req.id, 'accept')} className="btn-primary text-sm">Принять</button>
                <button onClick={() => handleRequest(req.id, 'decline')} className="btn-secondary text-sm">Отклонить</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
