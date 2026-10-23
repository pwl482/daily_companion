import React, { useEffect, useState } from 'react';
import { AppData } from './types';
import { loadAppData, saveAppData } from './utils/storage';
import { Header } from './components/common/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { FinanceInputTab } from './components/finances/FinanceInputTab';
import { FinanceEvalTab } from './components/finances/FinanceEvalTab';
import { TodoBoardTab } from './components/todo/TodoBoardTab';
import { EventPlannerTab } from './components/events/EventPlannerTab';
import { EventCalendarTab } from './components/events/EventCalendarTab';
import { DollarSign, BarChart3, CalendarPlus, Calendar, CheckSquare } from 'lucide-react';

export type MainTab = 'finances_input' | 'finances_eval' | 'todo_board' | 'events_planner' | 'events_calendar';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<MainTab>('finances_input');

  // Sync state to LocalStorage
  const handleUpdateData = (newData: AppData) => {
    setData(newData);
    saveAppData(newData);
  };

  const activeTicketsCount = (data.tickets || []).filter((t) => t.swimlane !== 'done').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Top Application Header with PWA & Backup */}
      <Header
        data={data}
        onUpdateData={handleUpdateData}
        activeTab={activeTab}
      />

      {/* Desktop Main Navigation Tabs */}
      <nav className="hidden md:block bg-slate-900/60 border-b border-slate-800/80 sticky top-13 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex space-x-1 py-1.5">
            <button
              onClick={() => setActiveTab('finances_input')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'finances_input'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Payments Log & Forms</span>
            </button>

            <button
              onClick={() => setActiveTab('finances_eval')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'finances_eval'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Finance Analytics & Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('todo_board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer relative ${
                activeTab === 'todo_board'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tasks & Sprint Board</span>
              {activeTicketsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-200 border border-blue-400/30 font-mono">
                  {activeTicketsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('events_planner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'events_planner'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Event Planner & People</span>
            </button>

            <button
              onClick={() => setActiveTab('events_calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'events_calendar'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming Calendar</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            {activeTicketsCount} tasks • {data.events.length} events • {data.oneTimePayments.length + data.recurringPayments.length} flows
          </div>
        </div>
      </nav>

      {/* Main View Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-3 pb-20 md:pb-8">
        {activeTab === 'finances_input' && (
          <FinanceInputTab data={data} onUpdateData={handleUpdateData} />
        )}

        {activeTab === 'finances_eval' && (
          <FinanceEvalTab data={data} />
        )}

        {activeTab === 'todo_board' && (
          <TodoBoardTab data={data} onUpdateData={handleUpdateData} />
        )}

        {activeTab === 'events_planner' && (
          <EventPlannerTab
            data={data}
            onUpdateData={handleUpdateData}
            onNavigateToCalendar={() => setActiveTab('events_calendar')}
          />
        )}

        {activeTab === 'events_calendar' && (
          <EventCalendarTab
            data={data}
            onUpdateData={handleUpdateData}
            onOpenPlanner={() => setActiveTab('events_planner')}
          />
        )}
      </main>

      {/* Mobile Native Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          <button
            onClick={() => setActiveTab('finances_input')}
            className={`flex flex-col items-center justify-center py-1 transition select-none ${
              activeTab === 'finances_input' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className={`w-5 h-5 ${activeTab === 'finances_input' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('finances_eval')}
            className={`flex flex-col items-center justify-center py-1 transition select-none ${
              activeTab === 'finances_eval' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'finances_eval' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('todo_board')}
            className={`flex flex-col items-center justify-center py-1 transition select-none relative ${
              activeTab === 'todo_board' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <CheckSquare className={`w-5 h-5 ${activeTab === 'todo_board' ? 'stroke-[2.5]' : ''}`} />
              {activeTicketsCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 bg-blue-600 text-[9px] text-white font-bold rounded-full flex items-center justify-center">
                  {activeTicketsCount > 9 ? '9+' : activeTicketsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-1">Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('events_planner')}
            className={`flex flex-col items-center justify-center py-1 transition select-none ${
              activeTab === 'events_planner' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarPlus className={`w-5 h-5 ${activeTab === 'events_planner' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Planner</span>
          </button>

          <button
            onClick={() => setActiveTab('events_calendar')}
            className={`flex flex-col items-center justify-center py-1 transition select-none ${
              activeTab === 'events_calendar' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'events_calendar' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-bold mt-1">Calendar</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
