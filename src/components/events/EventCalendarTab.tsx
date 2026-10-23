import React, { useMemo, useState } from 'react';
import { AppData, PlannedEvent, Person } from '../../types';
import { formatDisplayDate, getTodayDateString, findConflictingInterval } from '../../utils/dateUtils';
import { Calendar as CalendarIcon, Clock, MapPin, Users, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Repeat, Trash2, Filter, List } from 'lucide-react';

interface EventCalendarTabProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  onOpenPlanner: () => void;
}

export const EventCalendarTab: React.FC<EventCalendarTabProps> = ({ data, onUpdateData, onOpenPlanner }) => {
  const [viewMode, setViewMode] = useState<'calendar_grid' | 'agenda_list'>('calendar_grid');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [attendeeFilter, setAttendeeFilter] = useState<string>('all');

  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentCalendarDate(new Date());
    setSelectedDate(getTodayDateString());
  };

  const getEventConflicts = (event: PlannedEvent) => {
    if (!event.startDate) return [];
    const eventDate = event.startDate;
    const conflicts: { person: Person; reason: string }[] = [];

    event.attendeeIds.forEach(attId => {
      const person = data.people.find(p => p.id === attId);
      if (!person) return;
      const conf = findConflictingInterval(eventDate, person.unavailableIntervals);
      if (conf) {
        conflicts.push({ person, reason: conf.reason });
      }
    });

    return conflicts;
  };

  const scheduledEvents = useMemo(() => {
    return data.events.filter(e => {
      if (e.status === 'unscheduled' || !e.startDate) return false;
      if (attendeeFilter !== 'all' && !e.attendeeIds.includes(attendeeFilter)) return false;
      return true;
    }).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [data.events, attendeeFilter]);

  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const startOffset = (firstDayIndex + 6) % 7;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      eventsOnDay: PlannedEvent[];
      hasConflict: boolean;
    }[] = [];

    const todayStr = getTodayDateString();

    for (let i = startOffset - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevD = new Date(year, month - 1, dNum);
      const dateStr = prevD.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        eventsOnDay: [],
        hasConflict: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const curD = new Date(year, month, d);
      const dateStr = curD.toISOString().split('T')[0];
      const dayOfWeek = curD.getDay();

      const matchedEvents = data.events.filter(e => {
        if (e.status === 'unscheduled') return false;
        if (attendeeFilter !== 'all' && !e.attendeeIds.includes(attendeeFilter)) return false;

        if (e.startDate && e.endDate) {
          if (dateStr >= e.startDate && dateStr <= e.endDate) return true;
        } else if (e.startDate === dateStr) {
          return true;
        }

        if (e.isRecurring && e.recurrence) {
          if (e.recurrence.frequency === 'weekly' && e.recurrence.dayOfWeek === dayOfWeek) {
            return true;
          }
          if (e.recurrence.frequency === 'daily') {
            return true;
          }
        }

        return false;
      });

      const hasConflict = matchedEvents.some(ev => getEventConflicts(ev).length > 0);

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        eventsOnDay: matchedEvents,
        hasConflict,
      });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDay = 1;
    while (days.length < totalCells) {
      const nextD = new Date(year, month + 1, nextDay);
      const dateStr = nextD.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNumber: nextDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        eventsOnDay: [],
        hasConflict: false,
      });
      nextDay++;
    }

    return days;
  }, [year, month, data.events, attendeeFilter]);

  const selectedDateEvents = useMemo(() => {
    return calendarGrid.find(d => d.dateStr === selectedDate)?.eventsOnDay || [];
  }, [calendarGrid, selectedDate]);

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Delete this event?')) {
      onUpdateData({
        ...data,
        events: data.events.filter(e => e.id !== eventId),
      });
    }
  };

  const handleToggleComplete = (eventId: string) => {
    onUpdateData({
      ...data,
      events: data.events.map(ev => {
        if (ev.id === eventId) {
          return {
            ...ev,
            status: ev.status === 'completed' ? 'planned' : 'completed',
          };
        }
        return ev;
      }),
    });
  };

  return (
    <div className="space-y-4 pb-12 text-slate-100">
      {/* Top Header & Filter Bar - Compact */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-400 shrink-0" />
          <h2 className="text-xs sm:text-sm font-bold text-white">Upcoming Calendar</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Attendee Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 border border-slate-800 rounded-lg text-xs">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={attendeeFilter}
              onChange={(e) => setAttendeeFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none max-w-[110px] truncate"
            >
              <option value="all">All People</option>
              {data.people.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-950 p-0.5 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('calendar_grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition text-[11px] font-medium ${
                viewMode === 'calendar_grid' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('agenda_list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition text-[11px] font-medium ${
                viewMode === 'agenda_list' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <List className="w-3 h-3" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- VIEW 1: MONTH CALENDAR GRID --- */}
      {viewMode === 'calendar_grid' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-md space-y-3">
            {/* Month Navigation */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={goToToday}
                  className="px-2 py-0.5 text-[10px] font-semibold text-blue-400 bg-blue-950 border border-blue-500/30 rounded"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* DOW Header */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 uppercase py-0.5">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Grid Cells - Compact */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((day, idx) => {
                const isSelected = selectedDate === day.dateStr;

                return (
                  <div
                    key={`${day.dateStr}-${idx}`}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`min-h-[58px] sm:min-h-[72px] p-1 rounded-lg border flex flex-col justify-between transition cursor-pointer select-none ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500'
                        : day.isCurrentMonth
                        ? 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                        : 'border-slate-800/30 bg-slate-950/20 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold ${
                          day.isToday
                            ? 'w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]'
                            : day.isCurrentMonth
                            ? 'text-slate-200'
                            : 'text-slate-600'
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {day.hasConflict && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Conflict!" />
                      )}
                    </div>

                    <div className="space-y-0.5 overflow-hidden mt-0.5">
                      {day.eventsOnDay.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-medium truncate text-white"
                          style={{ backgroundColor: (ev.colorTag || '#3b82f6') + 'dd' }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {day.eventsOnDay.length > 2 && (
                        <span className="text-[8px] text-slate-400 font-bold block">
                          +{day.eventsOnDay.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Inspector Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-400" />
                Events on {formatDisplayDate(selectedDate)}
              </span>
              <button
                onClick={onOpenPlanner}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
              >
                + Plan Event
              </button>
            </div>

            {selectedDateEvents.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No events on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateEvents.map((ev) => {
                  const conflicts = getEventConflicts(ev);
                  return (
                    <div
                      key={ev.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{ev.title}</span>
                          {ev.isRecurring && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-500/30 rounded flex items-center gap-0.5">
                              <Repeat className="w-2.5 h-2.5" />
                              <span>Recurring</span>
                            </span>
                          )}
                          {ev.status === 'completed' && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded">
                              Done
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleComplete(ev.id)}
                            className={`p-1 rounded text-xs ${
                              ev.status === 'completed' ? 'text-emerald-400' : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        {!ev.allDay && ev.startTime && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{ev.startTime}</span>
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{ev.location}</span>
                          </span>
                        )}
                      </div>

                      {conflicts.length > 0 && (
                        <div className="p-1.5 bg-rose-950/40 border border-rose-500/40 rounded text-[11px] text-rose-300 flex items-center justify-between">
                          <span className="truncate">⚠️ Conflict: {conflicts[0].person.name} ({conflicts[0].reason})</span>
                          <button onClick={onOpenPlanner} className="underline text-[10px] font-bold shrink-0 ml-1">
                            Reschedule
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VIEW 2: AGENDA LIST --- */}
      {viewMode === 'agenda_list' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md space-y-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <List className="w-3.5 h-3.5 text-blue-400" />
            Scheduled Events ({scheduledEvents.length})
          </h3>

          {scheduledEvents.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No scheduled events found.</p>
          ) : (
            <div className="space-y-2">
              {scheduledEvents.map((ev) => {
                const conflicts = getEventConflicts(ev);
                return (
                  <div
                    key={ev.id}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-white truncate">{ev.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-blue-400 rounded">
                          {formatDisplayDate(ev.startDate || '')}
                        </span>
                        {ev.isRecurring && (
                          <span className="text-[9px] px-1 py-0.2 bg-blue-950 text-blue-300 rounded flex items-center gap-0.5">
                            <Repeat className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleComplete(ev.id)}
                          className={`p-1 text-xs ${
                            ev.status === 'completed' ? 'text-emerald-400' : 'text-slate-500 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {!ev.allDay && ev.startTime && <span>{ev.startTime}</span>}
                      {ev.location && <span className="truncate">• {ev.location}</span>}
                    </div>

                    {conflicts.length > 0 && (
                      <div className="p-1.5 bg-rose-950/40 border border-rose-500/40 rounded text-[11px] text-rose-300 flex items-center justify-between">
                        <span className="truncate">⚠️ Conflict: {conflicts[0].person.name} ({conflicts[0].reason})</span>
                        <button onClick={onOpenPlanner} className="underline text-[10px] font-bold shrink-0 ml-1">
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
