import { useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)

  const login = (data) => {
    setUser(data)
  }

  const logout = () => {
    setUser(null)
  }

  return { user, login, logout }
}
