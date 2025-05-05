import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const navigate = useNavigate();

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken"); // Check if the user is logged in
    if (jwtToken) {
      navigate("/"); // Redirect to home page if user is already logged in
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear any previous error message
    try {
      await registerUser(email, password); // Call to the register API function
      navigate("/login"); // Redirect to login page after successful registration
    } catch (err) {
      console.error("Registration failed:", err);
      if (err.request.response.includes("User already exists")) {
        setErrorMessage("User already exists. Please use a different email."); // Set specific error message for email conflict
      } else {
        setErrorMessage(err.message || "Registration failed. Please try again."); // Set error message
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cinema-dark">
      <div className="w-full max-w-md bg-cinema-lightdark p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-cinema-gold">
          Register
        </h2>
        {errorMessage && ( // Conditionally render error message
          <div className="mb-4 text-sm text-red-500 text-center">
            {errorMessage}
          </div>
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
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-cinema-grey">
          Already have an account?{" "}
          <a href="/login" className="text-cinema-gold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}