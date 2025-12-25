import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { TonConnectButton } from '@tonconnect/ui-react'

// Privado ID will be initialized dynamically (heavy SDK)
let privadoSDK = null

function App() {
  const [tgUser, setTgUser] = useState(null)
  const [did, setDid] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [credentials, setCredentials] = useState([])
  const [showQR, setShowQR] = useState(false)

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
    }

    // Check for saved identity
    const savedDid = localStorage.getItem('cyrus_did')
    if (savedDid) {
      setDid(savedDid)
      const savedCreds = JSON.parse(localStorage.getItem('cyrus_credentials') || '[]')
      setCredentials(savedCreds)
    }
  }, [])

  const createIdentity = async () => {
    setLoading(true)
    setStatus('Creating identity...')

    try {
      // Generate a DID-like identifier (simplified for MVP)
      // Full Privado ID integration requires backend circuits
      const userId = tgUser?.id || Date.now()
      const randomBytes = crypto.getRandomValues(new Uint8Array(16))
      const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
      
      const newDid = `did:cyrus:${hex}`
      
      setDid(newDid)
      localStorage.setItem('cyrus_did', newDid)
      localStorage.setItem('cyrus_user_id', String(userId))
      
      setStatus('✓ Identity created!')
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
    } catch (err) {
      console.error(err)
      setStatus('Error creating identity')
    } finally {
      setLoading(false)
    }
  }

  const requestCredential = async (type) => {
    setLoading(true)
    setStatus(`Requesting ${type} credential...`)

    try {
      // Simulate credential issuance (real: would call issuer API)
      await new Promise(r => setTimeout(r, 1500))
      
      const credential = {
        id: `cred_${Date.now()}`,
        type,
        issuedAt: new Date().toISOString(),
        issuer: 'did:cyrus:issuer',
        holder: did,
        verified: true
      }

      const newCreds = [...credentials, credential]
      setCredentials(newCreds)
      localStorage.setItem('cyrus_credentials', JSON.stringify(newCreds))
      
      setStatus(`✓ ${type} credential issued!`)
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
    } catch (err) {
      setStatus('Error requesting credential')
    } finally {
      setLoading(false)
    }
  }

  const shareLink = did ? `https://t.me/CyrusID_bot?start=verify_${did.split(':')[2]}` : ''

  return (
    <div className="app">
      <div className="logo">☀</div>
      <h1 className="title">Cyrus</h1>
      <p className="subtitle">Zero-Knowledge Identity</p>

      {status && <div className="message">{status}</div>}

      {!did ? (
        <button 
          className="btn primary" 
          onClick={createIdentity}
          disabled={loading}
        >
          {loading ? 'Creating...' : '🔐 Create My Identity'}
        </button>
      ) : (
        <>
          <div className="did-card">
            <span className="did-label">Your DID</span>
            <code className="did-value">{did.slice(0, 20)}...{did.slice(-8)}</code>
            <span className="did-status">
              {credentials.length} credential{credentials.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="section">
            <button className="btn secondary" onClick={() => setShowQR(!showQR)}>
              {showQR ? 'Hide QR' : '📱 Show Verification QR'}
            </button>
            
            {showQR && (
              <div className="qr-container">
                <QRCodeSVG 
                  value={shareLink}
                  size={160}
                  bgColor="#0d1117"
                  fgColor="#e6edf3"
                />
                <p className="qr-hint">Scan to verify this identity</p>
              </div>
            )}
          </div>

          <div className="section">
            <p className="section-title">Request Credentials</p>
            <div className="cred-buttons">
              <button 
                className="btn cred" 
                onClick={() => requestCredential('Human')}
                disabled={loading || credentials.some(c => c.type === 'Human')}
              >
                👤 Human
              </button>
              <button 
                className="btn cred" 
                onClick={() => requestCredential('Activist')}
                disabled={loading || credentials.some(c => c.type === 'Activist')}
              >
                ✊ Activist
              </button>
              <button 
                className="btn cred" 
                onClick={() => requestCredential('Diaspora')}
                disabled={loading || credentials.some(c => c.type === 'Diaspora')}
              >
                🌍 Diaspora
              </button>
            </div>
          </div>

          {credentials.length > 0 && (
            <div className="section">
              <p className="section-title">My Credentials</p>
              <div className="creds-list">
                {credentials.map(c => (
                  <div key={c.id} className="cred-item">
                    <span className="cred-type">{c.type}</span>
                    <span className="cred-check">✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="wallet-section">
        <TonConnectButton />
      </div>

      {tgUser && (
        <p className="user-info">{tgUser.first_name}</p>
      )}
    </div>
  )
}

export default App
