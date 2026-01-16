import React, { useState, useEffect } from 'react';
import { Shield, Wallet, Lock, Unlock, History, Bell, ChevronRight, ArrowLeft, Clock, Check, X, AlertTriangle, Key, Users, TrendingUp, Vote, ThumbsUp, ThumbsDown, Minus, Search, ExternalLink, LayoutDashboard, PenTool, DollarSign, LogOut, RefreshCw, Eye, Plus, Database, Activity, Filter } from 'lucide-react';

// Design System
const colors = {
  bgPrimary: '#0A0A0F',
  bgSecondary: '#12121A',
  bgTertiary: '#1A1A24',
  bgCard: '#1F1F2E',
  primary500: '#0080E6',
  primary400: '#1A9DFF',
  secondary500: '#7A00E6',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#6B7280',
  border: '#374151',
};

// Shared Components
const Card = ({ children, className = '', onClick }) => (
  <div className={`rounded-xl p-6 ${className}`} style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}` }} onClick={onClick}>{children}</div>
);

const Button = ({ children, variant = 'primary', size = 'md', disabled = false, className = '', ...props }) => {
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-base', lg: 'px-6 py-3 text-lg' };
  const bgColors = { primary: colors.primary500, success: colors.success, danger: colors.error, secondary: 'transparent', ghost: 'transparent', accent: colors.secondary500 };
  return (
    <button className={`font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${sizes[size]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{ backgroundColor: bgColors[variant] || colors.primary500, color: variant === 'ghost' || variant === 'secondary' ? colors.textSecondary : colors.textPrimary, border: variant === 'secondary' ? `1px solid ${colors.border}` : 'none' }}
      disabled={disabled} {...props}>{children}</button>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    active: { bg: colors.success + '20', color: colors.success, text: 'Active' },
    pending: { bg: colors.warning + '20', color: colors.warning, text: 'Pending' },
    signed: { bg: colors.success + '20', color: colors.success, text: 'Signed' },
    rejected: { bg: colors.error + '20', color: colors.error, text: 'Rejected' },
  };
  const { bg, color, text } = config[status] || config.active;
  return <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: bg, color }}>{text}</span>;
};

// Navigation Header
const Header = ({ currentPage, setCurrentPage }) => {
  const navItems = ['dashboard', 'lock', 'unlock', 'token', 'governance', 'prover', 'explorer'];
  return (
    <header className="h-16 px-6 flex items-center justify-between border-b" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.border }}>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('dashboard')}>
          <Shield className="w-8 h-8" style={{ color: colors.primary500 }} />
          <span className="text-xl font-bold">Quantum Shield</span>
        </div>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <button key={item} className="text-sm font-medium px-3 py-1.5 rounded-lg capitalize"
              style={{ color: currentPage === item ? colors.textPrimary : colors.textSecondary, backgroundColor: currentPage === item ? colors.bgTertiary : 'transparent' }}
              onClick={() => setCurrentPage(item)}>{item}</button>
          ))}
        </nav>
      </div>
      <Button variant="secondary" size="sm"><Wallet className="w-4 h-4" />0x1234...5678</Button>
    </header>
  );
};

// Dashboard Page
const DashboardPage = ({ setCurrentPage }) => (
  <main className="p-8 max-w-7xl mx-auto">
    <h1 className="text-2xl font-bold mb-8">Welcome back, 0x1234...5678</h1>
    <div className="grid grid-cols-3 gap-6 mb-8">
      {[{ label: 'Total Locked', value: '5.5 ETH', icon: Lock, color: colors.primary500 },
        { label: 'Pending Unlocks', value: '2', icon: Clock, color: colors.warning },
        { label: 'Available', value: '1.2 ETH', icon: Check, color: colors.success }].map((s, i) => (
        <Card key={i}>
          <p className="text-sm" style={{ color: colors.textSecondary }}>{s.label}</p>
          <p className="text-2xl font-bold mt-1">{s.value}</p>
        </Card>
      ))}
    </div>
    <Card>
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Lock', icon: Lock, page: 'lock' }, { label: 'Unlock', icon: Unlock, page: 'unlock' }, { label: 'History', icon: History, page: 'explorer' }].map((a, i) => (
          <button key={i} className="p-6 rounded-xl text-center border" style={{ backgroundColor: colors.bgTertiary, borderColor: colors.border }} onClick={() => setCurrentPage(a.page)}>
            <a.icon className="w-8 h-8 mx-auto mb-2" style={{ color: colors.primary500 }} />
            <p className="font-medium">{a.label}</p>
          </button>
        ))}
      </div>
    </Card>
  </main>
);

