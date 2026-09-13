import React from 'react';

interface CtcComponentItem {
  label: string;
  amount: number;
  color: string;
  percentage: number;
}

interface CtcDonutChartProps {
  annualCtc: number;
  basicAnnual: number;
  hraAnnual: number;
  specialAllowanceAnnual: number;
  variableAnnual?: number;
  retiralsAnnual?: number;
}

export const CtcDonutChart: React.FC<CtcDonutChartProps> = ({
  annualCtc = 0,
  basicAnnual = 0,
  hraAnnual = 0,
  specialAllowanceAnnual = 0,
  variableAnnual = 0,
  retiralsAnnual = 0,
}) => {
  const safeTotal = Math.max(1, annualCtc);

  const items: CtcComponentItem[] = [
    {
      label: 'Basic Salary',
      amount: basicAnnual,
      color: '#84b81b', // Brand Olive Green
      percentage: Math.round((basicAnnual / safeTotal) * 100),
    },
    {
      label: 'House Rent Allowance (HRA)',
      amount: hraAnnual,
      color: '#3b82f6', // Blue
      percentage: Math.round((hraAnnual / safeTotal) * 100),
    },
    {
      label: 'Special Allowance',
      amount: specialAllowanceAnnual,
      color: '#f59e0b', // Amber
      percentage: Math.round((specialAllowanceAnnual / safeTotal) * 100),
    },
    {
      label: 'Performance Bonus',
      amount: variableAnnual,
      color: '#8b5cf6', // Purple
      percentage: Math.round((variableAnnual / safeTotal) * 100),
    },
    {
      label: 'Retirals (PF & Gratuity)',
      amount: retiralsAnnual,
      color: '#ec4899', // Pink
      percentage: Math.round((retiralsAnnual / safeTotal) * 100),
    },
  ].filter((item) => item.amount > 0);

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffsetRatio = 0;
  const renderedSegments = items.map((item) => {
    const ratio = item.amount / safeTotal;
    const strokeDasharray = `${ratio * circumference} ${circumference}`;
    const strokeDashoffset = -(currentOffsetRatio * circumference);
    currentOffsetRatio += ratio;
    return { item, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* SVG Donut */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {renderedSegments.map(({ item, strokeDasharray, strokeDashoffset }, idx) => (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          ))}
        </svg>

        {/* Center Label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b98a9]">Total CTC</span>
          <span className="text-sm font-black text-[#0e1017]">
            ₹{(annualCtc / 100000).toFixed(1)} LPA
          </span>
          <span className="text-[9px] text-[#5e6b7c]">₹{Math.round(annualCtc / 12).toLocaleString('en-IN')}/mo</span>
        </div>
      </div>

      {/* Legend & Percentages */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs w-full">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#edf2f7]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-[#0e1017] text-[11px] truncate">{item.label}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="font-bold text-[#0e1017] text-[11px]">
                ₹{item.amount.toLocaleString('en-IN')}
              </span>
              <span className="text-[9px] text-[#8b98a9] block">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
