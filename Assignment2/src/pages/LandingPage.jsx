import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 text-gray-800 p-6">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-extrabold mb-4">🎬 Welcome to MovieApp</h1>
        <p className="text-xl">Discover, explore, and track your favorite movies</p>
      </header>
    </div>
  );
}