// Lock Page
const LockPage = ({ setCurrentPage }) => {
  const [amount, setAmount] = useState('1.5');
  const [hasKey, setHasKey] = useState(false);
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <button className="flex items-center gap-2 mb-6" style={{ color: colors.textSecondary }} onClick={() => setCurrentPage('dashboard')}><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="text-2xl font-bold mb-6">Lock Assets</h1>
      <Card>
        <div className="space-y-6">
          <div>
            <label className="text-sm" style={{ color: colors.textSecondary }}>Amount</label>
            <div className="flex items-center mt-2 rounded-lg px-4 py-3" style={{ backgroundColor: colors.bgTertiary }}>
              <input className="flex-1 bg-transparent outline-none text-lg" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <span>ETH</span>
            </div>
          </div>
          {!hasKey && (
            <div className="p-4 rounded-lg" style={{ backgroundColor: colors.warning + '15' }}>
              <div className="flex gap-3">
                <AlertTriangle style={{ color: colors.warning }} />
                <div>
                  <p className="font-medium" style={{ color: colors.warning }}>Dilithium Key Required</p>
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => setHasKey(true)}><Key className="w-4 h-4" /> Generate</Button>
                </div>
              </div>
            </div>
          )}
          {hasKey && <div className="p-4 rounded-lg flex items-center gap-2" style={{ backgroundColor: colors.success + '15' }}><Check style={{ color: colors.success }} /><span style={{ color: colors.success }}>Key Ready</span></div>}
          <Button className="w-full" disabled={!hasKey}>Lock {amount} ETH</Button>
        </div>
      </Card>
    </main>
  );
};

