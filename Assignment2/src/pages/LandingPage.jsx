import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 text-gray-800 p-6">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold mb-4">🎬 Welcome to MovieApp</h1>
        <p className="text-xl">Discover, explore, and track your favorite movies</p>
      </header>

      <div className="space-x-4">
        <Link to="/movies" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow hover:bg-indigo-700 transition">
          Browse Movies
        </Link>
        <Link to="/login" className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-2xl shadow hover:bg-indigo-100 transition">
          Login
        </Link>
      </div>

      <footer className="absolute bottom-4 text-sm text-gray-500">
        © {new Date().getFullYear()} MovieApp. All rights reserved.
      </footer>
    </div>
  );
}