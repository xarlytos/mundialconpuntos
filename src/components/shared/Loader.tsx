import { useEffect, useState } from 'react';

export const Loader = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0D0D0D] flex flex-col items-center justify-center font-['Outfit',system-ui,sans-serif] transition-opacity duration-400">
      <div className="w-14 h-14 rounded-xl bg-[#FFE600] flex items-center justify-center text-[28px] mb-3.5 animate-pulse">
        ⚽
      </div>
      <h1 className="text-xl font-extrabold text-white mb-1.5">App Mundial de Fútbol 2026</h1>
      <p className="text-sm text-gray-500">Loading / Cargando...</p>
      <div className="w-48 h-1 bg-[#1F1F1F] rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#FFE600] to-[#0047AB] rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
      </div>
    </div>
  );
};
