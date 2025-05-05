import { useState } from "react";
import { loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password); // Call to API to login
      navigate(-1); // Redirect to the previous page after successful login
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage("Invalid credentials. Please try again."); // Set error message
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cinema-dark">
      <div className="w-full max-w-md bg-cinema-lightdark p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-cinema-gold">
          Login
        </h2>
        {errorMessage && ( // Display error message if it exists
          <p className="text-cinema-red text-center mb-4">{errorMessage}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-cinema-grey"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full mt-1 p-2 border rounded-md border-cinema-grey"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-cinema-grey"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full mt-1 p-2 border rounded-md border-cinema-grey"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cinema-red text-white py-2 rounded-md hover:bg-cinema-gold hover:text-cinema-dark transition"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-cinema-grey">
          Don't have an account?{" "}
          <a href="/register" className="text-cinema-gold hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}