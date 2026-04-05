import React from 'react';
import { DailyRecord } from '../types';
import { MIN_DISTANCE_METERS } from '../constants';

interface Props {
  dailyRecords: Record<string, DailyRecord>;
}

export const ActivityCalendar: React.FC<Props> = ({ dailyRecords }) => {
  const dates = Object.keys(dailyRecords).sort();
  const lastIndex = dates.length - 1;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[800px] pt-14">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">Activity Log</h4>
        <div className="flex gap-1">
          {dates.map((date, index) => {
            const record = dailyRecords[date];
            const dist = record.totalDistance;
            const completed = record.isCompleted;
            
            // Format date for display: MMM d (e.g., Oct 27)
            // Parse YYYY-MM-DD
            const [y, m, d] = date.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            // Color scale based on distance
            let bgClass = 'bg-slate-100';
            if (completed) {
               if (dist < 2000) bgClass = 'bg-green-300';
               else if (dist < 5000) bgClass = 'bg-green-500';
               else bgClass = 'bg-green-700';
            } else if (dist > 0) {
               bgClass = 'bg-yellow-200'; // Did something but failed target
            } else {
               bgClass = 'bg-slate-100'; // Rest
            }

            const tooltipPositionClass =
              index <= 3
                ? 'left-0 translate-x-0'
                : index >= lastIndex - 3
                  ? 'right-0 translate-x-0'
                  : 'left-1/2 -translate-x-1/2';

            return (
              <div key={date} className="flex flex-col items-center gap-1 group relative">
                <div 
                  className={`w-3 h-10 rounded-sm ${bgClass} transition-all hover:opacity-80`} 
                />
                
                {/* Tooltip */}
                <div className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden w-32 rounded bg-slate-800 p-2 text-xs text-white shadow-lg group-hover:block ${tooltipPositionClass}`}>
                  <p className="font-bold">{dateLabel}</p>
                  <p>{(dist / 1000).toFixed(2)} km</p>
                  <p className={completed ? 'text-green-400' : 'text-red-400'}>
                    {completed ? 'Completed' : 'Missed'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-100 rounded-sm"></div> Missed</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-300 rounded-sm"></div> 1km+</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> 2km+</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-700 rounded-sm"></div> 5km+</div>
        </div>
      </div>
    </div>
  );
};
