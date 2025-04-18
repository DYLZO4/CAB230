import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth'; // assuming you have an API function for registration

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(email, password); // Call to the register API function
      navigate('/login'); // Redirect to login page after successful registration
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cinema-dark">
      <div className="w-full max-w-md bg-cinema-lightdark p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-cinema-gold">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-cinema-grey">Email</label>
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
            <label htmlFor="password" className="block text-sm font-medium text-cinema-grey">Password</label>
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
          Already have an account? <a href="/login" className="text-cinema-gold hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
}