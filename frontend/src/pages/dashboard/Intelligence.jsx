import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const MESSAGES_INIT = [
  { role: 'user', time: '10:42 AM', text: '"Optimize routes for today\'s pending orders."' },
  {
    role: 'ai', time: '10:43 AM', text: null,
    lines: [
      { icon: '✅', label: 'Optimization Complete' },
      { icon: '🗺️', label: 'Routes updated.' },
    ],
    cta: 'Reply CONFIRM to dispatch'
  }
];

const Intelligence = () => {
  const [messages, setMessages] = useState(MESSAGES_INIT);
  const [input, setInput] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [predicting, setPredicting] = useState(false);
  const bottomRef = useRef(null);

  const fetchPredictions = async () => {
    const { data } = await supabase
      .from('delay_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setPredictions(data);
  };

  useEffect(() => {
    fetchPredictions();
    const sub = supabase.channel('preds')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delay_predictions' }, () => fetchPredictions())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const runPrediction = async () => {
    setPredicting(true);
    try {
      const res = await fetch('http://localhost:3000/api/predict-all', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        { role: 'user', time: now, text: 'Run Delay Prediction' },
        { role: 'ai', time: now, text: null,
          lines: [{ icon: '🤖', label: `Ran prediction on ${json.count} active orders.` }], cta: null },
      ]);
    } catch (e) {
      alert(e.message);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      { role: 'user', time: now, text: trimmed },
      { role: 'ai', time: now, text: null,
        lines: [{ icon: '🤖', label: `Processing: "${trimmed}"...` }], cta: null },
    ]);
    setInput('');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full" style={{ color: 'var(--fg)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1">Delays & Risks</h3>
          <p className="text-[11px]" style={{ opacity: 0.5 }}>Predictive engine + AI Copilot for your logistics ops.</p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444',
          padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
          {predictions.filter(p => p.risk_level === 'high').length} High Risk Orders
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Predictive Engine */}
        <div style={{
          backgroundColor: 'var(--card-bg)', borderRadius: '16px',
          border: '1px solid var(--border-color)', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          transition: 'background-color 0.3s ease',
          height: '460px', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.8 }}>Predictive Engine (Live Models)</span>
            <button 
              onClick={runPrediction}
              disabled={predicting}
              className="text-[10px] font-bold uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] px-4 py-2 rounded-lg hover:opacity-90"
            >
              {predicting ? 'Running...' : 'Run Predictions'}
            </button>
          </div>
          
          {predictions.length === 0 && (
            <div className="text-center opacity-40 text-xs py-10 uppercase tracking-widest mt-10">No predictions run yet.</div>
          )}

          {predictions.map(pred => (
            <div key={pred.id} style={{
              border: `1px solid ${pred.risk_level === 'high' ? 'rgba(239,68,68,0.25)' : pred.risk_level === 'medium' ? 'rgba(234,179,8,0.25)' : 'rgba(34,197,94,0.25)'}`, 
              backgroundColor: pred.risk_level === 'high' ? 'rgba(239,68,68,0.05)' : pred.risk_level === 'medium' ? 'rgba(234,179,8,0.05)' : 'rgba(34,197,94,0.05)',
              borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden',
              flexShrink: 0
            }}>
              <div style={{ 
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', 
                backgroundColor: pred.risk_level === 'high' ? '#ef4444' : pred.risk_level === 'medium' ? '#eab308' : '#22c55e', 
                borderRadius: '12px 0 0 12px' 
              }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ 
                  backgroundColor: pred.risk_level === 'high' ? 'rgba(239,68,68,0.15)' : pred.risk_level === 'medium' ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)', 
                  color: pred.risk_level === 'high' ? '#ef4444' : pred.risk_level === 'medium' ? '#eab308' : '#22c55e', 
                  fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' 
                }}>
                  {pred.risk_level} RISK ({(pred.risk_score * 100).toFixed(0)}%)
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700' }}>Order #{pred.order_id}</span>
              </div>
              <p style={{ fontSize: '11px', opacity: 0.8, lineHeight: 1.6, marginBottom: '4px' }}>
                {pred.explanation}
              </p>
              <p style={{ fontSize: '10px', opacity: 0.5, lineHeight: 1.6, marginBottom: '12px' }}>
                Weather: {pred.weather_description} ({pred.precipitation_mm}mm rain) | Distance: {pred.distance_km}km
              </p>
              <button style={{
                fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase',
                backgroundColor: pred.risk_level === 'high' ? 'var(--fg)' : 'transparent', 
                color: pred.risk_level === 'high' ? 'var(--bg)' : 'var(--fg)', 
                padding: '7px 14px',
                borderRadius: '8px', border: pred.risk_level === 'high' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer',
              }}>
                {pred.suggested_action.substring(0, 40)}{pred.suggested_action.length > 40 ? '...' : ''}
              </button>
            </div>
          ))}

        </div>

        {/* ── Copilot Chat ── */}
        <div style={{
          backgroundColor: 'var(--card-bg)', borderRadius: '16px',
          border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column',
          height: '460px', overflow: 'hidden', transition: 'background-color 0.3s ease',
        }}>
          {/* Chat header */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                backgroundColor: 'var(--fg)', color: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              }}>✦</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>Copilot AI</div>
                <div style={{ fontSize: '10px', opacity: 0.4 }}>RapidRoute Intelligence Engine</div>
              </div>
            </div>
            <div style={{
              fontSize: '10px', fontWeight: '700', opacity: 0.5,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
              Online
            </div>
          </div>

          {/* Messages */}
          <div className="dash-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', overscrollBehavior: 'contain' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'ai' && (
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '90%' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
                      backgroundColor: 'var(--fg)', color: 'var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', marginTop: '2px',
                    }}>✦</div>
                    <div>
                      <div style={{ fontSize: '9px', opacity: 0.35, marginBottom: '5px', fontWeight: '600' }}>{msg.time}</div>
                      <div style={{
                        backgroundColor: 'var(--dashboard-bg)', borderRadius: '0 12px 12px 12px',
                        padding: '12px 14px', border: '1px solid var(--border-color)',
                        fontSize: '11px', lineHeight: 1.7, color: 'var(--fg)',
                      }}>
                        {msg.text && <span>{msg.text}</span>}
                        {msg.lines && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {msg.lines.map((l, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                                <span style={{ fontSize: '12px', flexShrink: 0 }}>{l.icon}</span>
                                <span style={{ opacity: 0.85 }}>{l.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.cta && (
                          <div style={{ marginTop: '10px', opacity: 0.5, fontSize: '10px', fontStyle: 'italic' }}>
                            💬 {msg.cta}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{ fontSize: '9px', opacity: 0.35, marginBottom: '5px', fontWeight: '600', textAlign: 'right' }}>{msg.time}</div>
                    <div style={{
                      backgroundColor: 'var(--fg)', color: 'var(--bg)',
                      borderRadius: '12px 0 12px 12px', padding: '10px 14px',
                      fontSize: '11px', lineHeight: 1.6,
                    }}>{msg.text}</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Copilot anything..."
                style={{
                  flex: 1, backgroundColor: 'var(--dashboard-bg)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', padding: '9px 14px', fontSize: '12px', color: 'var(--fg)',
                  outline: 'none', transition: 'all 0.2s ease',
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  backgroundColor: 'var(--fg)', color: 'var(--bg)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Intelligence;
