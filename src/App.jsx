import { useEffect, useState } from 'react'
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'

function App() {
  const [tgUser, setTgUser] = useState(null)
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [points, setPoints] = useState(0)
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e')
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#eaeaea')
      
      const user = tg.initDataUnsafe?.user
      if (user) {
        setTgUser(user)
        setReferralLink(`https://t.me/BlueID_bot?start=${user.id}`)
        
        // Load points from localStorage
        const savedPoints = localStorage.getItem(`points_${user.id}`)
        if (savedPoints) setPoints(parseInt(savedPoints))
        
        // Check if came from referral
        const startParam = tg.initDataUnsafe?.start_param
        if (startParam && startParam !== String(user.id)) {
          const alreadyReferred = localStorage.getItem(`referred_${user.id}`)
          if (!alreadyReferred) {
            // Credit referrer +10 points
            const referrerPoints = parseInt(localStorage.getItem(`points_${startParam}`) || '0')
            localStorage.setItem(`points_${startParam}`, referrerPoints + 10)
            localStorage.setItem(`referred_${user.id}`, startParam)
          }
        }
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
        <>
          <p className="user-info">
            Welcome, {tgUser.first_name} • <strong>{points} Points</strong>
          </p>
          
          <div className="referral-box">
            <p className="referral-label">Invite friends, earn 10 points each</p>
            <button 
              className="share-btn"
              onClick={() => {
                navigator.clipboard.writeText(referralLink)
                setCopied(true)
                window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Referral Link'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default App

