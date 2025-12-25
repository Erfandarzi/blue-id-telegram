import { useEffect, useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { TonConnectButton } from '@tonconnect/ui-react'
import { Html5Qrcode } from 'html5-qrcode'
import { addVouch, getVouchesReceived, getVouchesGiven } from './supabase'

function App() {
  const [tgUser, setTgUser] = useState(null)
  const [myId, setMyId] = useState(null)
  const [vouches, setVouches] = useState(0)
  const [vouchersCount, setVouchersCount] = useState(0)
  const [view, setView] = useState('home') // home, mycode, scan, paste
  const [pasteInput, setPasteInput] = useState('')
  const [message, setMessage] = useState('')
  const [pendingVouch, setPendingVouch] = useState(null)
  const [givenList, setGivenList] = useState([])
  const scannerRef = useRef(null)

  const loadVouchData = async (userId) => {
    const [received, given] = await Promise.all([
      getVouchesReceived(userId),
      getVouchesGiven(userId)
    ])
    setVouches(received.count)
    setVouchersCount(given.length)
    setGivenList(given)
  }

  const extractIdFromScan = (text) => {
    if (text.includes('startapp=')) {
      return text.split('startapp=')[1]?.split('&')[0]
    }
    if (text.includes('start=')) {
      return text.split('start=')[1]?.split('&')[0]
    }
    return text.trim()
  }

  const startScanner = async () => {
    setView('scan')
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            const targetId = extractIdFromScan(decodedText)
            stopScanner()
            if (targetId && targetId !== myId) {
              setPendingVouch(targetId)
              window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
            } else if (targetId === myId) {
              setMessage("That's your own code!")
              setTimeout(() => setMessage(''), 2000)
            }
          },
          () => {}
        )
      } catch (err) {
        setMessage('Please allow camera access')
        setTimeout(() => setMessage(''), 2000)
        setView('home')
      }
    }, 100)
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})
      scannerRef.current = null
    }
    setView('home')
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      const user = tg.initDataUnsafe?.user
      if (user) {
        setTgUser(user)
        const id = String(user.id)
        setMyId(id)
        loadVouchData(id)
        const startParam = tg.initDataUnsafe?.start_param
        if (startParam && startParam !== id) {
          setPendingVouch(startParam)
        }
      }
    }
    if (!window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const savedId = localStorage.getItem('cyrus_browser_id') || `browser_${Date.now()}`
      localStorage.setItem('cyrus_browser_id', savedId)
      setMyId(savedId)
      loadVouchData(savedId)
    }
  }, [])

  const confirmVouch = async () => {
    if (!pendingVouch || pendingVouch === myId) return
    if (givenList.includes(pendingVouch)) {
      setMessage('You already trust this person')
      setPendingVouch(null)
      setTimeout(() => setMessage(''), 2000)
      return
    }
    const { error } = await addVouch(myId, pendingVouch)
    if (error) {
      setMessage(error === 'Already vouched' ? 'Already trusted' : 'Something went wrong')
      setPendingVouch(null)
      setTimeout(() => setMessage(''), 2000)
      return
    }
    setGivenList([...givenList, pendingVouch])
    setVouchersCount(vouchersCount + 1)
    setMessage('✓ Done!')
    setPendingVouch(null)
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success')
    setTimeout(() => setMessage(''), 2000)
  }

  const getTrustLabel = (count) => {
    if (count === 0) return "No one yet"
    if (count === 1) return "1 person trusts you"
    return `${count} people trust you`
  }

  const shareLink = `https://t.me/CyrusID_bot/app?startapp=${myId}`

  // ===== VOUCH CONFIRMATION MODAL =====
  if (pendingVouch) {
    return (
      <div className="app">
        <div className="modal-card">
          <div className="modal-icon">🤝</div>
          <h2 className="modal-title">Trust this person?</h2>
          <p className="modal-subtitle">
            You're confirming you know them in real life
          </p>
          <button className="big-btn green" onClick={confirmVouch}>
            Yes, I trust them
          </button>
          <button className="big-btn ghost" onClick={() => setPendingVouch(null)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ===== SHOW MY QR CODE =====
  if (view === 'mycode') {
    return (
      <div className="app">
        <button className="back-btn" onClick={() => setView('home')}>← Back</button>
        <div className="qr-card">
          <QRCodeSVG 
            value={shareLink}
            size={200}
            bgColor="#ffffff"
            fgColor="#1a1a2e"
            level="M"
          />
        </div>
        <p className="qr-instruction">Show this to a friend</p>
        <p className="qr-hint">They scan it to say they trust you</p>
        <button 
          className="big-btn outline"
          onClick={() => {
            navigator.clipboard.writeText(shareLink)
            setMessage('✓ Link copied!')
            setTimeout(() => setMessage(''), 2000)
          }}
        >
          📋 Copy link instead
        </button>
        {message && <div className="toast">{message}</div>}
      </div>
    )
  }

  // ===== SCANNER VIEW =====
  if (view === 'scan') {
    return (
      <div className="app">
        <button className="back-btn" onClick={stopScanner}>← Back</button>
        <p className="scan-instruction">Point at their code</p>
        <div className="scanner-frame">
          <div id="qr-reader"></div>
        </div>
        <p className="scan-hint">Scanning automatically...</p>
        {message && <div className="toast">{message}</div>}
      </div>
    )
  }

  // ===== PASTE VIEW =====
  if (view === 'paste') {
    const handlePaste = () => {
      const id = extractIdFromScan(pasteInput)
      if (id && id !== myId) {
        setPendingVouch(id)
        setPasteInput('')
        setView('home')
      } else if (id === myId) {
        setMessage("That's your own code!")
        setTimeout(() => setMessage(''), 2000)
      } else {
        setMessage("Couldn't find a valid code")
        setTimeout(() => setMessage(''), 2000)
      }
    }
    return (
      <div className="app">
        <button className="back-btn" onClick={() => { setView('home'); setPasteInput('') }}>← Back</button>
        <p className="scan-instruction">Paste their link</p>
        <input
          className="paste-input"
          type="text"
          placeholder="Paste link here..."
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          autoFocus
        />
        <button className="big-btn green" onClick={handlePaste} style={{ marginTop: '1rem', maxWidth: '280px' }}>
          Trust them
        </button>
        {message && <div className="toast">{message}</div>}
      </div>
    )
  }

  // ===== HOME VIEW =====
  return (
    <div className="app">
      <div className="hero">
        <div className="trust-number">{vouches}</div>
        <div className="trust-label">{getTrustLabel(vouches)}</div>
        {vouchersCount > 0 && (
          <div className="trust-given">You trust {vouchersCount} {vouchersCount === 1 ? 'person' : 'people'}</div>
        )}
      </div>

      <div className="actions">
        <button className="big-btn green" onClick={() => setView('mycode')}>
          <span className="btn-icon">📱</span>
          <span className="btn-text">Show My Code</span>
          <span className="btn-hint">Get trusted by friends</span>
        </button>

        <button className="big-btn blue" onClick={startScanner}>
          <span className="btn-icon">📷</span>
          <span className="btn-text">Scan to Trust</span>
          <span className="btn-hint">Trust someone you know</span>
        </button>
      </div>

      <button className="paste-link" onClick={() => setView('paste')}>
        Have a link? Paste it
      </button>

      {message && <div className="toast">{message}</div>}

      <div className="footer">
        <TonConnectButton />
        {tgUser && <p className="user-name">Hi, {tgUser.first_name}!</p>}
      </div>
    </div>
  )
}

export default App
