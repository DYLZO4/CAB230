// layouts/MainLayout.jsx
import { Outlet, Link } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div>
      <header className="p-4 bg-gray-800 text-white flex justify-between">
        <Link to="/" className="font-bold text-lg">Screen Score</Link>
        <nav className="space-x-4">
          <Link to="/movies">Movies</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header>

      <main className="p-6">
        <Outlet />
      </main>

      <footer className="p-4 text-center text-sm text-gray-500">
        <p>All Data is from IMDB, Metacritic and RottenTomatoes</p>
        © {new Date().getFullYear()} Dylan Hessing 
      </footer>
    </div>
  );
}
