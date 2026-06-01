import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-8xl font-bold text-gray-200">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Страница не найдена</h1>
        <p className="text-gray-500 mt-2">Такой страницы не существует</p>
        <Link to="/events" className="btn-primary mt-6 inline-block">На главную</Link>
      </div>
    </div>
  )
}
