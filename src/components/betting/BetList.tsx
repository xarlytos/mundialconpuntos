import { useState, useMemo } from 'react';
import type { Bet } from '../../types/index.ts';
import {
  ChevronLeft,
  Plus,
  Target,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
  BarChart3
} from 'lucide-react';
import { getFlagImage } from '../../utils/helpers';
import { Header } from '../home/Header';
import { MobileLayout } from '../../features/fantasy/presentation/shared/MobileLayout';
import './BetList.css';

interface BetListProps {
  bets: Bet[];
  onOpenModal: () => void;
  onNavigate?: (view: string) => void;
  points: number;
}

export const BetList = ({ bets, onOpenModal, onNavigate, points }: BetListProps) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('pending');

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    const wonBets = bets.filter(b => b.status === 'won');
    const totalWon = wonBets.reduce((sum, b) => sum + (b.amount * b.odds), 0);
    const profit = totalWon - bets.filter(b => b.status !== 'pending').reduce((sum, b) => sum + b.amount, 0);
    const winRate = bets.length > 0 ? Math.round((wonBets.length / bets.filter(b => b.status !== 'pending').length) * 100) || 0 : 0;
    const totalBets = bets.length;
    const activeStreak = calculateStreak(bets);
    
    return { totalBet, totalWon, profit, winRate, totalBets, activeStreak };
  }, [bets]);

  // Calcular racha actual
  function calculateStreak(bets: Bet[]) {
    const resolved = bets.filter(b => b.status !== 'pending').sort((a, b) => b.id - a.id);
    let streak = 0;
    for (const bet of resolved) {
      if (bet.status === 'won') streak++;
      else break;
    }
    return streak;
  }

  // Filtrar apuestas
  const filteredBets = useMemo(() => {
    if (filter === 'all') return bets;
    return bets.filter(b => b.status === filter);
  }, [bets, filter]);

  // Conteos para tabs
  const counts = {
    all: bets.length,
    pending: bets.filter(b => b.status === 'pending').length,
    won: bets.filter(b => b.status === 'won').length,
    lost: bets.filter(b => b.status === 'lost').length,
  };

  return (
    <MobileLayout onNavigate={onNavigate} currentView="bets">
      <Header points={points} />

      {/* HEADER PROFESIONAL */}
      <div className="bets-header">
        <button 
          onClick={() => onNavigate?.('dashboard')}
          className="bets-back-btn"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="bets-title-section">
          <Trophy size={20} className="bets-title-icon" />
          <span className="bets-title">Mis Apuestas</span>
        </div>
        
        <button 
          onClick={onOpenModal}
          className="bets-add-btn"
        >
          <Plus size={18} />
          <span>Nueva</span>
        </button>
      </div>

      {/* CONTENIDO CON SCROLL */}
      <div className="bets-content">
        
        {/* STATS CARDS - DISEÑO PREMIUM */}
        <div className="stats-section">
          <div className="stats-main-card">
            <div className="stats-main-header">
              <BarChart3 size={20} />
              <span>Tu Rendimiento</span>
            </div>
            <div className="stats-grid">
              <div className="stat-item stat-item--large">
                <div className="stat-value" style={{ color: stats.profit >= 0 ? '#22c55e' : '#ef4444' }}>
                  {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(0)}
                </div>
                <div className="stat-label">Balance (pts)</div>
              </div>
              <div className="stat-item">
                <div className="stat-value stat-value--primary">{stats.winRate}%</div>
                <div className="stat-label">Acierto</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.totalBets}</div>
                <div className="stat-label">Apuestas</div>
              </div>
              {stats.activeStreak > 0 && (
                <div className="stat-item stat-item--streak">
                  <div className="stat-value stat-value--accent">
                    <Zap size={16} />
                    {stats.activeStreak}
                  </div>
                  <div className="stat-label">Racha 🔥</div>
                </div>
              )}
            </div>
          </div>

          {/* Stats secundarios */}
          <div className="stats-secondary">
            <StatCard 
              label="Apostado"
              value={`${stats.totalBet}`}
              subvalue="pts"
              icon={<Target size={16} />}
              color="var(--text-secondary)"
            />
            <StatCard 
              label="Ganado"
              value={`${stats.totalWon.toFixed(0)}`}
              subvalue="pts"
              icon={<Award size={16} />}
              color="#22c55e"
            />
          </div>
        </div>

        {/* FILTROS MEJORADOS */}
        <div className="filters-section">
          <FilterTab 
            label="Pendientes"
            count={counts.pending}
            isActive={filter === 'pending'}
            onClick={() => setFilter('pending')}
            color="#f59e0b"
            icon="⏳"
          />
          <FilterTab 
            label="Ganadas"
            count={counts.won}
            isActive={filter === 'won'}
            onClick={() => setFilter('won')}
            color="#22c55e"
            icon="✅"
          />
          <FilterTab 
            label="Perdidas"
            count={counts.lost}
            isActive={filter === 'lost'}
            onClick={() => setFilter('lost')}
            color="#ef4444"
            icon="❌"
          />
          <FilterTab 
            label="Todas"
            count={counts.all}
            isActive={filter === 'all'}
            onClick={() => setFilter('all')}
            icon="📊"
          />
        </div>

        {/* LISTA DE APUESTAS */}
        <div className="bets-list-section">
          <div className="bets-section-header">
            <span className="bets-section-title">
              {filter === 'all' && 'Todas las apuestas'}
              {filter === 'pending' && 'Apuestas pendientes'}
              {filter === 'won' && 'Apuestas ganadas'}
              {filter === 'lost' && 'Apuestas perdidas'}
            </span>
            <span className="bets-count">{filteredBets.length}</span>
          </div>

          {filteredBets.length === 0 ? (
            <EmptyState onNewBet={onOpenModal} />
          ) : (
            <div className="bets-list">
              {filteredBets.map((bet, index) => (
                <BetCard key={bet.id} bet={bet} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>

    </MobileLayout>
  );
};

// Componente StatCard mejorado
function StatCard({ 
  label, 
  value, 
  subvalue,
  icon,
  color,
}: { 
  label: string; 
  value: string;
  subvalue: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="stat-card-small">
      <div className="stat-card-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <div className="stat-card-value" style={{ color }}>
          {value}
          <span className="stat-card-subvalue">{subvalue}</span>
        </div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

// Componente FilterTab mejorado
function FilterTab({ 
  label, 
  count, 
  isActive, 
  onClick,
  color = '#FFE600',
  icon
}: { 
  label: string; 
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: string;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`filter-tab ${isActive ? 'filter-tab--active' : ''}`}
      style={{
        ['--filter-color' as string]: color,
      }}
    >
      <span className="filter-tab-icon">{icon}</span>
      <span className="filter-tab-label">{label}</span>
      <span className="filter-tab-count">{count}</span>
    </button>
  );
}

// Función para extraer equipos del string "EquipoA vs EquipoB"
function parseMatchTeams(matchStr: string): { home: string; away: string } {
  const parts = matchStr.split(' vs ');
  return {
    home: parts[0]?.trim() || '',
    away: parts[1]?.trim() || ''
  };
}

// BetCard profesional
function BetCard({ bet, index }: { bet: Bet; index: number }) {
  const potential = (bet.amount * bet.odds).toFixed(0);
  const profit = (parseFloat(potential) - bet.amount).toFixed(0);
  const teams = parseMatchTeams(bet.match);

  const getStatusConfig = () => {
    switch (bet.status) {
      case 'won': 
        return { 
          label: 'GANADA', 
          icon: <CheckCircle2 size={14} />,
          className: 'status-won',
          gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
        };
      case 'lost': 
        return { 
          label: 'PERDIDA', 
          icon: <XCircle size={14} />,
          className: 'status-lost',
          gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
        };
      default: 
        return { 
          label: 'PENDIENTE', 
          icon: <Clock size={14} />,
          className: 'status-pending',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
        };
    }
  };

  const status = getStatusConfig();

  return (
    <div 
      className="bet-card"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Barra de estado lateral */}
      <div 
        className="bet-card-status-bar"
        style={{ background: status.gradient }}
      />

      <div className="bet-card-content">
        {/* Header con equipos y estado */}
        <div className="bet-card-header">
          <div className="bet-card-teams">
            <div className="bet-team">
              <FlagEmoji country={teams.home} />
              <span className="bet-team-name">{teams.home}</span>
            </div>
            <span className="bet-vs">VS</span>
            <div className="bet-team">
              <FlagEmoji country={teams.away} />
              <span className="bet-team-name">{teams.away}</span>
            </div>
          </div>
          
          <div className={`bet-status ${status.className}`}>
            {status.icon}
            <span>{status.label}</span>
          </div>
        </div>

        {/* Detalles de la apuesta */}
        <div className="bet-card-details">
          <div className="bet-pick-section">
            <div className="bet-type-badge">
              {bet.typeName || bet.type}
            </div>
            <div className="bet-pick-value">
              {bet.pick}
            </div>
          </div>
          
          <div className="bet-odds-badge">
            <span className="bet-odds-label">CUOTA</span>
            <span className="bet-odds-value">{bet.odds.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer con montos */}
        <div className="bet-card-footer">
          <div className="bet-amount-section">
            <div className="bet-amount-item">
              <span className="bet-amount-label">Apostado</span>
              <span className="bet-amount-value">{bet.amount} pts</span>
            </div>
            
            {bet.status === 'won' && (
              <div className="bet-amount-item bet-amount-item--won">
                <span className="bet-amount-label">Ganancia</span>
                <span className="bet-amount-value">+{profit} pts</span>
              </div>
            )}
            {bet.status === 'lost' && (
              <div className="bet-amount-item bet-amount-item--lost">
                <span className="bet-amount-label">Pérdida</span>
                <span className="bet-amount-value">-{bet.amount} pts</span>
              </div>
            )}
            {bet.status === 'pending' && (
              <div className="bet-amount-item bet-amount-item--pending">
                <span className="bet-amount-label">Potencial</span>
                <span className="bet-amount-value">{potential} pts</span>
              </div>
            )}
          </div>

          <div className="bet-date">
            {bet.date}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state mejorado
function EmptyState({ onNewBet }: { onNewBet: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Trophy size={48} />
      </div>
      <h3 className="empty-state-title">
        ¡Comienza tu aventura!
      </h3>
      <p className="empty-state-description">
        Realiza tu primera predicción y empieza a acumular puntos en el Mundial 2026
      </p>
      <button
        onClick={onNewBet}
        className="empty-state-btn"
      >
        <Plus size={20} />
        Crear primera apuesta
      </button>
    </div>
  );
}

// Emoji flags fallback
const FLAG_EMOJIS: Record<string, string> = {
  'México': '🇲🇽',
  'Sudáfrica': '🇿🇦',
  'Corea del Sur': '🇰🇷',
  'Brasil': '🇧🇷',
  'Marruecos': '🇲🇦',
  'EE.UU.': '🇺🇸',
  'Paraguay': '🇵🇾',
  'Canadá': '🇨🇦',
  'España': '🇪🇸',
  'Cabo Verde': '🇨🇻',
  'Argentina': '🇦🇷',
  'Argelia': '🇩🇿',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croacia': '🇭🇷',
  'Francia': '🇫🇷',
  'Senegal': '🇸🇳',
  'Alemania': '🇩🇪',
  'Curazao': '🇨🇼',
  'Colombia': '🇨🇴',
  'Portugal': '🇵🇹',
  'Japón': '🇯🇵',
  'Uruguay': '🇺🇾',
  'Bélgica': '🇧🇪',
  'Países Bajos': '🇳🇱',
  'Italia': '🇮🇹',
};

function FlagEmoji({ country }: { country: string }) {
  const flagUrl = getFlagImage(country, 40);
  const emoji = FLAG_EMOJIS[country] || '🏳️';
  
  return (
    <img
      src={flagUrl}
      alt={country}
      onError={(e) => {
        const target = e.currentTarget;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          const span = document.createElement('span');
          span.textContent = emoji;
          span.className = 'flag-emoji-fallback';
          parent.insertBefore(span, target);
        }
      }}
      className="flag-image"
    />
  );
}

export default BetList;
