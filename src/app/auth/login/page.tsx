"use client";

import { useState } from "react";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        alert(authError.message);
        setLoading(false);
        return;
      }

      // 2. Ambil role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user!.id)
        .single();

      // 3. Redirect berdasarkan role
      switch (profile?.role) {
        case 'admin':
          window.location.href = '/admin/dashboard';
          break;
        case 'guru':
          window.location.href = '/guru/dashboard';
          break;
        case 'siswa':
          window.location.href = '/siswa/dashboard';
          break;
        default:
          alert("Role tidak valid");
          await supabase.auth.signOut();
      }

    } catch (err) {
      alert("Terjadi kesalahan saat login");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {loading ? "Loading..." : "Login"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/auth/register" className="text-blue-600 hover:underline">Create Account</a>
          </p>
        </form>
      </div>
    </div>
  );
}