import { useEffect, useState } from 'react'
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'

function App() {
  const [tgUser, setTgUser] = useState(null)
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()

  useEffect(() => {
    // Initialize Telegram Web App
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      
      // Apply Telegram theme
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e')
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#eaeaea')
      
      // Get user info
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user)
      }
    }
  }, [])

  const handleClaim = async () => {
    if (!wallet) {
      // Open wallet connection if not connected
      await tonConnectUI.openModal()
      return
    }

    setLoading(true)
    
    // Simulate SBT minting - in production, this would call your backend
    // which then mints the Soulbound Token to the user's wallet
    setTimeout(() => {
      setClaimed(true)
      setLoading(false)
      
      // Haptic feedback on Telegram
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
    }, 2000)
  }

  return (
    <div className="app">
      <div className="logo">ID</div>
      
      <h1 className="title">Blue ID</h1>
      <p className="subtitle">
        Claim your digital citizen identity on TON blockchain
      </p>

      <div className="wallet-section">
        <TonConnectButton />
      </div>

      {!claimed ? (
        <button 
          className="claim-btn" 
          onClick={handleClaim}
          disabled={loading}
        >
          {loading ? 'Claiming...' : wallet ? 'Claim Citizen ID' : 'Connect Wallet First'}
        </button>
      ) : (
        <div className="status success">
          ✓ Blue ID Token Claimed!<br/>
          <small>Your identity is now on-chain</small>
        </div>
      )}

      {tgUser && (
        <p className="user-info">
          Welcome, {tgUser.first_name}
        </p>
      )}
    </div>
  )
}

export default App

