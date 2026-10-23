import React, { useRef, useState } from 'react';
import { AppData } from '../../types';
import { exportDataAsJson, importDataFromJson, EMPTY_APP_DATA } from '../../utils/storage';
import { Download, Upload, Trash2, X, Check, AlertCircle } from 'lucide-react';

interface BackupModalProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ data, onUpdateData, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = () => {
    try {
      exportDataAsJson(data);
      setSuccessMsg('Backup file downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg('Failed to export backup file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importDataFromJson(text);
        onUpdateData(imported);
        setSuccessMsg('Data imported successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || 'Invalid backup file format');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all your data? This action cannot be undone unless you have an exported backup.')) {
      onUpdateData(EMPTY_APP_DATA);
      setSuccessMsg('All local data cleared!');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-4 sm:p-5 text-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white">Data Management & Backup</h3>
            <p className="text-[11px] text-slate-400">Export or import your offline JSON backup</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg && (
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Export to JSON */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Export to JSON</p>
              <p className="text-[10px] text-slate-400">Save payments, events & people</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Import from JSON */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Import from JSON</p>
              <p className="text-[10px] text-slate-400">Restore from an exported backup</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          {/* Clear Data */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-300">Clear All Local Data</p>
              <p className="text-[10px] text-slate-500">Wipe all payments, events & people</p>
            </div>
            <button
              onClick={handleClearData}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-800 hover:bg-rose-950/50 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
