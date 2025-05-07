import { Link } from "react-router-dom";
import backgroundImage from "../assets/images/LandingPageBackground.jpg"; 

export default function LandingPage() {
  const backgroundStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "100vh",
    width: "100%",
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
  };

  
  const isLoggedIn = !!localStorage.getItem('jwtToken');

  return (
    <div style={backgroundStyle}>
      <div className="text-center p-6">
        <header className="mb-10">
          <h1 className="text-5xl font-extrabold mb-4 text-cinema-dark">
            Welcome to Film Me In!
          </h1>
          <p className="text-xl text-cinema-dark">
            Discover, explore, and track your favorite movies
          </p>
        </header>
        
        <div className="button-container flex justify-center gap-4"> 
          <Link
            to="/movies"
            className="bg-cinema-red text-white rounded-lg px-6 py-3 text-lg font-medium transition hover:bg-cinema-gold"
          >
            Start Browsing
          </Link>

          {!isLoggedIn && (
            <>
              <Link
                to="/login"
                className="bg-cinema-red text-white rounded-lg px-6 py-3 text-lg font-medium transition hover:bg-cinema-gold"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-cinema-red text-white rounded-lg px-6 py-3 text-lg font-medium transition hover:bg-cinema-gold"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
