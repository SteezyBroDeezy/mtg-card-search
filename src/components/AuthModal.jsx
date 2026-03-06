 import { useState } from 'react'
  import { signUp, logIn } from '../lib/firebase'

  function AuthModal({ onClose, onSuccess }) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
      e.preventDefault()
      setError('')
      setLoading(true)

      try {
        if (isLogin) {
          await logIn(email, password)
        } else {
          await signUp(email, password)
        }
        onSuccess?.()
        onClose()
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    function getButtonText() {
      if (loading) return 'Please wait...'
      if (isLogin) return 'Log In'
      return 'Create Account'
    }

    function getToggleText() {
      if (isLogin) return 'Sign up'
      return 'Log in'
    }
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center
  justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 rounded-xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {isLogin ? 'Log In' : 'Create Account'}
            </h2>
            <button onClick={onClose} className="text-gray-400
  hover:text-white text-2xl">
              x
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400
  mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border
  border-gray-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400
  mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-700 border
  border-gray-600 rounded-lg text-white"
              />
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700
  rounded-lg font-medium"
            >
              {getButtonText()}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-4">
            <button onClick={() => setIsLogin(!isLogin)}
  className="text-blue-400 hover:underline">
              {getToggleText()}
            </button>
          </p>
        </div>
      </div>
    )
  }

  export default AuthModal