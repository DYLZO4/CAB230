import { Outlet, Link, useLocation } from 'react-router-dom';
import { logoutUser } from '../api/auth';

const MainLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isLoggedIn = !!localStorage.getItem('jwtToken');

  const navLinkClass = (path) =>
    `text-sm font-medium px-4 py-2 rounded-lg transition ${
      currentPath === path
        ? 'bg-cinema-red text-white' 
        : 'text-cinema-gray hover:bg-cinema-gold hover:text-cinema-dark' 
    }`;

  const handleLogout = async () => {
    try {
      await logoutUser(localStorage.getItem('refreshToken')); 
      window.location.href = '/login'; 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cinema-dark text-cinema-gray">
      <header className="bg-cinema-dark shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cinema-gold">
            <Link to="/" className="hover:opacity-80 transition">FILM ME IN!</Link>
          </h1>
          <nav className="flex space-x-4">
            <Link to="/" className={navLinkClass('/')}>Home</Link>
            <Link to="/movies" className={navLinkClass('/movies')}>Movies</Link>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-sm font-medium px-4 py-2 rounded-lg transition text-cinema-grey hover:bg-cinema-gold hover:text-cinema-dark"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className={navLinkClass('/login')}>Login</Link>
                <Link to="/register" className={navLinkClass('/register')}>Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="p-6 mx-auto max-w-7xl">
        <Outlet />
      </main>

      <footer className="bg-cinema-dark text-cinema-gray text-center py-4">
        <p className="text-sm mb-2">All data is from IMDb, Metacritic and Rotten Tomatoes</p>
        <p className="text-sm">&copy; {new Date().getFullYear()} Dylan Hessing</p>
      </footer>
    </div>
  );
};

export default MainLayout;