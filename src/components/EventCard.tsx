import React from "react";
import { Event } from "../types";
import { Calendar, MapPin, Users, ChevronRight, LayoutGrid, CheckCircle } from "lucide-react";

interface EventCardProps {
  key?: string | number;
  event: Event;
  onSelect: (id: string) => void;
}

export default function EventCard({ event, onSelect }: EventCardProps) {
  const checkInCount = event.attendees.filter((a) => a.checkInStatus === "checked_in").length;
  const registrationCount = event.attendees.length;
  const capacityPercent = Math.min(Math.round((registrationCount / event.capacity) * 100), 100);

  return (
    <div
      id={`event-card-${event.id}`}
      className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all flex flex-col justify-between h-full group"
    >
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {event.category}
          </span>
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1 ${
            event.status === "active"
              ? "bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse"
              : event.status === "completed"
              ? "bg-slate-700/30 text-slate-400 border border-slate-700"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}>
            {event.status === "active" && (
              <span className="w-1 h-1 rounded-full bg-green-400"></span>
            )}
            {event.status}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-1">
          <h3
            onClick={() => onSelect(event.id)}
            className="font-bold text-slate-100 text-sm leading-tight group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1"
          >
            {event.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 h-8 leading-normal">{event.description}</p>
        </div>

        {/* Metadata */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium">{new Date(event.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Capacity Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Seats Registered
            </span>
            <span className="font-bold text-slate-200">{registrationCount} / {event.capacity}</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 75 ? "bg-amber-500" : "bg-indigo-500"
              }`}
              style={{ width: `${capacityPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Button footer */}
      <div className="pt-3 border-t border-slate-700/50 mt-4 flex items-center justify-between gap-2">
        <div className="text-[11px]">
          {event.status === "active" ? (
            <span className="text-green-400 font-medium flex items-center gap-1 font-mono">
              <CheckCircle className="w-3.5 h-3.5" />
              {checkInCount} check-ins
            </span>
          ) : (
            <span className="text-slate-400 font-medium">
              {event.sessions.length} sessions scheduled
            </span>
          )}
        </div>
        
        <button
          onClick={() => onSelect(event.id)}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 group/btn cursor-pointer"
        >
          {event.status === "upcoming" && event.sessions.length === 0 ? "Scheduler" : "Manage"}
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
