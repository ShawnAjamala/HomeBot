import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser, setUserRole } from "../firebase";
import { Home, Mail, Lock, UserPlus, LogIn } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
        navigate("/dashboard");
      } else {
        const userCred = await registerUser(email, password);
        await setUserRole(userCred.user.uid, role);
        navigate("/dashboard");
      }
    } catch (err) {
      let message = err.message;
      if (message.includes("auth/email-already-in-use")) message = "Email already in use";
      else if (message.includes("auth/invalid-email")) message = "Invalid email address";
      else if (message.includes("auth/wrong-password")) message = "Wrong password";
      else if (message.includes("auth/user-not-found")) message = "No account found with this email";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-green-200 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border border-green-200 mb-4">
            <Home className="text-green-700" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-green-900 tracking-tight">HomeBot</h1>
          <p className="text-green-600 mt-2 text-sm">Your AI real estate assistant</p>
        </div>

        <div className="flex gap-3 mb-8 bg-green-100 rounded-full p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-full transition font-medium flex items-center justify-center gap-2 ${
              isLogin
                ? "bg-white text-green-800 shadow-sm border border-green-200"
                : "text-green-600 hover:text-green-800"
            }`}
          >
            <LogIn size={18} />
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-full transition font-medium flex items-center justify-center gap-2 ${
              !isLogin
                ? "bg-white text-green-800 shadow-sm border border-green-200"
                : "text-green-600 hover:text-green-800"
            }`}
          >
            <UserPlus size={18} />
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" size={18} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-900 placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-900 placeholder-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm text-green-700 block">I am a</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="buyer" className="bg-white">Buyer</option>
                <option value="agent" className="bg-white">Agent</option>
                <option value="admin" className="bg-white">Admin</option>
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-3 rounded-xl transition transform hover:scale-[1.02] disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              "Please wait..."
            ) : isLogin ? (
              <>
                <LogIn size={18} />
                Login
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Create account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-green-600 text-sm">
          {isLogin ? "No account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-800 underline hover:no-underline font-medium"
          >
            {isLogin ? "Sign up" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}