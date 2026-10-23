import React, { useState, useMemo } from 'react';
import { AppData, Person, PlannedEvent, UnavailableInterval } from '../../types';
import { formatDisplayDate, getTodayDateString, findConflictingInterval } from '../../utils/dateUtils';
import { Calendar, Users, Plus, Trash2, CheckCircle2, Sparkles, MapPin, UserPlus, ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';

interface EventPlannerTabProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  onNavigateToCalendar: () => void;
}

export const EventPlannerTab: React.FC<EventPlannerTabProps> = ({ data, onUpdateData, onNavigateToCalendar }) => {
  const [plannerSubTab, setPlannerSubTab] = useState<'create_event' | 'people' | 'smart_scheduler'>('create_event');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- EVENT FORM STATE ---
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [eventStartDate, setEventStartDate] = useState(getTodayDateString());
  const [eventEndDate, setEventEndDate] = useState(getTodayDateString());
  const [eventStartTime, setEventStartTime] = useState('18:00');
  const [eventEndTime, setEventEndTime] = useState('20:00');
  const [eventAllDay, setEventAllDay] = useState(false);
  const [isEventRecurring, setIsEventRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom_cron'>('weekly');
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState(3);
  const [recurrenceCron, setRecurrenceCron] = useState('0 18 * * 3');
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>([]);
  const [eventColor, setEventColor] = useState('#3b82f6');

  // --- PERSON FORM STATE ---
  const [personName, setPersonName] = useState('');
  const [personRelation, setPersonRelation] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [personColor, setPersonColor] = useState('#3b82f6');

  // --- UNAVAILABILITY MODAL STATE ---
  const [unavailPersonId, setUnavailPersonId] = useState<string | null>(null);
  const [unavailStart, setUnavailStart] = useState(getTodayDateString());
  const [unavailEnd, setUnavailEnd] = useState(getTodayDateString());
  const [unavailReason, setUnavailReason] = useState('');

  // --- SMART SCHEDULER STATE ---
  const [selectedEventToSchedule, setSelectedEventToSchedule] = useState<string>(
    data.events.find(e => e.status === 'unscheduled')?.id || (data.events[0]?.id || '')
  );
  const [schedulerMonthOffset, setSchedulerMonthOffset] = useState<number>(0);
  const [selectedCandidateDate, setSelectedCandidateDate] = useState<string>(getTodayDateString());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleAttendee = (personId: string) => {
    setSelectedAttendeeIds(prev =>
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      alert('Please enter an event title.');
      return;
    }

    const newEvent: PlannedEvent = {
      id: `evt-${Date.now()}`,
      title: eventTitle.trim(),
      description: eventDesc.trim(),
      location: eventLocation.trim(),
      status: isDateOpen ? 'unscheduled' : 'planned',
      startDate: isDateOpen ? undefined : eventStartDate,
      endDate: isDateOpen ? undefined : (eventEndDate || eventStartDate),
      startTime: isDateOpen || eventAllDay ? undefined : eventStartTime,
      endTime: isDateOpen || eventAllDay ? undefined : eventEndTime,
      allDay: eventAllDay,
      isRecurring: isEventRecurring,
      recurrence: isEventRecurring
        ? {
            frequency: recurrenceFreq,
            cronExpr: recurrenceFreq === 'custom_cron' ? recurrenceCron : undefined,
            dayOfWeek: recurrenceFreq === 'weekly' ? recurrenceDayOfWeek : undefined,
          }
        : undefined,
      attendeeIds: selectedAttendeeIds,
      colorTag: eventColor,
      createdAt: new Date().toISOString(),
    };

    onUpdateData({
      ...data,
      events: [newEvent, ...data.events],
    });

    setEventTitle('');
    setEventDesc('');
    setEventLocation('');
    setSelectedAttendeeIds([]);
    showToast(isDateOpen ? 'Open event added to Planner!' : 'Event scheduled!');
  };

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      alert('Please enter a name.');
      return;
    }

    const newPerson: Person = {
      id: `person-${Date.now()}`,
      name: personName.trim(),
      color: personColor,
      relation: personRelation.trim(),
      email: personEmail.trim(),
      unavailableIntervals: [],
    };

    onUpdateData({
      ...data,
      people: [...data.people, newPerson],
    });

    setPersonName('');
    setPersonRelation('');
    setPersonEmail('');
    showToast(`Added ${newPerson.name}!`);
  };

  const handleDeletePerson = (personId: string) => {
    if (window.confirm('Delete this person?')) {
      onUpdateData({
        ...data,
        people: data.people.filter(p => p.id !== personId),
        events: data.events.map(ev => ({
          ...ev,
          attendeeIds: ev.attendeeIds.filter(id => id !== personId),
        })),
      });
    }
  };

  const handleAddUnavailability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unavailPersonId) return;
    if (!unavailReason.trim()) {
      alert('Please enter a reason.');
      return;
    }

    const interval: UnavailableInterval = {
      id: `un-${Date.now()}`,
      startDate: unavailStart,
      endDate: unavailEnd >= unavailStart ? unavailEnd : unavailStart,
      allDay: true,
      reason: unavailReason.trim(),
    };

    const updatedPeople = data.people.map(p => {
      if (p.id === unavailPersonId) {
        return {
          ...p,
          unavailableIntervals: [...p.unavailableIntervals, interval],
        };
      }
      return p;
    });

    onUpdateData({
      ...data,
      people: updatedPeople,
    });

    setUnavailPersonId(null);
    setUnavailReason('');
    showToast('Blackout recorded!');
  };

  const handleDeleteUnavailability = (personId: string, intervalId: string) => {
    const updatedPeople = data.people.map(p => {
      if (p.id === personId) {
        return {
          ...p,
          unavailableIntervals: p.unavailableIntervals.filter(i => i.id !== intervalId),
        };
      }
      return p;
    });

    onUpdateData({
      ...data,
      people: updatedPeople,
    });
  };

  const activeEvent = data.events.find(e => e.id === selectedEventToSchedule);
  const activeAttendees = data.people.filter(p => activeEvent?.attendeeIds.includes(p.id));

  // Generate 31 Candidate Days with Mon-Sun column alignment
  const { candidateGrid, rangeLabel } = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + schedulerMonthOffset * 31);

    const end = new Date(start);
    end.setDate(end.getDate() + 30);

    const rLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const startDOW = (start.getDay() + 6) % 7; // Monday = 0, Sunday = 6

    const days: ({
      isEmpty: boolean;
      dateStr: string;
      dayNum: number;
      dayOfWeek: string;
      conflicts: { person: Person; interval: UnavailableInterval }[];
      isFree: boolean;
    })[] = [];

    // Empty padding cells for start alignment
    for (let p = 0; p < startDOW; p++) {
      days.push({
        isEmpty: true,
        dateStr: `empty-${p}`,
        dayNum: 0,
        dayOfWeek: '',
        conflicts: [],
        isFree: false,
      });
    }

    // Next 31 days
    for (let i = 0; i < 31; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();

      const conflicts: { person: Person; interval: UnavailableInterval }[] = [];
      activeAttendees.forEach(person => {
        const conf = findConflictingInterval(dateStr, person.unavailableIntervals);
        if (conf) {
          conflicts.push({ person, interval: conf });
        }
      });

      days.push({
        isEmpty: false,
        dateStr,
        dayOfWeek,
        dayNum,
        conflicts,
        isFree: conflicts.length === 0,
      });
    }

    return { candidateGrid: days, rangeLabel: rLabel };
  }, [activeAttendees, schedulerMonthOffset]);

  // Selected date info
  const selectedDayInfo = useMemo(() => {
    return candidateGrid.find(d => !d.isEmpty && d.dateStr === selectedCandidateDate);
  }, [candidateGrid, selectedCandidateDate]);

  const scheduleEventOnDate = (dateStr: string) => {
    if (!activeEvent) return;

    const updatedEvents = data.events.map(ev => {
      if (ev.id === activeEvent.id) {
        return {
          ...ev,
          status: 'planned' as const,
          startDate: dateStr,
          endDate: dateStr,
          startTime: ev.startTime || '18:00',
          endTime: ev.endTime || '20:00',
        };
      }
      return ev;
    });

    onUpdateData({
      ...data,
      events: updatedEvents,
    });

    showToast(`Scheduled '${activeEvent.title}' on ${formatDisplayDate(dateStr)}!`);
  };

  return (
    <div className="space-y-3.5 pb-12 text-slate-100">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg shadow-xl animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Subtab Navigation - Compact */}
      <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 max-w-sm mx-auto">
        <button
          onClick={() => setPlannerSubTab('create_event')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            plannerSubTab === 'create_event'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Event Form</span>
        </button>
        <button
          onClick={() => setPlannerSubTab('people')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            plannerSubTab === 'people'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>People ({data.people.length})</span>
        </button>
        <button
          onClick={() => setPlannerSubTab('smart_scheduler')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            plannerSubTab === 'smart_scheduler'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Finder (31D)</span>
        </button>
      </div>

      {/* --- TAB 1: CREATE / PLAN EVENT FORM --- */}
      {plannerSubTab === 'create_event' && (
        <div className="space-y-3.5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md">
            <div className="mb-2.5 pb-2 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                Plan Event (Fixed or Open Date)
              </h2>
              <button
                type="button"
                onClick={onNavigateToCalendar}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
              >
                <span>Calendar</span>
                <span>→</span>
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Hike, Dinner, Meeting..."
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                    Location / Link (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2 pointer-events-none" />
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Downtown, Room B..."
                      className="w-full pl-7 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Notes, gear, agenda..."
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Date Setting Mode Toggle */}
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Date Mode:</span>
                  <div className="flex bg-slate-900 p-0.5 border border-slate-700 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setIsDateOpen(false)}
                      className={`px-2 py-0.5 rounded transition text-[11px] ${
                        !isDateOpen ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Set Date
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDateOpen(true)}
                      className={`px-2 py-0.5 rounded transition text-[11px] ${
                        isDateOpen ? 'bg-amber-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Leave Open
                    </button>
                  </div>
                </div>

                {isDateOpen ? (
                  <p className="text-[11px] text-amber-300 font-medium py-0.5">
                    ⚡ Open Date: switch to the Finder tab to match free slots across attendees.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">Start Date</label>
                      <input
                        type="date"
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        required={!isDateOpen}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">End Date</label>
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        required={!isDateOpen}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">Start Time</label>
                      <input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        disabled={eventAllDay}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white disabled:opacity-40"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">End Time</label>
                      <input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        disabled={eventAllDay}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white disabled:opacity-40"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Repeating Schedule Option */}
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="recEventCheck"
                    checked={isEventRecurring}
                    onChange={(e) => setIsEventRecurring(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="recEventCheck" className="text-xs text-slate-200 font-semibold cursor-pointer">
                    Repeating Event
                  </label>
                </div>
                {isEventRecurring && (
                  <select
                    value={recurrenceFreq}
                    onChange={(e) => setRecurrenceFreq(e.target.value as any)}
                    className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                  </select>
                )}
              </div>

              {/* Attendees Pills */}
              <div className="space-y-1 pt-0.5">
                <label className="block text-[10px] font-semibold text-slate-400">
                  Select Attendees ({selectedAttendeeIds.length}):
                </label>
                <div className="flex flex-wrap gap-1">
                  {data.people.map((person) => {
                    const isSelected = selectedAttendeeIds.includes(person.id);
                    return (
                      <button
                        type="button"
                        key={person.id}
                        onClick={() => toggleAttendee(person.id)}
                        className={`px-2 py-0.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                          isSelected
                            ? 'bg-blue-950/80 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: person.color }}
                        />
                        <span>{person.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isDateOpen ? 'Save Open Event' : 'Save Event'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Unscheduled Shelf */}
          {data.events.filter(e => e.status === 'unscheduled').length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-md space-y-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Unscheduled Events ({data.events.filter(e => e.status === 'unscheduled').length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {data.events.filter(e => e.status === 'unscheduled').map(ev => (
                  <div key={ev.id} className="p-2 bg-slate-950 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate mr-2">{ev.title}</span>
                    <button
                      onClick={() => {
                        setSelectedEventToSchedule(ev.id);
                        setPlannerSubTab('smart_scheduler');
                      }}
                      className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[11px] font-semibold shrink-0"
                    >
                      Find Date
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: PEOPLE DIRECTORY & BLACKOUTS --- */}
      {plannerSubTab === 'people' && (
        <div className="space-y-3.5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
            <h2 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-blue-400" />
              Add Person
            </h2>
            <form onSubmit={handleAddPerson} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Full Name"
                required
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <input
                type="text"
                value={personRelation}
                onChange={(e) => setPersonRelation(e.target.value)}
                placeholder="Role / Relation"
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <input
                type="email"
                value={personEmail}
                onChange={(e) => setPersonEmail(e.target.value)}
                placeholder="Email (optional)"
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
              />
              <button
                type="submit"
                className="py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Person</span>
              </button>
            </form>
          </div>

          {/* People list with Blackouts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {data.people.map((person) => (
              <div
                key={person.id}
                className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      style={{ backgroundColor: person.color }}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    >
                      {person.name.substring(0, 1).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{person.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">({person.relation || 'Contact'})</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setUnavailPersonId(person.id);
                        setUnavailStart(getTodayDateString());
                        setUnavailEnd(getTodayDateString());
                      }}
                      className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded text-[10px] font-semibold"
                    >
                      + Blackout
                    </button>
                    <button
                      onClick={() => handleDeletePerson(person.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {person.unavailableIntervals.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No blackouts (available anytime).</p>
                  ) : (
                    person.unavailableIntervals.map((interval) => (
                      <div
                        key={interval.id}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] flex items-center justify-between gap-1"
                      >
                        <span className="text-rose-300 truncate">
                          {formatDisplayDate(interval.startDate)}
                          {interval.endDate !== interval.startDate && ` → ${formatDisplayDate(interval.endDate)}`}:{' '}
                          <span className="text-slate-400 italic">{interval.reason}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteUnavailability(person.id, interval.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: SMART AVAILABILITY DATE FINDER (FITS 31 DAYS ON SINGLE MOBILE SCREEN) --- */}
      {plannerSubTab === 'smart_scheduler' && (
        <div className="space-y-2.5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-2">
            {/* Header with Event Picker & Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white">Smart Finder:</span>
                <select
                  value={selectedEventToSchedule}
                  onChange={(e) => setSelectedEventToSchedule(e.target.value)}
                  className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-bold max-w-[170px] truncate"
                >
                  {data.events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} {ev.status === 'unscheduled' ? '⚡' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Free
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Busy
                </span>
              </div>
            </div>

            {/* Navigation & Range Header */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 text-[11px]">{rangeLabel}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSchedulerMonthOffset(prev => prev - 1)}
                  className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => {
                    setSchedulerMonthOffset(0);
                    setSelectedCandidateDate(getTodayDateString());
                  }}
                  className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-500/30 rounded text-[10px] font-semibold"
                >
                  Today
                </button>
                <button
                  onClick={() => setSchedulerMonthOffset(prev => prev + 1)}
                  className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]"
                >
                  Next 31D →
                </button>
              </div>
            </div>

            {/* Compact 7-column Calendar Matrix (31 Days on 1 Screen!) */}
            <div>
              {/* Day of Week Header */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase py-0.5 mb-1">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* 31 Cells Grid */}
              <div className="grid grid-cols-7 gap-1">
                {candidateGrid.map((day, idx) => {
                  if (day.isEmpty) {
                    return <div key={`empty-${idx}`} className="h-9 rounded opacity-0" />;
                  }

                  const isSelected = selectedCandidateDate === day.dateStr;
                  const isScheduledDate = activeEvent?.startDate === day.dateStr;

                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setSelectedCandidateDate(day.dateStr)}
                      className={`h-9 rounded-lg border flex flex-col items-center justify-center transition cursor-pointer select-none relative ${
                        isSelected
                          ? 'ring-2 ring-blue-400 border-blue-400 bg-blue-950 text-white font-bold'
                          : day.isFree
                          ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/60'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
                      }`}
                    >
                      <span className="text-xs font-black leading-none">{day.dayNum}</span>
                      <span className="text-[8px] opacity-75 mt-0.5 uppercase leading-none">
                        {day.dayOfWeek}
                      </span>
                      {isScheduledDate && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 border border-slate-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Action Card (Fits immediately below grid) */}
            {selectedDayInfo && (
              <div className="mt-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {formatDisplayDate(selectedDayInfo.dateStr)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        selectedDayInfo.isFree
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {selectedDayInfo.isFree ? '100% Free' : `${selectedDayInfo.conflicts.length} Conflict(s)`}
                    </span>
                  </div>

                  {selectedDayInfo.conflicts.length > 0 ? (
                    <p className="text-[11px] text-rose-300 truncate mt-0.5">
                      ❌ {selectedDayInfo.conflicts.map(c => `${c.person.name.split(' ')[0]} (${c.interval.reason})`).join(', ')}
                    </p>
                  ) : (
                    <p className="text-[11px] text-emerald-400 mt-0.5">
                      ✓ All {activeAttendees.length > 0 ? activeAttendees.length : '0'} attendee(s) free!
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => scheduleEventOnDate(selectedDayInfo.dateStr)}
                    className={`w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow cursor-pointer ${
                      activeEvent?.startDate === selectedDayInfo.dateStr
                        ? 'bg-blue-600/40 text-blue-200 border border-blue-500/50'
                        : selectedDayInfo.isFree
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {activeEvent?.startDate === selectedDayInfo.dateStr ? 'Already Scheduled' : 'Schedule on This Date'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unavailability Modal */}
      {unavailPersonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-2xl space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Add Blackout Interval
              </span>
              <button
                onClick={() => setUnavailPersonId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddUnavailability} className="space-y-2">
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">Start Date</label>
                <input
                  type="date"
                  value={unavailStart}
                  onChange={(e) => setUnavailStart(e.target.value)}
                  required
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">End Date</label>
                <input
                  type="date"
                  value={unavailEnd}
                  onChange={(e) => setUnavailEnd(e.target.value)}
                  required
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 mb-0.5">Reason</label>
                <input
                  type="text"
                  value={unavailReason}
                  onChange={(e) => setUnavailReason(e.target.value)}
                  placeholder="Vacation, shift..."
                  required
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setUnavailPersonId(null)}
                  className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
