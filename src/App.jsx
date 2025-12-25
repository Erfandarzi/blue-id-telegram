import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react'

function App() {
  const [tgUser, setTgUser] = useState(null)
  const [vouches, setVouches] = useState(0)
  const [vouchedBy, setVouchedBy] = useState([])
  const [showQR, setShowQR] = useState(false)
  const [vouchInput, setVouchInput] = useState('')
  const [message, setMessage] = useState('')
  const wallet = useTonWallet()

  const userId = tgUser?.id || `anon_${Date.now()}`
  const myVouchCode = `cyrus:${userId}`

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0d1117')
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#e6edf3')
      
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user)
      }

      // Check if opened via vouch link
      const startParam = tg.initDataUnsafe?.start_param
      if (startParam?.startsWith('vouch_')) {
        const voucherId = startParam.replace('vouch_', '')
        handleReceiveVouch(voucherId)
      }
    }

    // Load vouches from localStorage
    const saved = localStorage.getItem(`vouches_${userId}`)
    if (saved) {
      const data = JSON.parse(saved)
      setVouches(data.count || 0)
      setVouchedBy(data.by || [])
    }
  }, [userId])

  const handleReceiveVouch = (voucherId) => {
    if (voucherId === userId) return // Can't vouch yourself
    
    const saved = JSON.parse(localStorage.getItem(`vouches_${userId}`) || '{"count":0,"by":[]}')
    if (saved.by.includes(voucherId)) {
      setMessage('Already vouched by this person')
      return
    }
    
    saved.count += 1
    saved.by.push(voucherId)
    localStorage.setItem(`vouches_${userId}`, JSON.stringify(saved))
    setVouches(saved.count)
    setVouchedBy(saved.by)
    setMessage('✓ Vouch received!')
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
  }

  const handleVouchSomeone = () => {
    if (!vouchInput.trim()) return
    
    // Extract user ID from vouch code or link
    let targetId = vouchInput.trim()
    if (targetId.includes('vouch_')) {
      targetId = targetId.split('vouch_')[1]?.split('&')[0]
    } else if (targetId.startsWith('cyrus:')) {
      targetId = targetId.replace('cyrus:', '')
    }

    if (targetId === userId) {
      setMessage("Can't vouch yourself")
      return
    }

    // Record that we vouched for someone (for their trust graph)
    const myVouches = JSON.parse(localStorage.getItem(`given_${userId}`) || '[]')
    if (myVouches.includes(targetId)) {
      setMessage('Already vouched for this person')
      return
    }
    
    myVouches.push(targetId)
    localStorage.setItem(`given_${userId}`, JSON.stringify(myVouches))
    setMessage(`✓ Vouched for ${targetId.slice(0, 8)}...`)
    setVouchInput('')
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium')
  }

  const getTrustLevel = (count) => {
    if (count >= 10) return { label: 'Verified Human', color: '#3fb950' }
    if (count >= 5) return { label: 'Trusted', color: '#58a6ff' }
    if (count >= 1) return { label: 'Known', color: '#d29922' }
    return { label: 'Unverified', color: '#8b949e' }
  }

  const trust = getTrustLevel(vouches)
  const shareLink = `https://t.me/CyrusID_bot?start=vouch_${userId}`

  return (
    <div className="app">
      <div className="logo">☀</div>
      
      <h1 className="title">Cyrus</h1>
      <p className="subtitle">Web of Trust Identity</p>

      <div className="trust-badge" style={{ borderColor: trust.color }}>
        <span className="trust-count">{vouches}</span>
        <span className="trust-label" style={{ color: trust.color }}>{trust.label}</span>
      </div>

      {message && (
        <div className="message">{message}</div>
      )}

      <div className="section">
        <button className="btn primary" onClick={() => setShowQR(!showQR)}>
          {showQR ? 'Hide My Code' : '📱 Show My QR Code'}
        </button>
        
        {showQR && (
          <div className="qr-container">
            <QRCodeSVG 
              value={shareLink}
              size={180}
              bgColor="#0d1117"
              fgColor="#e6edf3"
              level="M"
            />
            <p className="qr-hint">Others scan this to vouch for you</p>
            <button 
              className="btn secondary"
              onClick={() => {
                navigator.clipboard.writeText(shareLink)
                setMessage('✓ Link copied!')
              }}
            >
              📋 Copy Link
            </button>
          </div>
        )}
      </div>

      <div className="section">
        <p className="section-title">Vouch for Someone</p>
        <input
          type="text"
          className="input"
          placeholder="Paste their code or link"
          value={vouchInput}
          onChange={(e) => setVouchInput(e.target.value)}
        />
        <button className="btn primary" onClick={handleVouchSomeone}>
          ✓ Vouch
        </button>
      </div>

      <div className="wallet-section">
        <TonConnectButton />
      </div>

      {tgUser && (
        <p className="user-info">
          {tgUser.first_name} • ID: {userId}
        </p>
      )}
    </div>
  )
}

export default App
