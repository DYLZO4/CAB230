export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cinema-dark text-cinema-gold">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-cinema-grey">Page not found.</p>
      <a
        href="/"
        className="mt-6 bg-cinema-red text-white py-2 px-4 rounded-md hover:bg-cinema-gold hover:text-cinema-dark transition"
      >
        Go Back Home
      </a>
    </div>
  );
}