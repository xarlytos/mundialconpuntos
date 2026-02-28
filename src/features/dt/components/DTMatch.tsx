import { useState, useEffect, useCallback } from "react";
import { useDTStore } from "../store/dtStore";
import {
  Pause,
  Play,
  FastForward,
  Zap,
  Shield,
  Target,
  Users,
} from "lucide-react";
import { getNationInfo } from "../data/players";
import { DTPageLayout } from "./DTPageLayout";
import { DTHome } from "./DTHome";

const SIMULATION_SPEEDS = [
  { id: "slow", name: "1x", icon: Play, delay: 1500 },
  { id: "fast", name: "2x", icon: FastForward, delay: 800 },
  { id: "super", name: "4x", icon: Zap, delay: 400 },
];

const DECISIONS = [
  {
    id: "attack",
    text: "Atacar",
    icon: Zap,
    color: "from-red-500 to-orange-500",
    effect: { attack: 0.25, defense: -0.15, possession: 60 },
  },
  {
    id: "balanced",
    text: "Equilibrado",
    icon: Target,
    color: "from-[#FFE600] to-[#0047AB]",
    effect: { attack: 0, defense: 0, possession: 50 },
  },
  {
    id: "defend",
    text: "Defender",
    icon: Shield,
    color: "from-[#FFE600] to-[#0047AB]",
    effect: { attack: -0.2, defense: 0.25, possession: 40 },
  },
  {
    id: "sub",
    text: "Cambio",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    effect: { attack: 0, defense: 0, possession: 50 },
  },
];

// Multiplicador por momento del partido (MENOS EXTREMO)
const getTimeMultiplier = (minute: number): number => {
  if (minute <= 15) return 0.9; // Inicio cauteloso
  if (minute <= 45) return 1.0; // Primera parte normal
  if (minute <= 60) return 1.1; // Arranque segunda parte
  if (minute <= 75) return 1.15; // Partido abierto
  return 1.25; // Final loco (no tan loco)
};

// Factor psicológico según marcador (MENOS EXTREMO)
const getScoreFactor = (
  myGoals: number,
  oppGoals: number,
  isAttacking: boolean,
): number => {
  const diff = myGoals - oppGoals;

  if (diff === 0) return 1.0; // Empate
  if (diff === 1) return isAttacking ? 0.85 : 1.15; // Ganando 1-0
  if (diff >= 2) return isAttacking ? 0.75 : 1.25; // Ganando cómodo
  if (diff === -1) return isAttacking ? 1.15 : 0.85; // Perdiendo 1
  return isAttacking ? 1.25 : 0.75; // Perdiendo feo
};

