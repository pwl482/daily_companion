import React, { useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { BackupModal } from './BackupModal';
import { AppData } from '../../types';
import { Database, CalendarCheck, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ data, onUpdateData }) => {
  const [showBackupModal, setShowBackupModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-13 flex items-center justify-between gap-2">
          {/* Logo & Identity */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow shadow-blue-500/20 text-white font-black text-sm">
              <CalendarCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm tracking-tight text-white">AuraDaily</h1>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  PWA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[170px] sm:max-w-xs">
                Finances & Events
              </p>
            </div>
          </div>

          {/* Actions & PWA button */}
          <div className="flex items-center gap-1.5">
            <PWAInstallButton />
            
            <button
              onClick={() => setShowBackupModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 cursor-pointer"
              title="Backup & Restore Data"
            >
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline text-[11px]">Backup</span>
            </button>
          </div>
        </div>
      </header>

      {showBackupModal && (
        <BackupModal
          data={data}
          onUpdateData={onUpdateData}
          onClose={() => setShowBackupModal(false)}
        />
      )}
    </>
  );
};
