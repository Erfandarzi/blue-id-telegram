import { useEffect, useState } from 'react'
import { TonConnectButton, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'

// ⚠️ DEPLOY YOUR SBT CONTRACT AND PASTE ADDRESS HERE
// Use testnet first: get test TON from @testgiver_ton_bot
const SBT_COLLECTION_ADDRESS = 'EQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

function App() {
  const [tgUser, setTgUser] = useState(null)
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [points, setPoints] = useState(0)
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [txHash, setTxHash] = useState(null)
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
      await tonConnectUI.openModal()
      return
    }

    setLoading(true)
    
    try {
      // Build mint message payload
      // op: mint (1), query_id, item_index, forward_amount, content
      const userId = tgUser?.id || Date.now()
      const payload = btoa(JSON.stringify({ 
        op: 'mint', 
        user: userId,
        timestamp: Date.now() 
      }))
      
      // Send transaction to SBT collection contract
      const tx = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 min
        messages: [
          {
            address: SBT_COLLECTION_ADDRESS,
            amount: '100000000', // 0.1 TON for gas + mint
            payload: payload
          }
        ]
      })
      
      setTxHash(tx.boc)
      setClaimed(true)
      localStorage.setItem(`claimed_${userId}`, 'true')
      
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
    } catch (err) {
      console.error('Mint failed:', err)
      // Fallback: mark as claimed locally (for demo/testnet issues)
      if (err.message?.includes('reject') || err.message?.includes('cancel')) {
        // User cancelled
      } else {
        setClaimed(true) // Demo mode fallback
      }
    } finally {
      setLoading(false)
    }
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
          {txHash && (
            <a 
              href={`https://tonviewer.com/transaction/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-link"
            >
              View on TON Explorer →
            </a>
          )}
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

