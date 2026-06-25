import React from "react";
import { Activity, UserCheck, UserPlus, AlertCircle, Calendar } from "lucide-react";

export interface LogItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  badgeColor: string;
}

interface ActivityLogProps {
  logs: LogItem[];
  onClear: () => void;
}

export default function ActivityLog({ logs, onClear }: ActivityLogProps) {
  return (
    <div id="activity-log-panel" className="bg-slate-800/50 rounded-lg border border-slate-700 shadow-sm p-4 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center text-green-400 animate-pulse">
            <Activity id="activity-icon-spinner" className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-xs">Live Activity Feed</h3>
            <p className="text-[10px] text-slate-400">Real-time attendee updates</p>
          </div>
        </div>
        {logs.length > 0 && (
          <button
            id="clear-logs-btn"
            onClick={onClear}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer uppercase font-bold"
          >
            Clear Feed
          </button>
        )}
      </div>

      <div id="activity-logs-container" className="flex-1 overflow-y-auto mt-3 space-y-2 max-h-[360px] pr-1 scrollbar-thin">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <Activity className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
            <p className="text-[11px] text-slate-400">Waiting for live scans or updates...</p>
            <p className="text-[10px] text-slate-500 mt-1">Try starting the simulated crowd influx!</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              id={`log-${log.id}`}
              className="p-2.5 bg-slate-900/40 rounded border border-slate-700/30 flex items-start gap-2.5 hover:bg-slate-700/20 transition-colors duration-150 animate-fadeIn"
            >
              <div className={`mt-0.5 w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs font-bold ${log.badgeColor}`}>
                {log.type === "attendee_status_change" && <UserCheck className="w-3.5 h-3.5" />}
                {log.type === "attendee_registered" && <UserPlus className="w-3.5 h-3.5" />}
                {log.type === "event_created" && <Calendar className="w-3.5 h-3.5" />}
                {log.type !== "attendee_status_change" && log.type !== "attendee_registered" && log.type !== "event_created" && (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-300 leading-normal">{log.message}</p>
                <span className="text-[9px] font-mono text-slate-500 mt-0.5 block">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
