import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const TOKEN_KEY = 'rb_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) setUser(data.data)
          else localStorage.removeItem(TOKEN_KEY)
        })
        .catch(() => localStorage.removeItem(TOKEN_KEY))
        .finally(() => setLoading(false))
    } else {
      setTimeout(() => {setLoading(false)},0)
    }
  }, [])

  const login = (tokenValue, userData) => {
    localStorage.setItem(TOKEN_KEY, tokenValue)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  // 매 호출마다 localStorage에서 직접 읽음 — ref 타이밍 문제 완전 제거
  const authFetch = (url, options = {}) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const { headers: extraHeaders, ...restOptions } = options
    return fetch(url, {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(extraHeaders || {}),
        Authorization: `Bearer ${token}`,
      }
    })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#1A1612',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif', fontSize: 14 }}>
          로딩 중...
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, authFetch, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)