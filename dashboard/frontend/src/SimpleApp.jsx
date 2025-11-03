import { useState, useEffect } from 'react'

console.log('🔥 SimpleApp.jsx is being loaded!')

const SimpleApp = () => {
  console.log('🚀 SimpleApp component is rendering!')
  const [status, setStatus] = useState('Initializing...')
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    const testApp = () => {
      console.log('🚀 SimpleApp is running!')
      setStatus('✅ React app is working! Making API call...')
      
      fetch('http://193.24.209.9:3001/api/predictions?page=1&pageSize=10')
        .then(response => {
          console.log('📡 API Response:', response.status, response.statusText)
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('✅ API Data:', data)
          setData(data)
          setStatus(`✅ SUCCESS! Loaded ${data.meta?.total || 0} predictions from API`)
        })
        .catch(err => {
          console.error('❌ API Error:', err.message)
          setError(err.message)
          setStatus('❌ API call failed')
        })
    }

    testApp()
  }, [])

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'monospace',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '30px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          🎾 Tennis Dashboard Test
        </h1>
        
        <div style={{ 
          padding: '20px', 
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <strong>Status:</strong> {status}
        </div>
        
        {error && (
          <div style={{ 
            padding: '20px', 
            background: 'rgba(255, 0, 0, 0.2)',
            borderRadius: '10px',
            color: '#ffcdd2'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {data && data.data && data.data.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ color: 'white', marginBottom: '20px' }}>
              🎾 Latest Predictions ({data.data.length} shown out of {data.meta?.total || 0} total):
            </h3>
            <div style={{ 
              maxHeight: '500px', 
              overflow: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px'
            }}>
              {data.data.map((prediction, index) => (
                <div key={prediction.prediction_id} style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#90EE90', 
                    marginBottom: '8px',
                    fontSize: '16px'
                  }}>
                    🏆 {prediction.tournament}
                  </div>
                  <div style={{ 
                    color: '#E0E0E0', 
                    marginBottom: '8px',
                    fontSize: '15px'
                  }}>
                    🎾 <strong>{prediction.player1}</strong> vs <strong>{prediction.player2}</strong>
                  </div>
                  <div style={{ 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    <span style={{ 
                      color: '#87CEEB', 
                      fontWeight: 'bold' 
                    }}>
                      🎯 Predicted Winner: {prediction.predicted_winner}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '20px',
                    flexWrap: 'wrap',
                    fontSize: '13px',
                    color: '#DDA0DD'
                  }}>
                    <div>📈 Confidence: <strong>{prediction.confidence_score}%</strong></div>
                    <div>💡 Recommended: <strong>{prediction.recommended_action}</strong></div>
                    <div>🏟️ Surface: <strong>{prediction.surface}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ 
          marginTop: '30px', 
          fontSize: '14px', 
          color: 'rgba(255, 255, 255, 0.8)' 
        }}>
          <p><strong>Debug Info:</strong></p>
          <p>• Time: {new Date().toLocaleString()}</p>
          <p>• User Agent: {navigator.userAgent}</p>
          <p>• API URL: http://193.24.209.9:3001/api/predictions</p>
          <p>• Console logs available - press F12 to check</p>
        </div>
      </div>
    </div>
  )
}

export default SimpleApp