export function DTMatch() {
  const { currentCareer, setView, finishMatch } = useDTStore();
  const [minute, setMinute] = useState(0);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [speed, setSpeed] = useState("fast");
  const [isPaused, setIsPaused] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [events, setEvents] = useState<
    Array<{
      minute: number;
      text: string;
      type: "goal" | "card" | "normal";
      playerId?: string;
      playerName?: string;
    }>
  >([]);
  const [matchFinished, setMatchFinished] = useState(false);
  const [possession, setPossession] = useState(50);
  const [decisionsMade, setDecisionsMade] = useState<number[]>([]);
  const [goalPopup, setGoalPopup] = useState<{
    show: boolean;
    playerName: string;
    minute: number;
    isUserGoal: boolean;
  } | null>(null);
  const [currentTactic, setCurrentTactic] = useState("balanced");
  const [lastGoalMinute, setLastGoalMinute] = useState(-10); // Para cooldown
  const [attackBoost, setAttackBoost] = useState(0); // Bonus acumulativo si no marcas

  const currentMatch = currentCareer?.currentMatch;
  const isUserHome = currentMatch?.homeNationId === currentCareer?.nationId;
  const opponentId = isUserHome
    ? currentMatch?.awayNationId
    : currentMatch?.homeNationId;
  const opponentInfo = opponentId ? getNationInfo(opponentId) : null;
  const opponent = opponentInfo?.nation || { name: "Oponente", flag: "🏳️" };
  const userNation = getNationInfo(currentCareer?.nationId || "")?.nation;
  const userSquad = currentCareer?.squad || [];
  const userStarters = currentCareer?.starters || [];

  // Jugadores titulares
  const startingPlayers = userSquad.filter((p) => userStarters.includes(p.id));

  // Calcular media de overall de los titulares del usuario (0-100)
  const userTeamStrength =
    startingPlayers.length > 0
      ? startingPlayers.reduce((sum, p) => sum + p.overall, 0) /
        startingPlayers.length
      : 75; // Valor por defecto si no hay titulares

  // Fuerza del rival (basada en su selección, 0-100)
  const opponentStrength = opponentInfo?.nation.strength || 75;

  // Función para obtener goleador de jugadores titulares
  const getScorer = useCallback(
    (isUserTeam: boolean): { name: string; id: string } => {
      if (isUserTeam && startingPlayers.length > 0) {
        // Probabilidades por posición (FWD > MID > DEF > GK)
        const weights = startingPlayers.map((p) => {
          if (p.position === "FWD") return 3;
          if (p.position === "MID") return 2;
          if (p.position === "DEF") return 0.5;
          return 0.1; // GK casi imposible
        });

        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < startingPlayers.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            return { name: startingPlayers[i].name, id: startingPlayers[i].id };
          }
        }
        return { name: startingPlayers[0].name, id: startingPlayers[0].id };
      }
      // Rival - nombre aleatorio
      const rivalNames = [
        "Gómez",
        "Rodríguez",
        "Silva",
        "Martínez",
        "López",
        "Fernández",
        "Pérez",
        "González",
      ];
      return {
        name: rivalNames[Math.floor(Math.random() * rivalNames.length)],
        id: "",
      };
    },
    [startingPlayers],
  );

  // Función para obtener jugador que recibe tarjeta
  const getCardPlayer = useCallback(
    (isUserTeam: boolean): { name: string; id: string } => {
      if (isUserTeam && startingPlayers.length > 0) {
        // Defensas y mediocampistas más propensos a tarjetas
        const candidates =
          startingPlayers.filter((p) => p.position !== "FWD") ||
          startingPlayers;
        const player =
          candidates[Math.floor(Math.random() * candidates.length)];
        return { name: player.name, id: player.id };
      }
      const rivalNames = ["Gómez", "Rodríguez", "Silva", "Martínez", "López"];
      return {
        name: rivalNames[Math.floor(Math.random() * rivalNames.length)],
        id: "",
      };
    },
    [startingPlayers],
  );

  const addEvent = useCallback(
    (
      text: string,
      type: "goal" | "card" | "normal" = "normal",
      playerId?: string,
      playerName?: string,
    ) => {
      setEvents((prev) => [
        ...prev,
        { minute, text, type, playerId, playerName },
      ]);
    },
    [minute],
  );

  // Simulación del partido
  useEffect(() => {
    if (matchFinished || isPaused || showDecision) return;
    const speedConfig = SIMULATION_SPEEDS.find((s) => s.id === speed);
    if (!speedConfig) return;

    const interval = setInterval(() => {
      setMinute((m) => {
        if (m >= 90) {
          setMatchFinished(true);
          return 90;
        }
        return m + 1;
      });

      // Posesión varía según táctica y aleatorio
      const basePossession =
        DECISIONS.find((d) => d.id === currentTactic)?.effect.possession || 50;
      setPossession(basePossession + Math.floor(Math.random() * 10) - 5);
    }, speedConfig.delay);

    return () => clearInterval(interval);
  }, [speed, isPaused, showDecision, matchFinished, currentTactic]);

  // Lógica de goles y eventos - SISTEMA REALISTA CORREGIDO
  useEffect(() => {
    if (matchFinished || isPaused || showDecision) return;

    // COOLDOWN: Mínimo 7 minutos entre goles (más realista)
    if (minute - lastGoalMinute < 7) return;

    const myGoals = isUserHome ? score.home : score.away;
    const oppGoals = isUserHome ? score.away : score.home;

    // Calcular probabilidades CONSERVADORAS
    const timeMult = getTimeMultiplier(minute);
    const tacticEffect =
      DECISIONS.find((d) => d.id === currentTactic)?.effect.attack || 0;
    const scoreFactorMy = getScoreFactor(myGoals, oppGoals, true);
    const scoreFactorOpp = getScoreFactor(oppGoals, myGoals, true);

    // Base: 1.0% por minuto (aumentado para más goles)
    const baseProb = 0.01;

    // FACTOR DE FUERZA: comparar la plantilla del usuario vs la del rival
    // Diferencia de fuerza: positivo = usuario más fuerte, negativo = rival más fuerte
    const strengthDiff = userTeamStrength - opponentStrength;

    // Convertir diferencia en multiplicador (cada 10 puntos de diferencia = ~25% de ventaja)
    // Ejemplo: Si usuario tiene 87 y rival 71, diff=16, factor=1.40 (40% más de probabilidad)
    const userStrengthFactor = 1 + (strengthDiff / 100) * 2.5;
    const opponentStrengthFactor = 1 - (strengthDiff / 100) * 2.5;

    // La táctica afecta más si tienes mejor equipo
    // Si atacas con equipazo, marcas mucho más
    // Si defiendes con equipazo, te marcan mucho menos
    const tacticMultiplier = 1 + strengthDiff / 200; // Mejor equipo = táctica más efectiva

    // Probabilidad de gol del usuario (máximo 15%)
    let myGoalProb =
      baseProb *
      timeMult *
      (1 + tacticEffect * tacticMultiplier) *
      scoreFactorMy *
      userStrengthFactor;
    myGoalProb = Math.min(Math.max(myGoalProb, 0.005), 0.15); // Entre 0.5% y 15%

    // Probabilidad de gol del rival
    const defenseEffect =
      DECISIONS.find((d) => d.id === currentTactic)?.effect.defense || 0;
    // Si defiendes bien y tienes mejor equipo, el rival tiene mucha menos probabilidad
    const opponentTacticMultiplier = 1 - strengthDiff / 200; // Peor equipo = táctica menos efectiva
    let oppGoalProb =
      baseProb *
      timeMult *
      (1 - defenseEffect * opponentTacticMultiplier) *
      scoreFactorOpp *
      opponentStrengthFactor;
    oppGoalProb = Math.min(Math.max(oppGoalProb, 0.002), 0.12); // Entre 0.2% y 12%

    // Solo puede haber UN gol en este minuto
    const random = Math.random();
    const totalProb = myGoalProb + oppGoalProb;

    // Si hay gol (probabilidad combinada)
    if (random < totalProb) {
      // Decidir QUIÉN marca proporcionalmente
      const whoScores = Math.random();
      const myChance = myGoalProb / totalProb;

      if (whoScores < myChance) {
        // Gol del usuario
        if (isUserHome) {
          setScore((s) => ({ ...s, home: s.home + 1 }));
        } else {
          setScore((s) => ({ ...s, away: s.away + 1 }));
        }

        const scorer = getScorer(true);
        setGoalPopup({
          show: true,
          playerName: scorer.name,
          minute,
          isUserGoal: true,
        });
        addEvent(`⚽ ¡GOL! ${scorer.name}`, "goal", scorer.id, scorer.name);
        setLastGoalMinute(minute);
        setAttackBoost(0);
        setIsPaused(true);

        setTimeout(() => {
          setGoalPopup(null);
          setIsPaused(false);
        }, 3000);
      } else {
        // Gol del rival
        if (isUserHome) {
          setScore((s) => ({ ...s, away: s.away + 1 }));
        } else {
          setScore((s) => ({ ...s, home: s.home + 1 }));
        }

        const scorer = getScorer(false);
        setGoalPopup({
          show: true,
          playerName: scorer.name,
          minute,
          isUserGoal: false,
        });
        addEvent(`⚽ Gol rival: ${scorer.name}`, "goal");
        setLastGoalMinute(minute);
        setAttackBoost((prev) => Math.min(prev + 1, 5));
        setIsPaused(true);

        setTimeout(() => {
          setGoalPopup(null);
          setIsPaused(false);
        }, 3000);
      }
    } else {
      // No hay gol, aumenta acumulativo lentamente
      setAttackBoost((prev) => Math.min(prev + 0.3, 5));
    }

    // TARJETAS (muy raro, 0.5% por minuto = ~1 tarjeta cada 2 partidos)
    if (Math.random() < 0.005 && minute > 15) {
      const isUserCard = Math.random() > 0.5;
      const cardType = Math.random() < 0.8 ? "🟨" : "🟥";
      const cardPlayer = getCardPlayer(isUserCard);

      if (isUserCard) {
        addEvent(
          `${cardType} Tarjeta: ${cardPlayer.name}`,
          "card",
          cardPlayer.id,
          cardPlayer.name,
        );
      } else {
        addEvent(`${cardType} Tarjeta rival`, "card");
      }
    }

    // Decisiones tácticas en minutos clave
    if ([25, 45, 65, 80].includes(minute) && !decisionsMade.includes(minute)) {
      setShowDecision(true);
      setIsPaused(true);
    }
  }, [
    minute,
    matchFinished,
    isPaused,
    showDecision,
    isUserHome,
    score,
    currentTactic,
    lastGoalMinute,
    attackBoost,
    getScorer,
    getCardPlayer,
    addEvent,
    decisionsMade,
  ]);

  const handleDecision = (decisionId: string) => {
    setShowDecision(false);
    setIsPaused(false);
    setDecisionsMade((prev) => [...prev, minute]);
    setCurrentTactic(decisionId);

    const effectText = {
      attack: "⚡ Modo ataque activado",
      balanced: "⚖️ Equilibrio táctico",
      defend: "🛡️ Bloque defensivo",
      sub: "🔄 Cambio realizado",
    };
    addEvent(effectText[decisionId as keyof typeof effectText], "normal");
  };

  const handleFinishMatch = () => {
    const matchEvents = events.map((e) => ({
      minute: e.minute,
      type: (e.type === "goal"
        ? "goal"
        : e.type === "card"
          ? "yellow"
          : "normal") as "goal" | "yellow" | "red" | "sub" | "injury",
      playerId: e.playerId || "",
      teamId: "",
      description: e.text,
    }));
    finishMatch(score.home, score.away, matchEvents);
    setView("match-result");
  };

  if (!currentCareer) return null;

  // Redirigir automáticamente si no hay partido después de 2 segundos
  useEffect(() => {
    if (!currentCareer.currentMatch) {
      const timer = setTimeout(() => {
        setView("home");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentCareer, setView]);

  // Si no hay partido cargado, renderizar Home en su lugar
  if (!currentCareer.currentMatch) {
    // Importar y renderizar DTHome directamente
    return <DTHome />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1a1a24] to-[#0047AB]/20 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#0047AB]/10 rounded-full blur-[120px]" />
      </div>

      <DTPageLayout title="Partido en Vivo" showBack={false}>
        {/* Score Board */}
        <div className="px-6 mt-4">
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] rounded-3xl p-6 border border-[#2a2a3a]">
            {/* Timer */}
            <div className="flex justify-center mb-6">
              <div
                className={`px-4 py-2 rounded-full font-black text-lg ${
                  minute >= 90
                    ? "bg-red-500/20 text-red-400"
                    : "bg-[#FFE600]/20 text-[#FFE600]"
                }`}
              >
                {minute >= 90 ? "FINAL" : `${minute}'`}
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#FFE600] to-[#0047AB] flex items-center justify-center text-3xl mb-2 shadow-lg shadow-[#0047AB]/20">
                  {userNation?.flag || "🏳️"}
                </div>
                <span className="text-white font-bold text-sm">
                  {userNation?.name || "Tú"}
                </span>
              </div>

              <div className="flex flex-col items-center px-6">
                <div className="text-5xl font-black text-white">
                  {isUserHome
                    ? `${score.home} - ${score.away}`
                    : `${score.away} - ${score.home}`}
                </div>
                <div className="text-gray-500 text-xs mt-1 font-bold uppercase tracking-wider">
                  {possession}% posesión
                </div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a1a24] to-[#12121a] flex items-center justify-center text-3xl mb-2 border border-[#2a2a3a]">
                  {opponent.flag}
                </div>
                <span className="text-gray-400 font-bold text-sm text-center">
                  {opponent.name}
                </span>
              </div>
            </div>

            {/* Tactic indicator */}
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-gradient-to-br from-[#1a1a24] to-[#12121a] rounded-full text-xs font-bold text-gray-400 uppercase tracking-wider border border-[#2a2a3a]">
                Táctica: {DECISIONS.find((d) => d.id === currentTactic)?.text}
              </span>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="px-6 mt-4">
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] rounded-2xl p-4 border border-[#2a2a3a] h-32 overflow-hidden">
            {events.length === 0 ? (
              <p className="text-gray-600 text-center text-sm h-full flex items-center justify-center font-medium">
                El partido está por comenzar...
              </p>
            ) : (
              <div className="space-y-2">
                {events.slice(-4).map((event, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 text-sm ${
                      event.type === "goal"
                        ? "text-[#FFE600]"
                        : event.type === "card"
                          ? "text-yellow-400"
                          : "text-gray-400"
                    }`}
                  >
                    <span className="font-black text-gray-600 min-w-[28px]">
                      {event.minute}'
                    </span>
                    <span className="font-medium">{event.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Speed Controls */}
        {!matchFinished && (
          <div className="px-6 mt-4">
            <div className="flex gap-2 bg-gradient-to-br from-[#1a1a24] to-[#12121a] p-1.5 rounded-2xl border border-[#2a2a3a]">
              {SIMULATION_SPEEDS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSpeed(s.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                      speed === s.id
                        ? "bg-gradient-to-r from-[#FFE600] to-[#0047AB] text-white"
                        : "text-gray-500 hover:text-white"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                    <span className="text-sm">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Play/Pause */}
        {!matchFinished && !showDecision && (
          <div className="px-6 mt-4 mb-6">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all uppercase tracking-wider ${
                isPaused
                  ? "bg-gradient-to-r from-[#FFE600] to-[#0047AB] text-white"
                  : "bg-gradient-to-br from-[#1a1a24] to-[#12121a] text-white border border-[#2a2a3a]"
              }`}
            >
              {isPaused ? (
                <Play size={24} fill="currentColor" />
              ) : (
                <Pause size={24} />
              )}
              {isPaused ? "Reanudar" : "Pausar"}
            </button>
          </div>
        )}

        {/* Decision Modal */}
        {showDecision && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-50">
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] rounded-3xl p-6 border border-[#2a2a3a] w-full max-w-md">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-1.5 bg-[#FFE600]/20 text-[#FFE600] rounded-full text-xs font-black uppercase tracking-widest mb-3">
                  Minuto {minute}'
                </div>
                <h3 className="text-white text-xl font-black">
                  Toma una decisión
                </h3>
                <p className="text-gray-500 text-sm mt-2">
                  {score.home === score.away
                    ? "Partido empatado"
                    : score.home > score.away
                      ? "Vas ganando"
                      : "Vas perdiendo"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DECISIONS.map((decision) => {
                  const Icon = decision.icon;
                  return (
                    <button
                      key={decision.id}
                      onClick={() => handleDecision(decision.id)}
                      className={`p-4 rounded-2xl bg-gradient-to-br ${decision.color} text-white font-bold active:scale-95 transition-all border border-white/20`}
                    >
                      <Icon
                        size={24}
                        className="mx-auto mb-2"
                        strokeWidth={2.5}
                      />
                      <div className="text-sm">{decision.text}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Goal Popup */}
        {goalPopup?.show && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] rounded-3xl p-8 border-2 border-[#FFE600]/50 w-full max-w-sm text-center transform scale-110">
              <div className="text-6xl mb-4">⚽</div>

              <h2 className="text-4xl font-black text-[#FFE600] mb-2">¡GOL!</h2>

              <div className="bg-[#FFE600]/10 rounded-2xl p-4 mb-4 border border-[#FFE600]/30">
                <div className="text-2xl font-bold text-white mb-1">
                  {goalPopup.playerName}
                </div>
                <div className="text-[#FFE600] font-black text-lg">
                  Minuto {goalPopup.minute}'
                </div>
              </div>

              <div
                className={`text-xl font-black ${goalPopup.isUserGoal ? "text-[#FFE600]" : "text-red-400"}`}
              >
                {goalPopup.isUserGoal
                  ? "🎉 ¡GOL DE TU EQUIPO!"
                  : "⚠️ GOL RIVAL"}
              </div>
            </div>
          </div>
        )}

        {/* Match Finished */}
        {matchFinished && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-50">
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] rounded-3xl p-8 border border-[#2a2a3a] w-full max-w-md text-center">
              <div className="text-6xl mb-4">
                {isUserHome
                  ? score.home > score.away
                    ? "🏆"
                    : score.home === score.away
                      ? "🤝"
                      : "😔"
                  : score.away > score.home
                    ? "🏆"
                    : score.away === score.away
                      ? "🤝"
                      : "😔"}
              </div>

              <h2 className="text-3xl font-black text-white mb-2">
                {isUserHome
                  ? score.home > score.away
                    ? "¡VICTORIA!"
                    : score.home === score.away
                      ? "EMPATE"
                      : "DERROTA"
                  : score.away > score.home
                    ? "¡VICTORIA!"
                    : score.away === score.home
                      ? "EMPATE"
                      : "DERROTA"}
              </h2>

              <div className="text-5xl font-black text-[#FFE600] mb-6">
                {isUserHome
                  ? `${score.home} - ${score.away}`
                  : `${score.away} - ${score.home}`}
              </div>

              <div className="bg-gradient-to-br from-[#1a1a24] to-[#12121a] rounded-2xl p-4 mb-6 space-y-2 border border-[#2a2a3a]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Posesión</span>
                  <span className="text-white font-bold">{possession}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Eventos</span>
                  <span className="text-white font-bold">{events.length}</span>
                </div>
              </div>

              <button
                onClick={handleFinishMatch}
                className="w-full py-4 bg-gradient-to-r from-[#FFE600] to-[#0047AB] text-white font-black text-lg rounded-2xl uppercase tracking-wider"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </DTPageLayout>
    </div>
  );
}
