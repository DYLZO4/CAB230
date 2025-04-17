import { Outlet, Link, useLocation } from 'react-router-dom';

const MainLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navLinkClass = (path) =>
    `text-sm font-medium px-3 py-2 rounded-md transition ${
      currentPath === path
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">
            <Link to="/" className="hover:opacity-80 transition">🎬 MovieDB</Link>
          </h1>
          <nav className="flex space-x-2">
            <Link to="/" className={navLinkClass('/')}>Home</Link>
            <Link to="/movies" className={navLinkClass('/movies')}>Movies</Link>
            <Link to="/login" className={navLinkClass('/login')}>Login</Link>
            <Link to="/register" className={navLinkClass('/register')}>Register</Link>
          </nav>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
