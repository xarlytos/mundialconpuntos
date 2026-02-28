import { useState } from 'react';
import type { Match, BetType } from '../../types/index.ts';
import { BET_TYPES, SCORERS, SCORE_OPTIONS, SCORE_ODDS } from '../../data/betting';
import { MATCHES } from '../../data/matches';
import { getFlagImage } from '../../utils/helpers';
import { ChevronLeft, X, Zap, Trophy, Target, Sparkles, Check } from 'lucide-react';
import './BetModal.css';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bet: any) => void;
}

export const BetModal = ({ isOpen, onClose, onConfirm }: BetModalProps) => {
  const [step, setStep] = useState(1);
  const [selMatch, setSelMatch] = useState<Match | null>(null);
  const [selType, setSelType] = useState<BetType | null>(null);
  const [selPick, setSelPick] = useState<string | null>(null);
  const [selOdds, setSelOdds] = useState(0);
  const [selAmount, setSelAmount] = useState(50);

  if (!isOpen) return null;

  const handleMatchSelect = (match: Match) => {
    setSelMatch(match);
    setStep(2);
  };

  const handleTypeSelect = (type: BetType) => {
    setSelType(type);
    setStep(3);
  };

  const handlePick = (pick: string, odds: number) => {
    setSelPick(pick);
    setSelOdds(odds);
  };

  const handleContinue = () => {
    setStep(4);
  };

  const handleConfirm = () => {
    if (!selMatch || !selType || !selPick) return;

    onConfirm({
      match: `${selMatch.h} vs ${selMatch.a}`,
      matchId: selMatch.id,
      type: selType.id,
      typeName: selType.label,
      pick: selPick,
      odds: selOdds,
      amount: selAmount,
      status: 'pending',
      date: `${selMatch.date} ${selMatch.time}`
    });

    // Reset
    setStep(1);
    setSelMatch(null);
    setSelType(null);
    setSelPick(null);
    setSelOdds(0);
    setSelAmount(50);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Selecciona partido';
      case 2: return 'Tipo de apuesta';
      case 3: return 'Tu predicción';
      case 4: return 'Confirma tu apuesta';
      default: return '';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return <Trophy size={18} />;
      case 2: return <Target size={18} />;
      case 3: return <Sparkles size={18} />;
      case 4: return <Zap size={18} />;
      default: return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-top">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="modal-back-btn">
                <ChevronLeft size={20} />
              </button>
            ) : (
              <div style={{ width: 40 }} />
            )}
            
            <div className="modal-title-group">
              <div className="modal-icon">{getStepIcon()}</div>
              <span className="modal-title">{getStepTitle()}</span>
            </div>
            
            <button onClick={onClose} className="modal-close-btn">
              <X size={18} />
            </button>
          </div>
          
          {/* Steps Indicator - Simple y claro */}
          <div className="steps-indicator">
            {[1, 2, 3, 4].map((s, index) => (
              <div key={s} className="step-item">
                <div 
                  className={`step-circle ${
                    s < step ? 'step-circle--completed' : 
                    s === step ? 'step-circle--active' : ''
                  }`}
                >
                  {s < step ? <Check size={14} /> : s}
                </div>
                {index < 3 && (
                  <div 
                    className={`step-line ${s < step ? 'step-line--completed' : ''}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {step === 1 && <Step1 onSelect={handleMatchSelect} />}
          {step === 2 && <Step2 onSelect={handleTypeSelect} />}
          {step === 3 && (
            <Step3
              match={selMatch!}
              type={selType!}
              selPick={selPick}
              onPick={handlePick}
              onContinue={handleContinue}
            />
          )}
          {step === 4 && (
            <Step4
              match={selMatch!}
              type={selType!}
              pick={selPick!}
              odds={selOdds}
              amount={selAmount}
              potential={(selAmount * selOdds).toFixed(0)}
              onAmountChange={setSelAmount}
              onConfirm={handleConfirm}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Step 1: Seleccionar partido
function Step1({ onSelect }: { onSelect: (m: Match) => void }) {
  const liveMatches = MATCHES.filter(m => m.live);
  const upcomingMatches = MATCHES.filter(m => !m.live);

  return (
    <div className="step-container">
      {liveMatches.length > 0 && (
        <>
          <div className="section-title">
            <span className="live-badge">●</span>
            EN VIVO
          </div>
          {liveMatches.map(m => (
            <MatchCard key={m.id} match={m} onSelect={onSelect} />
          ))}
        </>
      )}
      
      <div className="section-title">📅 Próximos partidos</div>
      {upcomingMatches.map(m => (
        <MatchCard key={m.id} match={m} onSelect={onSelect} />
      ))}
    </div>
  );
}

function MatchCard({ match, onSelect }: { match: Match; onSelect: (m: Match) => void }) {
  return (
    <div
      onClick={() => onSelect(match)}
      className={`match-card ${match.live ? 'match-card--live' : ''}`}
    >
      <div className="match-teams-row">
        <div className="match-team">
          <img src={getFlagImage(match.h, 28)} alt={match.h} className="match-flag" />
          <span className="match-team-name">{match.h}</span>
        </div>
        
        <div className="match-score-box">
          {match.live ? (
            <>
              <span className="match-score">{match.hS}</span>
              <span className="match-vs">-</span>
              <span className="match-score">{match.aS}</span>
            </>
          ) : (
            <span className="match-vs">VS</span>
          )}
        </div>
        
        <div className="match-team">
          <span className="match-team-name">{match.a}</span>
          <img src={getFlagImage(match.a, 28)} alt={match.a} className="match-flag" />
        </div>
      </div>
      
      <div className="match-info">
        {match.live ? (
          <span className="match-live-text">
            <span className="match-live-dot"></span>
            EN VIVO {match.min}'
          </span>
        ) : (
          <span className="match-date">{match.date} · {match.time}</span>
        )}
      </div>
    </div>
  );
}

// Step 2: Tipo de apuesta
function Step2({ onSelect }: { onSelect: (t: BetType) => void }) {
  return (
    <div className="bet-types-grid">
      {BET_TYPES.map(bt => (
        <div
          key={bt.id}
          onClick={() => onSelect(bt)}
          className="bet-type-card"
        >
          <div className="bet-type-icon">{bt.icon}</div>
          <div className="bet-type-name">{bt.label}</div>
          <div className="bet-type-desc">{bt.desc}</div>
          <div className="bet-type-odds">{bt.oddsRange}</div>
        </div>
      ))}
    </div>
  );
}

// Step 3: Predicción
function Step3({ 
  match, 
  type, 
  selPick, 
  onPick, 
  onContinue 
}: { 
  match: Match;
  type: BetType;
  selPick: string | null;
  onPick: (pick: string, odds: number) => void;
  onContinue: () => void;
}) {
  let content = null;

  if (type.id === 'result') {
    const odds = [1.85, 3.20, 4.50];
    const labels = [match.h, 'Empate', match.a];
    content = (
      <div className="prediction-grid prediction-grid--3">
        {labels.map((label, i) => (
          <button
            key={label}
            onClick={() => onPick(label, odds[i])}
            className={`prediction-btn ${selPick === label ? 'prediction-btn--selected' : ''}`}
          >
            <span className="prediction-label">{label}</span>
            <span className="prediction-odds">{odds[i].toFixed(2)}</span>
          </button>
        ))}
      </div>
    );
  } else if (type.id === 'score') {
    content = (
      <div className="prediction-grid prediction-grid--4">
        {SCORE_OPTIONS.map((score, i) => (
          <button
            key={score}
            onClick={() => onPick(score, SCORE_ODDS[i])}
            className={`prediction-btn ${selPick === score ? 'prediction-btn--selected' : ''}`}
          >
            <span className="prediction-label">{score}</span>
            <span className="prediction-odds">{SCORE_ODDS[i].toFixed(2)}</span>
          </button>
        ))}
      </div>
    );
  } else if (type.id === 'scorer') {
    const hScorers = SCORERS[match.h] || [];
    const aScorers = SCORERS[match.a] || [];
    content = (
      <div className="scorers-container">
        <div className="scorers-section">
          <div className="scorers-header">
            <img src={getFlagImage(match.h, 20)} alt={match.h} />
            <span>{match.h}</span>
          </div>
          {hScorers.map(s => {
            const [name, odds] = s.split('|');
            return (
              <button
                key={name}
                onClick={() => onPick(name, parseFloat(odds))}
                className={`scorer-item ${selPick === name ? 'scorer-item--selected' : ''}`}
              >
                <span className="scorer-name">⚽ {name}</span>
                <span className="scorer-odds">{parseFloat(odds).toFixed(2)}</span>
              </button>
            );
          })}
        </div>
        
        <div className="scorers-section">
          <div className="scorers-header">
            <img src={getFlagImage(match.a, 20)} alt={match.a} />
            <span>{match.a}</span>
          </div>
          {aScorers.map(s => {
            const [name, odds] = s.split('|');
            return (
              <button
                key={name}
                onClick={() => onPick(name, parseFloat(odds))}
                className={`scorer-item ${selPick === name ? 'scorer-item--selected' : ''}`}
              >
                <span className="scorer-name">⚽ {name}</span>
                <span className="scorer-odds">{parseFloat(odds).toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  } else {
    const options = [
      { label: 'Más de 2.5', odds: 1.85 },
      { label: 'Menos de 2.5', odds: 2.00 }
    ];
    content = (
      <div className="prediction-grid prediction-grid--2">
        {options.map(opt => (
          <button
            key={opt.label}
            onClick={() => onPick(opt.label, opt.odds)}
            className={`prediction-btn ${selPick === opt.label ? 'prediction-btn--selected' : ''}`}
          >
            <span className="prediction-label">{opt.label}</span>
            <span className="prediction-odds">{opt.odds.toFixed(2)}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="step-container">
      <div className="prediction-section-title">Selecciona tu predicción</div>
      {content}
      {selPick && (
        <button onClick={onContinue} className="continue-btn">
          Continuar
          <ChevronLeft size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
      )}
    </div>
  );
}

// Step 4: Confirmar
function Step4({
  match,
  type,
  pick,
  odds,
  amount,
  potential,
  onAmountChange,
  onConfirm,
}: {
  match: Match;
  type: BetType;
  pick: string;
  odds: number;
  amount: number;
  potential: string;
  onAmountChange: (a: number) => void;
  onConfirm: () => void;
}) {
  const presets = [10, 25, 50, 100, 250];

  return (
    <div className="step-container">
      {/* Summary Card */}
      <div className="summary-card">
        <div className="summary-match">
          <div className="summary-team">
            <img src={getFlagImage(match.h, 24)} alt={match.h} />
            <span>{match.h}</span>
          </div>
          <span className="summary-vs">VS</span>
          <div className="summary-team">
            <span>{match.a}</span>
            <img src={getFlagImage(match.a, 24)} alt={match.a} />
          </div>
        </div>
        
        <div className="summary-row">
          <span className="summary-label">Tipo</span>
          <span className="summary-value">{type.icon} {type.label}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Predicción</span>
          <span className="summary-value summary-value--highlight">{pick}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Cuota</span>
          <span className="summary-value summary-value--highlight">×{odds.toFixed(2)}</span>
        </div>
      </div>

      {/* Amount Selection */}
      <div className="amount-section">
        <div className="amount-title">Cantidad a apostar</div>
        
        <div className="amount-presets">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => onAmountChange(p)}
              className={`amount-preset ${amount === p ? 'amount-preset--selected' : ''}`}
            >
              {p}
            </button>
          ))}
        </div>
        
        <div className="amount-input-box">
          <span className="amount-input-label">Tu apuesta</span>
          <span className="amount-input-value">{amount} pts</span>
        </div>
        
        <input
          type="range"
          min="10"
          max="1000"
          step="10"
          value={amount}
          onChange={(e) => onAmountChange(parseInt(e.target.value))}
          className="amount-slider"
        />
      </div>

      {/* Potential Win */}
      <div className="potential-card">
        <div className="potential-label">Puntos potenciales</div>
        <div className="potential-value">{potential} pts</div>
        <div className="potential-formula">
          Cuota {odds.toFixed(2)} × {amount} pts
        </div>
      </div>

      {/* Confirm Button */}
      <button onClick={onConfirm} className="confirm-btn">
        <Zap size={20} />
        Confirmar Apuesta
      </button>
    </div>
  );
}

export default BetModal;
