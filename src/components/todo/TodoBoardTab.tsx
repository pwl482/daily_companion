import React, { useState, useMemo } from 'react';
import { AppData, Ticket, TicketPriority, TicketSwimlane } from '../../types';
import { formatDisplayDate, getTodayDateString } from '../../utils/dateUtils';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Tag as TagIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Flame,
  Check,
  X,
  RotateCcw,
  Layers,
  Search,
} from 'lucide-react';

interface TodoBoardTabProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
}

const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-500/50',
    icon: '🔥',
  },
  high: {
    label: 'High',
    bg: 'bg-amber-950/60',
    text: 'text-amber-400',
    border: 'border-amber-500/50',
    icon: '⚡',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-blue-950/60',
    text: 'text-blue-400',
    border: 'border-blue-500/40',
    icon: '◆',
  },
  low: {
    label: 'Low',
    bg: 'bg-slate-900',
    text: 'text-slate-400',
    border: 'border-slate-800',
    icon: '◇',
  },
};

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const SUGGESTED_TAGS = ['Work', 'Finance', 'Personal', 'Bug', 'Feature', 'Urgent', 'Admin'];

export const TodoBoardTab: React.FC<TodoBoardTabProps> = ({ data, onUpdateData }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileLaneTab, setMobileLaneTab] = useState<TicketSwimlane | 'all'>('all');
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [showClearArchiveConfirm, setShowClearArchiveConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [swimlane, setSwimlane] = useState<TicketSwimlane>('todo');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const todayStr = getTodayDateString();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open modal for new ticket
  const openNewTicketModal = (initialLane: TicketSwimlane = 'todo') => {
    setEditingTicket(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setSwimlane(initialLane);
    setDueDate('');
    setTagsInput('');
    setSelectedTags([]);
    setFormError(null);
    setShowCreateModal(true);
  };

  // Open modal for editing ticket
  const openEditTicketModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setTitle(ticket.title);
    setDescription(ticket.description || '');
    setPriority(ticket.priority);
    setSwimlane(ticket.swimlane);
    setDueDate(ticket.dueDate || '');
    setTagsInput('');
    setSelectedTags(ticket.tags || []);
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().replace(/^#/, '');
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setTagsInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagToRemove));
  };

  // Save ticket (create or edit)
  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter a ticket title.');
      return;
    }
    setFormError(null);

    if (tagsInput.trim()) {
      handleAddTag(tagsInput);
    }

    const currentTickets = data.tickets || [];

    if (editingTicket) {
      const updated: Ticket = {
        ...editingTicket,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        swimlane,
        dueDate: dueDate || undefined,
        tags: selectedTags,
        completedAt: swimlane === 'done' ? (editingTicket.completedAt || new Date().toISOString()) : undefined,
      };

      onUpdateData({
        ...data,
        tickets: currentTickets.map((t) => (t.id === editingTicket.id ? updated : t)),
      });
      showToast('Ticket updated!');
    } else {
      const newTicket: Ticket = {
        id: `ticket-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        swimlane,
        dueDate: dueDate || undefined,
        tags: selectedTags,
        createdAt: new Date().toISOString(),
        completedAt: swimlane === 'done' ? new Date().toISOString() : undefined,
      };

      onUpdateData({
        ...data,
        tickets: [...currentTickets, newTicket],
      });
      showToast('Ticket created!');
    }

    setShowCreateModal(false);
  };

  // Mark ticket as completed -> moves to 'done' archive
  const handleCompleteTicket = (ticketId: string) => {
    const currentTickets = data.tickets || [];
    onUpdateData({
      ...data,
      tickets: currentTickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            swimlane: 'done',
            completedAt: new Date().toISOString(),
          };
        }
        return t;
      }),
    });
    showToast('Completed & moved to Archive!');
  };

  // Reopen ticket from archive
  const handleReopenTicket = (ticketId: string) => {
    const currentTickets = data.tickets || [];
    onUpdateData({
      ...data,
      tickets: currentTickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            swimlane: 'todo',
            completedAt: undefined,
          };
        }
        return t;
      }),
    });
    showToast('Reopened ticket to ToDo lane!');
  };

  // Move ticket to specific swimlane
  const handleMoveLane = (ticketId: string, targetLane: TicketSwimlane) => {
    const currentTickets = data.tickets || [];
    onUpdateData({
      ...data,
      tickets: currentTickets.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            swimlane: targetLane,
            completedAt: targetLane === 'done' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      }),
    });
  };

  // Delete ticket
  const handleDeleteTicket = (ticket: Ticket) => {
    setTicketToDelete(ticket);
  };

  const confirmDeleteTicket = () => {
    if (!ticketToDelete) return;
    const currentTickets = data.tickets || [];
    onUpdateData({
      ...data,
      tickets: currentTickets.filter((t) => t.id !== ticketToDelete.id),
    });
    setTicketToDelete(null);
    showToast('Ticket deleted');
  };

  // Clear entire archive
  const handleClearArchive = () => {
    setShowClearArchiveConfirm(true);
  };

  const confirmClearArchive = () => {
    const currentTickets = data.tickets || [];
    onUpdateData({
      ...data,
      tickets: currentTickets.filter((t) => t.swimlane !== 'done'),
    });
    setShowClearArchiveConfirm(false);
    showToast('Archive cleared!');
  };

  // Ranking function: Due date first, then priority
  const sortTickets = (a: Ticket, b: Ticket): number => {
    // 1. Due date first
    if (a.dueDate && b.dueDate) {
      if (a.dueDate !== b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
    } else if (a.dueDate && !b.dueDate) {
      return -1; // a has due date, comes first
    } else if (!a.dueDate && b.dueDate) {
      return 1; // b has due date, comes first
    }

    // 2. Priority next
    const pA = PRIORITY_ORDER[a.priority];
    const pB = PRIORITY_ORDER[b.priority];
    if (pA !== pB) {
      return pA - pB;
    }

    // 3. Fallback createdAt newest first
    return b.createdAt.localeCompare(a.createdAt);
  };

  // Filtered tickets
  const allTickets = data.tickets || [];

  const allAvailableTags = useMemo(() => {
    const set = new Set<string>();
    allTickets.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [allTickets]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (tagFilter !== 'all' && !t.tags.includes(tagFilter)) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchDesc = t.description?.toLowerCase().includes(query);
        const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }
      return true;
    });
  }, [allTickets, tagFilter, priorityFilter, searchQuery]);

  // Group into swimlanes
  const todoTickets = useMemo(() => {
    return filteredTickets.filter((t) => t.swimlane === 'todo').sort(sortTickets);
  }, [filteredTickets]);

  const inProgressTickets = useMemo(() => {
    return filteredTickets.filter((t) => t.swimlane === 'in_progress').sort(sortTickets);
  }, [filteredTickets]);

  const blockedTickets = useMemo(() => {
    return filteredTickets.filter((t) => t.swimlane === 'blocked').sort(sortTickets);
  }, [filteredTickets]);

  const doneTickets = useMemo(() => {
    return filteredTickets
      .filter((t) => t.swimlane === 'done')
      .sort((a, b) => (b.completedAt || b.createdAt).localeCompare(a.completedAt || a.createdAt));
  }, [filteredTickets]);

  const totalActive = todoTickets.length + inProgressTickets.length + blockedTickets.length;

  return (
    <div className="space-y-4 pb-12 text-slate-100">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg shadow-xl animate-bounce">
          <Check className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-white">Sprint & Task Board</h2>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/30">
              {totalActive} active • {doneTickets.length} done
            </span>
          </div>

          <button
            onClick={() => openNewTicketModal('todo')}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ticket</span>
          </button>
        </div>

        {/* Filter & Search Bar - Compact */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[200px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[130px] max-w-[200px]">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-6 pr-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Tag Filter */}
            {allAvailableTags.length > 0 && (
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 focus:outline-none"
              >
                <option value="all">All Tags</option>
                {allAvailableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            )}

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Ranking Rule indicator */}
          <span className="text-[10px] text-slate-400 font-medium">
            Sorted: <strong className="text-slate-300">Due date</strong> → <strong className="text-slate-300">Priority</strong>
          </span>
        </div>
      </div>

      {/* Mobile Swimlane Switcher Tabs */}
      <div className="flex md:hidden bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => setMobileLaneTab('all')}
          className={`flex-1 py-1 rounded text-[11px] font-bold transition ${
            mobileLaneTab === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          All Lanes
        </button>
        <button
          onClick={() => setMobileLaneTab('todo')}
          className={`flex-1 py-1 rounded text-[11px] font-bold transition ${
            mobileLaneTab === 'todo' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          To Do ({todoTickets.length})
        </button>
        <button
          onClick={() => setMobileLaneTab('in_progress')}
          className={`flex-1 py-1 rounded text-[11px] font-bold transition ${
            mobileLaneTab === 'in_progress' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          In Progress ({inProgressTickets.length})
        </button>
        <button
          onClick={() => setMobileLaneTab('blocked')}
          className={`flex-1 py-1 rounded text-[11px] font-bold transition ${
            mobileLaneTab === 'blocked' ? 'bg-blue-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          Blocked ({blockedTickets.length})
        </button>
      </div>

      {/* 3 Active Swimlanes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* --- SWIMLANE 1: TO DO --- */}
        {(mobileLaneTab === 'all' || mobileLaneTab === 'todo') && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">To Do</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                  {todoTickets.length}
                </span>
              </div>
              <button
                onClick={() => openNewTicketModal('todo')}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
                title="Add ticket to To Do"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 flex-1 min-h-[120px]">
              {todoTickets.length === 0 ? (
                <div className="h-full min-h-[100px] flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 rounded-lg text-slate-500 text-[11px]">
                  <span>No tickets in To Do</span>
                </div>
              ) : (
                todoTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    todayStr={todayStr}
                    onComplete={() => handleCompleteTicket(ticket.id)}
                    onEdit={() => openEditTicketModal(ticket)}
                    onDelete={() => handleDeleteTicket(ticket)}
                    onMove={(lane) => handleMoveLane(ticket.id, lane)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* --- SWIMLANE 2: IN PROGRESS --- */}
        {(mobileLaneTab === 'all' || mobileLaneTab === 'in_progress') && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">In Progress</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-500/30 font-bold">
                  {inProgressTickets.length}
                </span>
              </div>
              <button
                onClick={() => openNewTicketModal('in_progress')}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
                title="Add ticket to In Progress"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 flex-1 min-h-[120px]">
              {inProgressTickets.length === 0 ? (
                <div className="h-full min-h-[100px] flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 rounded-lg text-slate-500 text-[11px]">
                  <span>No tickets in Progress</span>
                </div>
              ) : (
                inProgressTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    todayStr={todayStr}
                    onComplete={() => handleCompleteTicket(ticket.id)}
                    onEdit={() => openEditTicketModal(ticket)}
                    onDelete={() => handleDeleteTicket(ticket)}
                    onMove={(lane) => handleMoveLane(ticket.id, lane)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* --- SWIMLANE 3: BLOCKED --- */}
        {(mobileLaneTab === 'all' || mobileLaneTab === 'blocked') && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Blocked</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                  {blockedTickets.length}
                </span>
              </div>
              <button
                onClick={() => openNewTicketModal('blocked')}
                className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
                title="Add ticket to Blocked"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 flex-1 min-h-[120px]">
              {blockedTickets.length === 0 ? (
                <div className="h-full min-h-[100px] flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 rounded-lg text-slate-500 text-[11px]">
                  <span>No blocked tickets</span>
                </div>
              ) : (
                blockedTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    todayStr={todayStr}
                    onComplete={() => handleCompleteTicket(ticket.id)}
                    onEdit={() => openEditTicketModal(ticket)}
                    onDelete={() => handleDeleteTicket(ticket)}
                    onMove={(lane) => handleMoveLane(ticket.id, lane)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- COLLAPSED ARCHIVE SWIMLANE --- */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="w-full p-3 flex items-center justify-between bg-slate-900/50 hover:bg-slate-800/30 transition select-none">
          <button
            type="button"
            onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
            className="flex-1 flex items-center gap-2 text-left cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Completed Archive
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
              {doneTickets.length}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              (Checked off tickets are removed from active lanes and archived here)
            </span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {doneTickets.length > 0 && isArchiveExpanded && (
              <button
                type="button"
                onClick={handleClearArchive}
                className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 mr-1 cursor-pointer"
              >
                Clear Archive
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>{isArchiveExpanded ? 'Collapse' : 'Expand'}</span>
              {isArchiveExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isArchiveExpanded && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
            {doneTickets.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-4 text-center">
                Archive is empty. Completed tickets will appear here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {doneTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg flex items-start justify-between gap-2 opacity-80 hover:opacity-100 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-300 line-through truncate">
                          {ticket.title}
                        </span>
                      </div>
                      {ticket.completedAt && (
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 ml-5">
                          Done {formatDisplayDate(ticket.completedAt.split('T')[0])}
                        </p>
                      )}
                      {ticket.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 ml-5">
                          {ticket.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleReopenTicket(ticket.id)}
                        className="p-1 text-slate-400 hover:text-blue-400 rounded"
                        title="Reopen ticket to To Do"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTicket(ticket)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded"
                        title="Delete ticket"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- CREATE / EDIT TICKET MODAL --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3.5 text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{editingTicket ? 'Edit Ticket' : 'Create New Ticket'}</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTicket} className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Ticket Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. File tax returns, Upgrade dev dependencies..."
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, steps, link..."
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Swimlane & Priority Row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Swimlane
                  </label>
                  <select
                    value={swimlane}
                    onChange={(e) => setSwimlane(e.target.value as TicketSwimlane)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Completed (Archive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-medium"
                  >
                    <option value="urgent">🔥 Urgent</option>
                    <option value="high">⚡ High</option>
                    <option value="medium">◆ Medium</option>
                    <option value="low">◇ Low</option>
                  </select>
                </div>
              </div>

              {/* Optional Due Date */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                  <span>Optional Due Date</span>
                  <span className="text-[9px] text-slate-500">Tickets with due dates rank first</span>
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-slate-400">
                  Tags ({selectedTags.length})
                </label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <TagIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2 pointer-events-none" />
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(tagsInput);
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagsInput)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Tags list */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-950 text-blue-300 border border-blue-500/30"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-white"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested quick tags */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[9px] text-slate-500">Suggestions:</span>
                  {SUGGESTED_TAGS.map((stag) => (
                    <button
                      type="button"
                      key={stag}
                      onClick={() => handleAddTag(stag)}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded"
                    >
                      +{stag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow transition"
                >
                  {editingTicket ? 'Save Changes' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE TICKET MODAL --- */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl space-y-3 text-slate-100">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete Ticket</span>
            </h4>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <strong className="text-white">"{ticketToDelete.title}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTicket}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM CLEAR ARCHIVE MODAL --- */}
      {showClearArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl space-y-3 text-slate-100">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear Archive</span>
            </h4>
            <p className="text-xs text-slate-300">
              Clear all completed tickets from the archive? This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowClearArchiveConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearArchive}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TicketCardProps {
  ticket: Ticket;
  todayStr: string;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (lane: TicketSwimlane) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  todayStr,
  onComplete,
  onEdit,
  onDelete,
  onMove,
}) => {
  const pConfig = PRIORITY_CONFIG[ticket.priority];

  // Due date status
  const isOverdue = ticket.dueDate && ticket.dueDate < todayStr;
  const isDueToday = ticket.dueDate && ticket.dueDate === todayStr;

  return (
    <div className="p-2.5 bg-slate-950 border border-slate-800/90 rounded-lg space-y-2 hover:border-slate-700 transition shadow-xs group">
      {/* Top line: Complete checkmark & Title */}
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onComplete}
          className="mt-0.5 w-4.5 h-4.5 rounded border border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center text-slate-500 hover:text-emerald-400 transition cursor-pointer shrink-0 group/check"
          title="Complete ticket and move to Archive"
        >
          <Check className="w-3 h-3 stroke-[2.5] opacity-40 group-hover/check:opacity-100" />
        </button>

        <div className="flex-1 min-w-0" onClick={onEdit}>
          <h4 className="text-xs font-bold text-white hover:text-blue-300 transition cursor-pointer leading-tight">
            {ticket.title}
          </h4>
          {ticket.description && (
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
              {ticket.description}
            </p>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 shrink-0">
          <button
            onClick={onDelete}
            className="p-1 text-slate-500 hover:text-rose-400 rounded"
            title="Delete ticket"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Meta Line: Priority Badge, Due Date, Tags */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] pt-0.5">
        {/* Priority Badge */}
        <span
          className={`px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}
        >
          <span>{pConfig.icon}</span>
          <span>{pConfig.label}</span>
        </span>

        {/* Due Date Badge */}
        {ticket.dueDate && (
          <span
            className={`px-1.5 py-0.5 rounded border font-mono font-semibold flex items-center gap-1 ${
              isOverdue
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                : isDueToday
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            <Clock className="w-2.5 h-2.5" />
            <span>
              {isOverdue ? 'Overdue: ' : isDueToday ? 'Today: ' : ''}
              {formatDisplayDate(ticket.dueDate)}
            </span>
          </span>
        )}

        {/* Tags */}
        {ticket.tags.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800/80 font-mono"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Lane Movement Toolbar */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[9px] text-slate-400">
        <span>Move to:</span>
        <div className="flex items-center gap-1">
          {ticket.swimlane !== 'todo' && (
            <button
              onClick={() => onMove('todo')}
              className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
            >
              To Do
            </button>
          )}
          {ticket.swimlane !== 'in_progress' && (
            <button
              onClick={() => onMove('in_progress')}
              className="px-1.5 py-0.5 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 rounded border border-blue-500/30"
            >
              In Progress
            </button>
          )}
          {ticket.swimlane !== 'blocked' && (
            <button
              onClick={() => onMove('blocked')}
              className="px-1.5 py-0.5 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 rounded border border-amber-500/30"
            >
              Blocked
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
