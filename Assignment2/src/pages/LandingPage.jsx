import { Link } from "react-router-dom";
import backgroundImage from "../assets/images/LandingPageBackground.jpg"; // Import the background image

export default function LandingPage() {
  const backgroundStyle = {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "100vh",
    width: "100%",
    display: "flex", // Add Flexbox
    justifyContent: "center", // Center horizontally
    alignItems: "center", // Center vertically
  };

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
        <Link
          to="/movies"
          className="bg-cinema-red text-white rounded-lg px-6 py-3 text-lg font-medium transition hover:bg-cinema-gold"
        >
          Start Browsing
        </Link>
      </div>
    </div>
  );
}
