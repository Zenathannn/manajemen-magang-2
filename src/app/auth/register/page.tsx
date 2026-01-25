"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, Mail, Lock, ArrowLeft, Check } from "lucide-react";


export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      alert("You must accept the terms and conditions.");
      return;
    }
    if (!formData.password || formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Simulate successful registration
    console.log("Form Submitted:", formData);
    router.push("/auth/login");
  }

  const getPasswordStrength = (password: string) => {
    if (password.length >= 12) return { text: "Strong", color: "text-green-600" };
    if (password.length >= 8) return { text: "Medium", color: "text-yellow-600" };
    if (password.length > 0) return { text: "Weak", color: "text-red-600" };
    return { text: "", color: "" };
  }

  const passwordStrength = getPasswordStrength(formData.password);
  const isFormValid = acceptedTerms && formData.password && (formData.password === formData.confirmPassword);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-blue-600/10 rounded-2xl" />
          <div className="relative z-10">
            <a href="/auth/login" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </a>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-linear-to-br from-blue-500/5 to-blue-600/100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
              <p className="text-gray-600">Join us today! It takes only a few steps</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="name">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Your Full Name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your Email Address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Your Password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.password && (<div className={`text-sm font-medium mt-1 ${passwordStrength.color}`}>
                  {passwordStrength.text}
                </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Your Password Again"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl bg-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  formData.password !== formData.confirmPassword ? (
                    <div className="text-sm font-medium mt-1 text-red-600">
                      Passwords do not match
                    </div>
                  ) : (
                    <div className="text-sm font-medium mt-1 text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Passwords match
                    </div>)
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 broder-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the Terms and Conditions
                </label>
              </div>
              <button
                type="submit"
                disabled={!isFormValid}
                className={"w-full bg-linear-to-r from-blue-500 to-blue-600 text-white py-3 rounded-2xl font-medium hover:from-blue-600 hover:to-blue-700 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all"}>
                Register
              </button>
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?
                  <a href="/auth/login" className="text-blue-600 hover:underline">Login here</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
