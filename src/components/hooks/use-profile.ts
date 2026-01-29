"use client"

import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function useProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("User tidak ditemukan")
        setLoading(false)
        return
      }
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", user.id)
        .single()
      if (profileError) {
        setError(profileError.message)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  return { profile, loading, error }
}

export function useLogout() {
  const router = useRouter()
  return async function logout() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }
}
