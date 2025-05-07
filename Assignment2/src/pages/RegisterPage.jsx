import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (jwtToken) {
      navigate("/");
    }
  }, [navigate]);

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isStrongPassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMessage(
        "Password must be at least 8 characters long and include at least one upper case letter, one number and a special character."
      );
      return;
    }

    try {
      await registerUser(email, password);
       try {
            await loginUser(email, password); 
            navigate(-1);
       }catch (err) {
        console.error("Login failed:", err);
        navigate("/login"); 
      }
    } catch (err) {
      console.error("Registration failed:", err);
      try {
        const errorData = JSON.parse(err.request.response);
        if (errorData.message) {
          setErrorMessage(errorData.message);
        } else {
          setErrorMessage("Registration failed. Please try again.");
        }
      } catch (parseError) {
        setErrorMessage(err.message || "Registration failed. Please try again.");
      }
    }
    
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cinema-dark">
      <div className="w-full max-w-md bg-cinema-lightdark p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-cinema-gold">
          Register
        </h2>
        {errorMessage && (
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
              className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cinema-gold text-black" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-cinema-gray "
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cinema-gold text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-cinema-gray mt-1">
            Must be at least 8 characters long and include at least one upper case letter, one number and a special character.
            </p>
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
