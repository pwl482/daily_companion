import React, { useMemo, useState } from 'react';
import { AppData } from '../../types';
import { isRecurringActiveOnDate } from '../../utils/cronHelper';
import { TrendingUp, TrendingDown, Calendar, AreaChart, LineChart, Check } from 'lucide-react';

interface FinanceEvalTabProps {
  data: AppData;
}

const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#10b981', // emerald
  Sports: '#06b6d4', // cyan
  Entertainment: '#ec4899', // pink
  Dining: '#f59e0b', // amber
  Rent: '#3b82f6', // blue
  Internet: '#8b5cf6', // purple
  Power: '#eab308', // yellow
  Mobility: '#f97316', // orange
  Health: '#14b8a6', // teal
  Shopping: '#a855f7', // violet
  Other: '#64748b', // slate
};

const DEFAULT_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#f97316', '#14b8a6', '#6366f1', '#64748b',
];

export const FinanceEvalTab: React.FC<FinanceEvalTabProps> = ({ data }) => {
  const [timeRangeMonths, setTimeRangeMonths] = useState<number>(6); // 6 or 12
  const [chartType, setChartType] = useState<'stacked_area' | 'lines'>('stacked_area');
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [hoveredYoYIndex, setHoveredYoYIndex] = useState<number | null>(null);

  // Extract all unique higher-order categories across one-time and recurring
  const allCategories = useMemo(() => {
    const cats = new Set<string>();

    data.oneTimePayments.forEach(p => {
      p.splits.forEach(s => {
        if (s.primaryCategory) {
          cats.add(s.primaryCategory);
        }
      });
    });

    data.recurringPayments.forEach(r => {
      if (r.type === 'expense') {
        const cat = r.category.charAt(0).toUpperCase() + r.category.slice(1);
        cats.add(cat);
      }
    });

    return Array.from(cats).sort();
  }, [data]);

  // Toggleable categories state (starts with all active)
  const [activeCategories, setActiveCategories] = useState<string[]>(() => allCategories);

  React.useEffect(() => {
    if (activeCategories.length === 0 && allCategories.length > 0) {
      setActiveCategories(allCategories);
    }
  }, [allCategories]);

  const toggleCategory = (cat: string) => {
    if (activeCategories.includes(cat)) {
      if (activeCategories.length === 1) return;
      setActiveCategories(activeCategories.filter(c => c !== cat));
    } else {
      setActiveCategories([...activeCategories, cat]);
    }
  };

  const toggleAllCategories = () => {
    if (activeCategories.length === allCategories.length) {
      if (allCategories.length > 0) setActiveCategories([allCategories[0]]);
    } else {
      setActiveCategories(allCategories);
    }
  };

  const getCategoryColor = (cat: string, index: number) => {
    return CATEGORY_COLORS[cat] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
  };

  // Generate monthly buckets for Category Evolution
  const monthlyData = useMemo(() => {
    const buckets: {
      monthKey: string;
      label: string;
      categories: Record<string, number>;
      totalExpense: number;
    }[] = [];

    const now = new Date();
    for (let i = timeRangeMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${y}-${m}`;
      buckets.push({
        monthKey,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        categories: {},
        totalExpense: 0,
      });
    }

    // Process One-Time Payments
    data.oneTimePayments.forEach(otp => {
      const otpMonth = otp.date.substring(0, 7);
      const bucket = buckets.find(b => b.monthKey === otpMonth);
      if (!bucket) return;

      otp.splits.forEach(split => {
        const cat = split.primaryCategory;
        if (!activeCategories.includes(cat)) return;

        const amt = split.amount;
        bucket.categories[cat] = (bucket.categories[cat] || 0) + amt;
        bucket.totalExpense += amt;
      });
    });

    // Process Recurring Payments
    buckets.forEach(bucket => {
      const [yearStr, monthStr] = bucket.monthKey.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1;
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${bucket.monthKey}-${String(day).padStart(2, '0')}`;

        data.recurringPayments.forEach(rec => {
          if (rec.type !== 'expense') return;

          const recCat = rec.category.charAt(0).toUpperCase() + rec.category.slice(1);
          if (!activeCategories.includes(recCat)) return;

          rec.subEntries.forEach(sub => {
            const isActive = isRecurringActiveOnDate(
              dayStr,
              sub.startDate,
              sub.endDate,
              sub.frequency,
              sub.dayOfMonth,
              sub.dayOfWeek,
              sub.cronExpr
            );

            if (isActive) {
              const amt = sub.amount;
              bucket.categories[recCat] = (bucket.categories[recCat] || 0) + amt;
              bucket.totalExpense += amt;
            }
          });
        });
      }
    });

    return buckets;
  }, [data, timeRangeMonths, activeCategories]);

  const visibleCategories = useMemo(() => {
    return activeCategories.filter(cat => {
      return monthlyData.some(b => (b.categories[cat] || 0) > 0);
    });
  }, [activeCategories, monthlyData]);

  const summary = useMemo(() => {
    let filteredTotal = 0;
    monthlyData.forEach(b => {
      filteredTotal += b.totalExpense;
    });

    const avgMonthly = monthlyData.length > 0 ? filteredTotal / monthlyData.length : 0;

    return {
      filteredTotal,
      avgMonthly,
    };
  }, [monthlyData]);

  // SVG Line / Stacked Area Computations
  const chartWidth = 600;
  const chartHeight = 210;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 26;

  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;

  const maxY = useMemo(() => {
    if (chartType === 'stacked_area') {
      const maxTotal = Math.max(...monthlyData.map(b => b.totalExpense), 10);
      return Math.ceil(maxTotal * 1.15);
    } else {
      let maxSingle = 10;
      monthlyData.forEach(b => {
        Object.values(b.categories).forEach(val => {
          if (val > maxSingle) maxSingle = val;
        });
      });
      return Math.ceil(maxSingle * 1.15);
    }
  }, [monthlyData, chartType]);

  const getX = (index: number) => {
    if (monthlyData.length <= 1) return padLeft + innerW / 2;
    return padLeft + (index / (monthlyData.length - 1)) * innerW;
  };

  const getY = (val: number) => {
    return padTop + innerH - (val / maxY) * innerH;
  };

  const stackedAreas = useMemo(() => {
    if (chartType !== 'stacked_area') return [];

    const baseline = new Array(monthlyData.length).fill(0);
    const result: {
      cat: string;
      color: string;
      pathD: string;
    }[] = [];

    visibleCategories.forEach((cat, idx) => {
      const color = getCategoryColor(cat, idx);
      const topPoints: { x: number; y: number }[] = [];
      const bottomPoints: { x: number; y: number }[] = [];

      monthlyData.forEach((b, mIdx) => {
        const x = getX(mIdx);
        const val = b.categories[cat] || 0;
        const yBottom = getY(baseline[mIdx]);
        const yTop = getY(baseline[mIdx] + val);

        topPoints.push({ x, y: yTop });
        bottomPoints.push({ x, y: yBottom });
        baseline[mIdx] += val;
      });

      let d = `M ${topPoints[0].x},${topPoints[0].y}`;
      for (let i = 1; i < topPoints.length; i++) {
        d += ` L ${topPoints[i].x},${topPoints[i].y}`;
      }
      for (let i = bottomPoints.length - 1; i >= 0; i--) {
        d += ` L ${bottomPoints[i].x},${bottomPoints[i].y}`;
      }
      d += ' Z';

      result.push({ cat, color, pathD: d });
    });

    return result.reverse();
  }, [monthlyData, visibleCategories, chartType, maxY]);

  const lineSeries = useMemo(() => {
    if (chartType !== 'lines') return [];

    return visibleCategories.map((cat, idx) => {
      const color = getCategoryColor(cat, idx);
      const points = monthlyData.map((b, mIdx) => ({
        x: getX(mIdx),
        y: getY(b.categories[cat] || 0),
        val: b.categories[cat] || 0,
      }));

      const d = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
      return { cat, color, points, pathD: d };
    });
  }, [monthlyData, visibleCategories, chartType, maxY]);

  // --- YEAR-OVER-YEAR: STRICTLY FOLLOWS activeCategories FILTER ---
  const yoyMonthsData = useMemo(() => {
    const now = new Date();
    const result: {
      monthLabel: string;
      recentKey: string;
      priorKey: string;
      recentVal: number;
      priorVal: number;
      diff: number;
      pct: number;
    }[] = [];

    const calculateMonthSpend = (ym: string) => {
      let sum = 0;

      // 1. One-time
      data.oneTimePayments.forEach(otp => {
        if (otp.date.startsWith(ym)) {
          otp.splits.forEach(sp => {
            const cat = sp.primaryCategory;
            if (activeCategories.includes(cat)) {
              sum += sp.amount;
            }
          });
        }
      });

      // 2. Returning
      const [yStr, mStr] = ym.split('-');
      const y = parseInt(yStr, 10);
      const mIdx = parseInt(mStr, 10) - 1;
      const daysCount = new Date(y, mIdx + 1, 0).getDate();

      for (let day = 1; day <= daysCount; day++) {
        const dayStr = `${ym}-${String(day).padStart(2, '0')}`;
        data.recurringPayments.forEach(rec => {
          if (rec.type !== 'expense') return;

          const cat = rec.category.charAt(0).toUpperCase() + rec.category.slice(1);
          if (!activeCategories.includes(cat)) return;

          rec.subEntries.forEach(sub => {
            if (
              isRecurringActiveOnDate(
                dayStr,
                sub.startDate,
                sub.endDate,
                sub.frequency,
                sub.dayOfMonth,
                sub.dayOfWeek,
                sub.cronExpr
              )
            ) {
              sum += sub.amount;
            }
          });
        });
      }

      return sum;
    };

    for (let i = 11; i >= 0; i--) {
      const recentDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const priorDate = new Date(recentDate.getFullYear() - 1, recentDate.getMonth(), 1);

      const rY = recentDate.getFullYear();
      const rM = String(recentDate.getMonth() + 1).padStart(2, '0');
      const recentKey = `${rY}-${rM}`;

      const pY = priorDate.getFullYear();
      const pM = String(priorDate.getMonth() + 1).padStart(2, '0');
      const priorKey = `${pY}-${pM}`;

      const recentVal = calculateMonthSpend(recentKey);
      const priorVal = calculateMonthSpend(priorKey);
      const diff = recentVal - priorVal;
      const pct = priorVal > 0 ? (diff / priorVal) * 100 : (recentVal > 0 ? 100 : 0);

      result.push({
        monthLabel: recentDate.toLocaleDateString('en-US', { month: 'short' }),
        recentKey,
        priorKey,
        recentVal,
        priorVal,
        diff,
        pct,
      });
    }

    return result;
  }, [data, activeCategories]);

  // Grouped Bar Chart Computations for YoY
  const yoyChartWidth = 600;
  const yoyChartHeight = 200;
  const yoyPadLeft = 45;
  const yoyPadRight = 15;
  const yoyPadTop = 15;
  const yoyPadBottom = 26;

  const yoyInnerW = yoyChartWidth - yoyPadLeft - yoyPadRight;
  const yoyInnerH = yoyChartHeight - yoyPadTop - yoyPadBottom;

  const yoyMaxVal = useMemo(() => {
    let max = 10;
    yoyMonthsData.forEach(m => {
      if (m.recentVal > max) max = m.recentVal;
      if (m.priorVal > max) max = m.priorVal;
    });
    return Math.ceil(max * 1.15);
  }, [yoyMonthsData]);

  const groupWidth = yoyInnerW / 12;
  const barWidth = Math.max(6, (groupWidth - 10) / 2);

  // Weekday Spending Trends respecting active categories
  const weekdayTrends = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sums = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    data.oneTimePayments.forEach(otp => {
      let matchedAmount = 0;
      otp.splits.forEach(sp => {
        if (activeCategories.includes(sp.primaryCategory)) {
          matchedAmount += sp.amount;
        }
      });

      if (matchedAmount > 0) {
        const d = new Date(otp.date + 'T12:00:00');
        const dayIdx = d.getDay();
        sums[dayIdx] += matchedAmount;
        counts[dayIdx] += 1;
      }
    });

    const ordered = [1, 2, 3, 4, 5, 6, 0].map(idx => ({
      name: dayNames[idx],
      dayIdx: idx,
      total: sums[idx],
      count: counts[idx],
    }));

    const maxTotal = Math.max(...ordered.map(d => d.total), 1);
    return { days: ordered, maxTotal };
  }, [data.oneTimePayments, activeCategories]);

  return (
    <div className="space-y-3.5 pb-12 text-slate-100">
      {/* Toggleable Category Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white">Categories:</span>
            <button
              onClick={toggleAllCategories}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/30"
            >
              {activeCategories.length === allCategories.length ? 'Clear All' : 'Select All'}
            </button>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 border border-slate-800 rounded-lg text-xs font-semibold">
            {[6, 12].map(m => (
              <button
                key={m}
                onClick={() => setTimeRangeMonths(m)}
                className={`px-2 py-0.5 rounded text-[11px] transition ${
                  timeRangeMonths === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
        </div>

        {/* Toggleable Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((cat, idx) => {
            const isSelected = activeCategories.includes(cat);
            const color = getCategoryColor(cat, idx);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-slate-950/40 text-slate-500 border-slate-800/60 opacity-60 hover:opacity-80'
                }`}
                style={{
                  borderColor: isSelected ? color : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{cat}</span>
                {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Spend ({timeRangeMonths}M)
          </span>
          <p className="text-lg font-black text-rose-400 mt-0.5 font-mono">
            ${summary.filteredTotal.toFixed(0)}
          </p>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Monthly Average
          </span>
          <p className="text-lg font-black text-blue-400 mt-0.5 font-mono">
            ${summary.avgMonthly.toFixed(0)}/mo
          </p>
        </div>
      </div>

      {/* --- CHART 1: CATEGORY EVOLUTION OVER TIME --- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white">Category Evolution Over Time</h3>
          </div>

          <div className="flex bg-slate-950 p-0.5 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setChartType('stacked_area')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition text-[11px] font-medium ${
                chartType === 'stacked_area' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AreaChart className="w-3 h-3" />
              <span>Stacked</span>
            </button>
            <button
              onClick={() => setChartType('lines')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition text-[11px] font-medium ${
                chartType === 'lines' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChart className="w-3 h-3" />
              <span>Lines</span>
            </button>
          </div>
        </div>

        <div className="w-full overflow-hidden relative">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto block select-none"
            style={{ minHeight: '170px' }}
          >
            <defs>
              {visibleCategories.map((cat, idx) => {
                const color = getCategoryColor(cat, idx);
                return (
                  <linearGradient key={`grad-${cat}`} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.75" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.15" />
                  </linearGradient>
                );
              })}
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = padTop + innerH * (1 - pct);
              const val = Math.round(maxY * pct);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + innerW}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    ${val}
                  </text>
                </g>
              );
            })}

            {chartType === 'stacked_area' &&
              stackedAreas.map((area) => (
                <path
                  key={area.cat}
                  d={area.pathD}
                  fill={`url(#grad-${visibleCategories.indexOf(area.cat)})`}
                  stroke={area.color}
                  strokeWidth="1.5"
                  className="transition-all duration-200 opacity-90 hover:opacity-100"
                />
              ))}

            {chartType === 'lines' &&
              lineSeries.map((line) => (
                <g key={line.cat}>
                  <path
                    d={line.pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {line.points.map((pt, pIdx) => (
                    <circle
                      key={pIdx}
                      cx={pt.x}
                      cy={pt.y}
                      r="3"
                      fill={line.color}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  ))}
                </g>
              ))}

            {monthlyData.map((b, idx) => {
              const x = getX(idx);
              const isHovered = hoveredMonthIndex === idx;
              return (
                <g key={b.monthKey}>
                  <text
                    x={x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    fill={isHovered ? '#60a5fa' : '#94a3b8'}
                    fontSize="10"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {b.label}
                  </text>
                  <rect
                    x={x - innerW / (monthlyData.length * 2)}
                    y={padTop}
                    width={innerW / monthlyData.length}
                    height={innerH}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredMonthIndex(idx)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                  />
                </g>
              );
            })}
          </svg>

          {hoveredMonthIndex !== null && monthlyData[hoveredMonthIndex] && (
            <div className="mt-1.5 p-2 bg-slate-950/95 border border-slate-700 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 shadow-xl">
              <span className="font-bold text-white">
                {monthlyData[hoveredMonthIndex].label} Total: ${monthlyData[hoveredMonthIndex].totalExpense.toFixed(2)}
              </span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {Object.entries(monthlyData[hoveredMonthIndex].categories).map(([cat, amt]) => (
                  <span key={cat} className="text-slate-300">
                    <strong className="text-slate-100">{cat}:</strong> ${amt.toFixed(1)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CHART 2: YEAR-OVER-YEAR GROUPED BAR CHART (LAST 12M VS PRIOR 12M) --- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Year-over-Year (Last 12M vs Prior 12M)
            </h3>
          </div>

          {/* Grouped Bar Legend */}
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500" />
              <span className="text-slate-300">Current 12M</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-600" />
              <span className="text-slate-400">Prior 12M</span>
            </span>
          </div>
        </div>

        {/* SVG Grouped Bar Chart */}
        <div className="w-full overflow-hidden relative">
          <svg
            viewBox={`0 0 ${yoyChartWidth} ${yoyChartHeight}`}
            className="w-full h-auto block select-none"
            style={{ minHeight: '170px' }}
          >
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = yoyPadTop + yoyInnerH * (1 - pct);
              const val = Math.round(yoyMaxVal * pct);
              return (
                <g key={i}>
                  <line
                    x1={yoyPadLeft}
                    y1={y}
                    x2={yoyPadLeft + yoyInnerW}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                  />
                  <text
                    x={yoyPadLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    ${val}
                  </text>
                </g>
              );
            })}

            {/* 12 Month Bar Groups */}
            {yoyMonthsData.map((m, idx) => {
              const groupX = yoyPadLeft + idx * groupWidth;
              const isHovered = hoveredYoYIndex === idx;

              const hPrior = Math.max(2, (m.priorVal / yoyMaxVal) * yoyInnerH);
              const hRecent = Math.max(2, (m.recentVal / yoyMaxVal) * yoyInnerH);

              const yPrior = yoyPadTop + yoyInnerH - hPrior;
              const yRecent = yoyPadTop + yoyInnerH - hRecent;

              const xPrior = groupX + 4;
              const xRecent = xPrior + barWidth + 2;

              return (
                <g key={m.recentKey}>
                  {/* Subtle hover background highlight */}
                  {isHovered && (
                    <rect
                      x={groupX}
                      y={yoyPadTop}
                      width={groupWidth}
                      height={yoyInnerH}
                      fill="#1e293b"
                      opacity="0.4"
                      rx="4"
                    />
                  )}

                  {/* Prior Year Bar */}
                  <rect
                    x={xPrior}
                    y={yPrior}
                    width={barWidth}
                    height={hPrior}
                    fill="#64748b"
                    rx="2"
                    className="transition-all duration-200"
                  />

                  {/* Current Year Bar */}
                  <rect
                    x={xRecent}
                    y={yRecent}
                    width={barWidth}
                    height={hRecent}
                    fill="#3b82f6"
                    rx="2"
                    className="transition-all duration-200"
                  />

                  {/* Month Label */}
                  <text
                    x={groupX + groupWidth / 2}
                    y={yoyChartHeight - 6}
                    textAnchor="middle"
                    fill={isHovered ? '#60a5fa' : '#94a3b8'}
                    fontSize="10"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                  >
                    {m.monthLabel}
                  </text>

                  {/* Hit Rect for Hover/Tap */}
                  <rect
                    x={groupX}
                    y={yoyPadTop}
                    width={groupWidth}
                    height={yoyInnerH + yoyPadBottom}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredYoYIndex(idx)}
                    onMouseLeave={() => setHoveredYoYIndex(null)}
                    onClick={() => setHoveredYoYIndex(isHovered ? null : idx)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Interactive YoY Tooltip Bar */}
          {hoveredYoYIndex !== null && yoyMonthsData[hoveredYoYIndex] && (
            <div className="mt-1.5 p-2 bg-slate-950/95 border border-slate-700 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  {yoyMonthsData[hoveredYoYIndex].monthLabel}:
                </span>
                <span className="text-blue-400 font-mono font-semibold">
                  Current: ${yoyMonthsData[hoveredYoYIndex].recentVal.toFixed(0)}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono font-semibold">
                  Prior: ${yoyMonthsData[hoveredYoYIndex].priorVal.toFixed(0)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-bold flex items-center gap-0.5 ${
                    yoyMonthsData[hoveredYoYIndex].diff > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {yoyMonthsData[hoveredYoYIndex].diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {yoyMonthsData[hoveredYoYIndex].diff >= 0 ? `+$${yoyMonthsData[hoveredYoYIndex].diff.toFixed(0)}` : `-$${Math.abs(yoyMonthsData[hoveredYoYIndex].diff).toFixed(0)}`}
                  {' '}({yoyMonthsData[hoveredYoYIndex].pct >= 0 ? `+${yoyMonthsData[hoveredYoYIndex].pct.toFixed(0)}%` : `${yoyMonthsData[hoveredYoYIndex].pct.toFixed(0)}%`})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CHART 3: WEEKDAY SPENDING TRENDS --- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md space-y-2.5">
        <div className="pb-1.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Spending by Weekday (Mon - Sun)
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Follows active categories</span>
        </div>

        <div className="space-y-1.5 pt-1">
          {weekdayTrends.days.map((d) => {
            const pct = (d.total / weekdayTrends.maxTotal) * 100;
            const isPeak = d.total === weekdayTrends.maxTotal && d.total > 0;

            return (
              <div key={d.name} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${isPeak ? 'text-amber-400' : 'text-slate-300'}`}>
                    {d.name}
                  </span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    ${d.total.toFixed(2)} ({d.count} txns)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${Math.max(2, pct)}%` }}
                    className={`h-full rounded-full transition-all ${
                      isPeak ? 'bg-amber-400' : 'bg-blue-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
