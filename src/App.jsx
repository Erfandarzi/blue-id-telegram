import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { TonConnectButton } from '@tonconnect/ui-react'

function App() {
  const [tgUser, setTgUser] = useState(null)
  const [myId, setMyId] = useState(null)
  const [vouches, setVouches] = useState(0)
  const [vouchersCount, setVouchersCount] = useState(0)
  const [showQR, setShowQR] = useState(false)
  const [vouchInput, setVouchInput] = useState('')
  const [message, setMessage] = useState('')
  const [pendingVouch, setPendingVouch] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#0d1117')
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#e6edf3')
      
      const user = tg.initDataUnsafe?.user
      if (user) {
        setTgUser(user)
        setMyId(String(user.id))
        
        // Load my vouches received
        const saved = localStorage.getItem(`vouches_${user.id}`)
        if (saved) {
          const data = JSON.parse(saved)
          setVouches(data.count || 0)
        }
        
        // Load vouches I've given
        const given = JSON.parse(localStorage.getItem(`given_${user.id}`) || '[]')
        setVouchersCount(given.length)
        
        // Check if opened via vouch link
        const startParam = tg.initDataUnsafe?.start_param
        if (startParam && startParam !== String(user.id)) {
          setPendingVouch(startParam)
        }
      }
    }
    
    // Browser fallback
    if (!myId) {
      const savedId = localStorage.getItem('cyrus_browser_id') || `browser_${Date.now()}`
      localStorage.setItem('cyrus_browser_id', savedId)
      setMyId(savedId)
      
      const saved = localStorage.getItem(`vouches_${savedId}`)
      if (saved) {
        const data = JSON.parse(saved)
        setVouches(data.count || 0)
      }
    }
  }, [myId])

  const confirmVouch = () => {
    if (!pendingVouch || pendingVouch === myId) return
    
    // Check if already vouched for this person
    const given = JSON.parse(localStorage.getItem(`given_${myId}`) || '[]')
    if (given.includes(pendingVouch)) {
      setMessage('Already vouched for this person')
      setPendingVouch(null)
      return
    }
    
    // Record that I vouched for them
    given.push(pendingVouch)
    localStorage.setItem(`given_${myId}`, JSON.stringify(given))
    setVouchersCount(given.length)
    
    // Increment their vouch count
    const theirData = JSON.parse(localStorage.getItem(`vouches_${pendingVouch}`) || '{"count":0,"from":[]}')
    theirData.count += 1
    theirData.from.push(myId)
    localStorage.setItem(`vouches_${pendingVouch}`, JSON.stringify(theirData))
    
    setMessage(`✓ Vouched! They now have ${theirData.count} vouches`)
    setPendingVouch(null)
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
  }

  const handleManualVouch = () => {
    if (!vouchInput.trim()) return
    
    let targetId = vouchInput.trim()
    // Extract ID from link
    if (targetId.includes('start=')) {
      targetId = targetId.split('start=')[1]?.split('&')[0]
    }
    
    if (targetId === myId) {
      setMessage("Can't vouch for yourself")
      return
    }
    
    const given = JSON.parse(localStorage.getItem(`given_${myId}`) || '[]')
    if (given.includes(targetId)) {
      setMessage('Already vouched for this person')
      setVouchInput('')
      return
    }
    
    given.push(targetId)
    localStorage.setItem(`given_${myId}`, JSON.stringify(given))
    setVouchersCount(given.length)
    
    const theirData = JSON.parse(localStorage.getItem(`vouches_${targetId}`) || '{"count":0,"from":[]}')
    theirData.count += 1
    theirData.from.push(myId)
    localStorage.setItem(`vouches_${targetId}`, JSON.stringify(theirData))
    
    setMessage(`✓ Vouched for ${targetId.slice(0, 8)}...`)
    setVouchInput('')
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium')
  }

  const getTrustLevel = (count) => {
    if (count >= 10) return { label: 'VERIFIED HUMAN', color: '#3fb950', icon: '✓' }
    if (count >= 5) return { label: 'TRUSTED', color: '#58a6ff', icon: '◈' }
    if (count >= 1) return { label: 'KNOWN', color: '#d29922', icon: '○' }
    return { label: 'UNVERIFIED', color: '#8b949e', icon: '?' }
  }

  const trust = getTrustLevel(vouches)
  const shareLink = `https://t.me/CyrusID_bot?start=${myId}`

  return (
    <div className="app">
      <div className="logo">☀</div>
      <h1 className="title">Cyrus</h1>
      <p className="subtitle">Web of Trust</p>

      {/* Pending vouch confirmation */}
      {pendingVouch && (
        <div className="vouch-confirm">
          <p>Vouch for user <strong>{pendingVouch.slice(0, 10)}...</strong>?</p>
          <p className="vouch-hint">This confirms they are a real person you know</p>
          <div className="vouch-actions">
            <button className="btn primary" onClick={confirmVouch}>✓ Yes, Vouch</button>
            <button className="btn secondary" onClick={() => setPendingVouch(null)}>Cancel</button>
          </div>
        </div>
      )}

      {message && <div className="message">{message}</div>}

      {/* Trust Score */}
      <div className="trust-card" style={{ borderColor: trust.color }}>
        <div className="trust-score">
          <span className="trust-number">{vouches}</span>
          <span className="trust-unit">vouches</span>
        </div>
        <span className="trust-label" style={{ color: trust.color }}>
          {trust.icon} {trust.label}
        </span>
        <span className="trust-given">{vouchersCount} given</span>
      </div>

      {/* My QR Code */}
      <div className="section">
        <button className="btn secondary" onClick={() => setShowQR(!showQR)}>
          {showQR ? 'Hide QR' : '📱 My Vouch Code'}
        </button>
        
        {showQR && (
          <div className="qr-container">
            <QRCodeSVG 
              value={shareLink}
              size={160}
              bgColor="#0d1117"
              fgColor="#e6edf3"
            />
            <p className="qr-hint">Others scan to vouch for you</p>
            <button 
              className="btn small"
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

      {/* Vouch for someone */}
      <div className="section">
        <p className="section-title">Vouch for Someone</p>
        <input
          type="text"
          className="input"
          placeholder="Paste their link or ID"
          value={vouchInput}
          onChange={(e) => setVouchInput(e.target.value)}
        />
        <button className="btn primary" onClick={handleManualVouch}>
          ✓ Vouch
        </button>
      </div>

      <div className="wallet-section">
        <TonConnectButton />
      </div>

      {tgUser && (
        <p className="user-info">{tgUser.first_name} • {myId}</p>
      )}
    </div>
  )
}

export default App