// Unlock Page
const UnlockPage = ({ setCurrentPage }) => {
  const [time, setTime] = useState({ h: 23, m: 45, s: 30 });
  useEffect(() => {
    const t = setInterval(() => setTime(p => {
      let { h, m, s } = p; s--;
      if (s < 0) { s = 59; m--; }
      if (m < 0) { m = 59; h--; }
      return h < 0 ? { h: 0, m: 0, s: 0 } : { h, m, s };
    }), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <main className="p-8 max-w-3xl mx-auto">
      <button className="flex items-center gap-2 mb-6" style={{ color: colors.textSecondary }} onClick={() => setCurrentPage('dashboard')}><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="text-2xl font-bold mb-6">Unlock #12345</h1>
      <Card className="mb-6 text-center">
        <p className="text-sm mb-4" style={{ color: colors.textSecondary }}>Time Remaining</p>
        <div className="text-5xl font-mono font-bold">{String(time.h).padStart(2,'0')}:{String(time.m).padStart(2,'0')}:{String(time.s).padStart(2,'0')}</div>
        <div className="h-2 rounded-full mt-6" style={{ backgroundColor: colors.bgTertiary }}><div className="h-full rounded-full" style={{ width: '45%', backgroundColor: colors.primary500 }} /></div>
      </Card>
      <Card>
        <h2 className="font-semibold mb-4">Prover Signatures</h2>
        {['Prover A', 'Prover B'].map((p, i) => (
          <div key={i} className="flex justify-between p-3 rounded-lg mb-2" style={{ backgroundColor: colors.bgTertiary }}>
            <span>{p}</span><span style={{ color: colors.success }}>✓ Signed</span>
          </div>
        ))}
      </Card>
    </main>
  );
};

// Token Hub Page
const TokenPage = () => {
  const [amount, setAmount] = useState('1000');
  const [period, setPeriod] = useState(4);
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Token Hub</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[{ l: 'QS Balance', v: '10,000 QS' }, { l: 'veQS Balance', v: '8,500 veQS' }, { l: 'Voting Power', v: '8,500' }].map((s, i) => (
          <Card key={i}><p className="text-sm" style={{ color: colors.textSecondary }}>{s.l}</p><p className="text-xl font-bold">{s.v}</p></Card>
        ))}
      </div>
      <Card>
        <h2 className="text-lg font-semibold mb-4">Lock QS for veQS</h2>
        <div className="mb-4">
          <label className="text-sm" style={{ color: colors.textSecondary }}>Amount</label>
          <div className="flex items-center mt-2 rounded-lg px-4 py-3" style={{ backgroundColor: colors.bgTertiary }}>
            <input className="flex-1 bg-transparent outline-none text-lg" value={amount} onChange={(e) => setAmount(e.target.value)} /><span>QS</span>
          </div>
        </div>
        <div className="mb-6">
          <label className="text-sm" style={{ color: colors.textSecondary }}>Lock Period</label>
          <div className="flex gap-2 mt-2">
            {[1, 2, 4].map(y => (
              <button key={y} className="flex-1 py-2 rounded-lg" style={{ backgroundColor: period === y ? colors.primary500 : colors.bgTertiary }} onClick={() => setPeriod(y)}>{y}Y</button>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: colors.bgTertiary }}>
          <div className="flex justify-between"><span>You receive</span><span className="font-bold">{Math.floor(parseInt(amount || 0) * period / 4)} veQS</span></div>
        </div>
        <Button className="w-full">Lock QS for veQS</Button>
      </Card>
    </main>
  );
};

// Governance Page
const GovernancePage = () => {
  const proposals = [
    { id: 'QIP-42', title: 'Increase Prover Rewards by 15%', status: 'active', for: 75, against: 25, time: '2 days' },
    { id: 'QIP-41', title: 'Add WBTC Support', status: 'active', for: 85, against: 15, time: '5 days' },
  ];
  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Governance</h1>
        <Button><Plus className="w-4 h-4" /> Create Proposal</Button>
      </div>
      <div className="space-y-4">
        {proposals.map(p => (
          <Card key={p.id} className="cursor-pointer hover:border-gray-600">
            <div className="flex justify-between mb-2">
              <span className="font-mono text-sm" style={{ color: colors.textMuted }}>{p.id}</span>
              <StatusBadge status={p.status} />
            </div>
            <h3 className="text-lg font-semibold mb-3">{p.title}</h3>
            <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: colors.bgTertiary }}>
              <div style={{ width: `${p.for}%`, backgroundColor: colors.success }} />
              <div style={{ width: `${p.against}%`, backgroundColor: colors.error }} />
            </div>
            <div className="flex justify-between mt-2 text-sm" style={{ color: colors.textMuted }}>
              <span>For: {p.for}%</span><span>Against: {p.against}%</span><span>{p.time} left</span>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
};

// Prover Portal Page
const ProverPage = () => {
  const requests = [
    { id: 'REQ-789456', amount: '150 ETH', status: 'pending', approvals: '1/3' },
    { id: 'REQ-789457', amount: '0.5 ETH', status: 'signed', approvals: '3/3' },
  ];
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: colors.bgPrimary }}>
      <aside className="w-60 border-r p-4" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.border }}>
        <div className="flex items-center gap-2 mb-8">
          <Shield className="w-6 h-6" style={{ color: colors.primary500 }} />
          <span className="font-bold">Prover Portal</span>
        </div>
        {[{ i: LayoutDashboard, l: 'Dashboard' }, { i: PenTool, l: 'Signing', badge: 2 }, { i: Users, l: 'Delegation' }, { i: DollarSign, l: 'Earnings' }].map((m, idx) => (
          <button key={idx} className="w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1" style={{ backgroundColor: m.l === 'Signing' ? colors.primary500 + '20' : 'transparent' }}>
            <div className="flex items-center gap-3"><m.i className="w-5 h-5" /><span>{m.l}</span></div>
            {m.badge && <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{ backgroundColor: colors.error }}>{m.badge}</span>}
          </button>
        ))}
      </aside>
      <div className="flex-1 p-6">
        <h1 className="text-xl font-bold mb-6">Signing Queue</h1>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[{ l: 'Pending', v: '2', c: colors.warning }, { l: 'Today', v: '45' }, { l: 'Avg Time', v: '2.3 min' }, { l: 'Success', v: '99.8%', c: colors.success }].map((s, i) => (
            <Card key={i} className="!p-4"><p className="text-sm" style={{ color: colors.textMuted }}>{s.l}</p><p className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</p></Card>
          ))}
        </div>
        {requests.map(r => (
          <Card key={r.id} className="mb-4">
            <div className="flex justify-between mb-3">
              <span className="font-mono">{r.id}</span>
              <StatusBadge status={r.status} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">{r.amount}</span>
              <div className="flex gap-2">
                {r.status === 'pending' && <><Button variant="danger" size="sm"><X className="w-4 h-4" /> Reject</Button><Button variant="success" size="sm"><Check className="w-4 h-4" /> Approve</Button></>}
                <span className="px-3 py-1 rounded" style={{ backgroundColor: colors.bgTertiary }}>{r.approvals}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Explorer Page
const ExplorerPage = () => {
  const txs = [
    { id: '#12345', type: 'lock', amount: '1.5 ETH', status: 'active', time: '2m ago' },
    { id: '#12344', type: 'unlock', amount: '2.0 ETH', status: 'pending', time: '15m ago' },
    { id: '#12343', type: 'unlock', amount: '0.8 ETH', status: 'signed', time: '1h ago' },
  ];
  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="text-center py-12 mb-8 rounded-xl" style={{ backgroundColor: colors.bgSecondary }}>
        <h1 className="text-3xl font-bold mb-4">Quantum Shield Explorer</h1>
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: colors.bgCard }}>
          <Search style={{ color: colors.textMuted }} />
          <input className="flex-1 bg-transparent outline-none" placeholder="Search by Lock ID, Address, or TX Hash..." />
          <Button>Search</Button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[{ l: 'TVL', v: '$24.5M', i: Database }, { l: 'Total Locks', v: '12,456', i: Lock }, { l: 'Provers', v: '24', i: Users }, { l: '24h Volume', v: '$1.2M', i: Activity }].map((s, i) => (
          <Card key={i} className="!p-4">
            <div className="flex justify-between">
              <div><p className="text-sm" style={{ color: colors.textMuted }}>{s.l}</p><p className="text-xl font-bold">{s.v}</p></div>
              <s.i style={{ color: colors.primary500 }} />
            </div>
          </Card>
        ))}
      </div>
      <Card className="!p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr style={{ backgroundColor: colors.bgTertiary }}>
            {['ID', 'Type', 'Amount', 'Status', 'Time'].map(h => <th key={h} className="text-left py-3 px-4 text-sm" style={{ color: colors.textMuted }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {txs.map(tx => (
              <tr key={tx.id} className="border-t cursor-pointer hover:bg-gray-800/50" style={{ borderColor: colors.border }}>
                <td className="py-3 px-4 font-mono">{tx.id}</td>
                <td className="py-3 px-4 capitalize">{tx.type}</td>
                <td className="py-3 px-4 font-semibold">{tx.amount}</td>
                <td className="py-3 px-4"><StatusBadge status={tx.status} /></td>
                <td className="py-3 px-4" style={{ color: colors.textMuted }}>{tx.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </main>
  );
};

// Main App
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage setCurrentPage={setCurrentPage} />;
      case 'lock': return <LockPage setCurrentPage={setCurrentPage} />;
      case 'unlock': return <UnlockPage setCurrentPage={setCurrentPage} />;
      case 'token': return <TokenPage />;
      case 'governance': return <GovernancePage />;
      case 'prover': return <ProverPage />;
      case 'explorer': return <ExplorerPage />;
      default: return <DashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bgPrimary, color: colors.textPrimary }}>
      {currentPage !== 'prover' && <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />}
      {renderPage()}
    </div>
  );
}
