import React, { useState } from "react";
import { Event, Session, Attendee } from "../types";
import SmartScheduler from "./SmartScheduler";
import {
  Calendar, MapPin, Users, Clock, Plus, Search, UserCheck, 
  UserX, ShieldCheck, Play, Square, ArrowLeft, LayoutGrid, CheckCircle
} from "lucide-react";

interface EventDetailsProps {
  event: Event;
  onBack: () => void;
  onScheduleApplied: (sessions: Session[]) => void;
  onCheckInToggle: (attendeeId: string, status: 'registered' | 'checked_in' | 'checked_out') => void;
  onRegisterAttendee: (name: string, email: string, company: string, interests: string[]) => void;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  simulationActive: boolean;
}

export default function EventDetails({
  event,
  onBack,
  onScheduleApplied,
  onCheckInToggle,
  onRegisterAttendee,
  onStartSimulation,
  onStopSimulation,
  simulationActive
}: EventDetailsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'attendees' | 'scheduler'>(
    event.sessions.length > 0 ? 'timeline' : 'scheduler'
  );

  // New Attendee form state
  const [showRegForm, setShowRegForm] = useState(false);
  const [attName, setAttName] = useState("");
  const [attEmail, setAttEmail] = useState("");
  const [attCompany, setAttCompany] = useState("");
  const [attInterests, setAttInterests] = useState("");

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'checked_in' | 'checked_out'>('all');

  const checkInCount = event.attendees.filter((a) => a.checkInStatus === "checked_in").length;
  const registrationCount = event.attendees.length;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attName.trim() || !attEmail.trim()) return;
    const interestsArray = attInterests
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    onRegisterAttendee(attName.trim(), attEmail.trim(), attCompany.trim(), interestsArray);

    // Reset Form
    setAttName("");
    setAttEmail("");
    setAttCompany("");
    setAttInterests("");
    setShowRegForm(false);
  };

  // Filter attendees
  const filteredAttendees = event.attendees.filter((att) => {
    const matchesSearch =
      att.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || att.checkInStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="event-details-panel" className="space-y-6 animate-fadeIn">
      {/* Back & Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-400 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500 font-medium font-mono">Events &rsaquo; Detail</span>
      </div>

      {/* Main Event Header Card */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-semibold">
                {event.category}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                event.status === "active"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : event.status === "completed"
                  ? "bg-slate-700/30 text-slate-400 border border-slate-700"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {event.status === "active" && <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>}
                {event.status}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-100 leading-tight">{event.title}</h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">{event.description}</p>
          </div>

          {/* Quick Active Indicators / Actions */}
          <div className="flex flex-wrap gap-3">
            {event.status === "active" && (
              <div className="flex items-center gap-2">
                {simulationActive ? (
                  <button
                    onClick={onStopSimulation}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer animate-pulse shrink-0"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" /> Stop Crowd Sim
                  </button>
                ) : (
                  <button
                    onClick={onStartSimulation}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Simulate Crowd Influx
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/50 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <div className="w-8 h-8 rounded bg-slate-900/50 flex items-center justify-center text-slate-500">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Date</p>
              <p className="font-semibold text-slate-200">{new Date(event.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-300">
            <div className="w-8 h-8 rounded bg-slate-900/50 flex items-center justify-center text-slate-500">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Venue Location</p>
              <p className="font-semibold text-slate-200">{event.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-300">
            <div className="w-8 h-8 rounded bg-slate-900/50 flex items-center justify-center text-slate-500">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">Attendance Capacity</p>
              <p className="font-semibold text-slate-200">{registrationCount} Registered ({event.capacity} max)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2 text-xs font-bold relative transition-colors cursor-pointer ${
            activeTab === 'timeline' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Timeline Schedule ({event.sessions.length})
          {activeTab === 'timeline' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attendees')}
          className={`pb-2 text-xs font-bold relative transition-colors cursor-pointer ${
            activeTab === 'attendees' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Attendee Tracking ({registrationCount})
          {activeTab === 'attendees' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('scheduler')}
          className={`pb-2 text-xs font-bold relative transition-colors cursor-pointer ${
            activeTab === 'scheduler' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          AI Scheduler Console
          {activeTab === 'scheduler' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 rounded-full"></span>
          )}
        </button>
      </div>

      {/* TAB 1: Timeline Schedule */}
      {activeTab === 'timeline' && (
        <div id="timeline-tab-content" className="space-y-4 animate-fadeIn">
          {event.sessions.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-12 text-center shadow-sm">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3 stroke-[1.5]" />
              <h4 className="font-bold text-slate-200 text-xs">No Sessions Scheduled Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                The timeline is currently blank. Head to the AI Scheduler Console tab to automatically map out speaker slots!
              </p>
              <button
                onClick={() => setActiveTab('scheduler')}
                className="mt-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-md"
              >
                Open AI Scheduler Console
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-700/50">
                {event.sessions
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((session) => (
                    <div
                      key={session.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-700/10 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[9px] font-semibold rounded uppercase">
                            {session.track}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Room: {session.room}</span>
                        </div>
                        <h4 className="font-bold text-slate-100 text-xs">{session.title}</h4>
                        <p className="text-[11px] text-slate-400 max-w-2xl leading-normal">{session.description}</p>
                        <p className="text-[11px] text-slate-500">
                          Speaker: <strong className="text-slate-300 font-semibold">{session.speaker}</strong>
                        </p>
                      </div>

                      <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t border-slate-700/30 md:border-0">
                        <span className="text-indigo-400 font-bold font-mono text-xs flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                          <Clock className="w-3.5 h-3.5" />
                          {session.startTime} - {session.endTime}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Seats: {session.capacity}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Attendee Management */}
      {activeTab === 'attendees' && (
        <div id="attendees-tab-content" className="space-y-4 animate-fadeIn">
          {/* Filter/Add Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/50 rounded-lg border border-slate-700 p-3 shadow-sm">
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs p-1.5 pl-9 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500"
              >
                <option value="all" className="bg-[#1e293b]">All RSVP States</option>
                <option value="registered" className="bg-[#1e293b]">Pre-Registered</option>
                <option value="checked_in" className="bg-[#1e293b]">Checked In</option>
                <option value="checked_out" className="bg-[#1e293b]">Checked Out</option>
              </select>
            </div>

            <button
              id="show-registration-form-btn"
              onClick={() => setShowRegForm(!showRegForm)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-md whitespace-nowrap self-start md:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Register Ticket
            </button>
          </div>

          {/* Quick Registration Form */}
          {showRegForm && (
            <form onSubmit={handleRegister} className="bg-[#1e293b] rounded-lg border border-slate-700 p-4 shadow-md space-y-3.5 animate-slideDown">
              <h4 className="font-bold text-slate-100 text-xs">Register Attendee Ticket</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={attName}
                    onChange={(e) => setAttName(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rachel@domain.com"
                    value={attEmail}
                    onChange={(e) => setAttEmail(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Company / Affiliation</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Innovations"
                    value={attCompany}
                    onChange={(e) => setAttCompany(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Interests (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Design & UX, Security"
                    value={attInterests}
                    onChange={(e) => setAttInterests(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRegForm(false)}
                  className="px-3 py-1.5 text-xs border border-slate-700 bg-slate-800 rounded text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition-colors shadow-md cursor-pointer"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          )}

          {/* SIMULATOR NOTIFICATION STATUS PANEL */}
          {event.status === "active" && (
            <div className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
              simulationActive 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-slate-900/50 border-slate-700 text-slate-400"
            }`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${simulationActive ? "bg-green-400 animate-ping" : "bg-slate-500"}`}></span>
                <p className="leading-relaxed">
                  {simulationActive 
                    ? "Simulator Active: Crowds are arriving in the lobby. Watch registrations & check-ins stream in live below!" 
                    : "Lobby Simulator Offline: Activate the sim to see a real-time influx of check-in events."}
                </p>
              </div>
              {simulationActive && (
                <span className="text-[10px] font-mono bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-bold animate-pulse shrink-0">
                  LIVE STREAMING
                </span>
              )}
            </div>
          )}

          {/* Attendees Grid / List */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700">
                    <th className="p-3 pl-4">Attendee</th>
                    <th className="p-3">Affiliation</th>
                    <th className="p-3">Track Interests</th>
                    <th className="p-3">Check-in Status</th>
                    <th className="p-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-slate-300">
                  {filteredAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No attendees match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendees.map((att) => (
                      <tr key={att.id} id={`attendee-row-${att.id}`} className="hover:bg-slate-700/10 transition-colors">
                        <td className="p-3 pl-4">
                          <div>
                            <p className="font-bold text-slate-200 text-xs">{att.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{att.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-300 font-medium">{att.company}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {att.interests.map((int) => (
                              <span key={int} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[9px] font-medium font-mono">
                                {int}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              att.checkInStatus === 'checked_in'
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : att.checkInStatus === 'checked_out'
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-slate-700 text-slate-400 border border-slate-600"
                            }`}>
                              {att.checkInStatus === 'checked_in' && "Checked In"}
                              {att.checkInStatus === 'checked_out' && "Checked Out"}
                              {att.checkInStatus === 'registered' && "Registered"}
                            </span>
                            {att.checkInTime && (
                              <p className="text-[9px] text-slate-500 font-mono">
                                {new Date(att.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <div className="inline-flex gap-1.5 justify-end">
                            {att.checkInStatus !== 'checked_in' && (
                              <button
                                onClick={() => onCheckInToggle(att.id, 'checked_in')}
                                className="px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" /> Check-in
                              </button>
                            )}
                            {att.checkInStatus === 'checked_in' && (
                              <button
                                onClick={() => onCheckInToggle(att.id, 'checked_out')}
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <UserX className="w-3 h-3" /> Check-out
                              </button>
                            )}
                            {att.checkInStatus !== 'registered' && (
                              <button
                                onClick={() => onCheckInToggle(att.id, 'registered')}
                                className="px-1.5 py-1 text-slate-500 hover:text-slate-300 rounded text-[10px] font-medium transition-all cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Smart Scheduler (embedded) */}
      {activeTab === 'scheduler' && (
        <div id="scheduler-tab-content" className="animate-fadeIn">
          <SmartScheduler event={event} onScheduleApplied={onScheduleApplied} />
        </div>
      )}
    </div>
  );
}
