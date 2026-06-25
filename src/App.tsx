import React, { useState, useEffect } from "react";
import { Event, Session, Attendee } from "./types";
import Dashboard from "./components/Dashboard";
import EventCard from "./components/EventCard";
import EventDetails from "./components/EventDetails";
import ActivityLog, { LogItem } from "./components/ActivityLog";
import { 
  Calendar, LayoutGrid, Activity, Sparkles, Plus, 
  MapPin, Users, Flame, Info, CheckCircle, AlertCircle, RefreshCw
} from "lucide-react";

export default function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'events'>('dashboard');
  
  // SSE Logs list
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State for new event
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("2026-06-25");
  const [newLoc, setNewLoc] = useState("");
  const [newCap, setNewCap] = useState(100);
  const [newCat, setNewCat] = useState("Technology");

  // Fetch initial events
  const loadEvents = () => {
    setIsLoading(true);
    fetch("/api/events")
      .then((res) => {
        if (!res.ok) throw new Error("Could not fetch events");
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Server-Sent Events live tracking stream subscription
  useEffect(() => {
    const eventSource = new EventSource("/api/events/live");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, data, timestamp } = payload;

        if (type === "connection") {
          console.log("Real-time telemetry SSE channel connected");
          return;
        }

        // Add real-time items to log stream
        let logMessage = "";
        let badgeColor = "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30";

        if (type === "attendee_status_change") {
          const { eventId, attendeeId, name, status, time } = data;
          logMessage = `${name} updated status to "${status.replace("_", " ")}"`;
          badgeColor = status === "checked_in" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30";

          // Reactively update attendee check-in status inside events state
          setEvents((prev) =>
            prev.map((e) => {
              if (e.id === eventId) {
                return {
                  ...e,
                  attendees: e.attendees.map((a) => {
                    if (a.id === attendeeId) {
                      return {
                        ...a,
                        checkInStatus: status,
                        checkInTime: time || undefined
                      };
                    }
                    return a;
                  })
                };
              }
              return e;
            })
          );
        } else if (type === "attendee_registered") {
          const { eventId, attendee } = data;
          logMessage = `New ticket registered: ${attendee.name} (${attendee.company})`;
          badgeColor = "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30";

          // Reactively add attendee inside events state
          setEvents((prev) =>
            prev.map((e) => {
              if (e.id === eventId) {
                // Avoid duplicating if already added
                if (e.attendees.some((a) => a.id === attendee.id)) return e;
                return {
                  ...e,
                  attendees: [...e.attendees, attendee]
                };
              }
              return e;
            })
          );
        } else if (type === "event_created") {
          logMessage = `Event Created: "${data.title}"`;
          badgeColor = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
          setEvents((prev) => {
            if (prev.some((e) => e.id === data.id)) return prev;
            return [...prev, data];
          });
        } else if (type === "event_updated") {
          logMessage = `Event configuration updated for "${data.title}"`;
          badgeColor = "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30";
          setEvents((prev) => prev.map((e) => (e.id === data.id ? data : e)));
        } else if (type === "simulation_ended") {
          logMessage = "Simulated lobby check-ins complete.";
          badgeColor = "bg-slate-700/30 text-slate-400 border border-slate-700/30";
          setSimulationActive(false);
        }

        if (logMessage) {
          const newLog: LogItem = {
            id: `log-${Date.now()}-${Math.random()}`,
            type,
            message: logMessage,
            timestamp: timestamp || new Date().toISOString(),
            badgeColor
          };
          setLogs((prev) => [newLog, ...prev].slice(0, 50)); // cap at 50 logs
        }
      } catch (err) {
        console.error("SSE Parsing issue:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection dropped. Retrying...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setActiveView("events");
  };

  const handleBackToFeed = () => {
    setSelectedEventId(null);
    setSimulationActive(false);
  };

  // REST API: Trigger automated schedule apply
  const handleScheduleApplied = (sessions: Session[]) => {
    if (!selectedEventId) return;
    
    // We update the local event, but also sync to the back-end!
    const targetEvent = events.find((e) => e.id === selectedEventId);
    if (!targetEvent) return;

    // Transition state: make the event "active" once a schedule is formulated so they can track attendance
    const updatedEvent = {
      ...targetEvent,
      sessions,
      status: "active" as const // auto activate event!
    };

    fetch(`/api/events/${selectedEventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedEvent)
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not save schedule");
        return res.json();
      })
      .then((data) => {
        setEvents((prev) => prev.map((e) => (e.id === selectedEventId ? data : e)));
      })
      .catch((err) => console.error("Error applying schedule:", err));
  };

  // REST API: Toggle attendee check-in status
  const handleCheckInToggle = (attendeeId: string, status: 'registered' | 'checked_in' | 'checked_out') => {
    if (!selectedEventId) return;

    fetch(`/api/events/${selectedEventId}/attendees/${attendeeId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not update check-in");
        return res.json();
      })
      .then((updatedAttendee) => {
        // SSE will trigger logs and state, but we also proactively update here to keep UI snappy
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === selectedEventId) {
              return {
                ...e,
                attendees: e.attendees.map((a) => (a.id === attendeeId ? updatedAttendee : a))
              };
            }
            return e;
          })
        );
      })
      .catch((err) => console.error(err));
  };

  // REST API: Register a ticket
  const handleRegisterAttendee = (name: string, email: string, company: string, interests: string[]) => {
    if (!selectedEventId) return;

    fetch(`/api/events/${selectedEventId}/attendees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, company, interests })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not register ticket");
        return res.json();
      })
      .then((newAttendee) => {
        // snaps local updates immediately
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === selectedEventId) {
              if (e.attendees.some((a) => a.id === newAttendee.id)) return e;
              return {
                ...e,
                attendees: [...e.attendees, newAttendee]
              };
            }
            return e;
          })
        );
      })
      .catch((err) => console.error(err));
  };

  // REST API: Start simulation
  const handleStartSimulation = () => {
    if (!selectedEventId) return;
    setSimulationActive(true);
    fetch(`/api/events/${selectedEventId}/simulate`, { method: "POST" })
      .catch((err) => {
        console.error("Simulation failed to start:", err);
        setSimulationActive(false);
      });
  };

  // REST API: Stop simulation
  const handleStopSimulation = () => {
    if (!selectedEventId) return;
    setSimulationActive(false);
    fetch(`/api/events/${selectedEventId}/simulate/stop`, { method: "POST" })
      .catch((err) => console.error("Failed to stop simulation:", err));
  };

  // REST API: Create Event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc.trim(),
        date: newDate,
        location: newLoc.trim() || "Virtual",
        capacity: newCap,
        category: newCat
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not create event");
        return res.json();
      })
      .then((newEvent) => {
        setEvents((prev) => [...prev, newEvent]);
        setShowCreateModal(false);
        setNewTitle("");
        setNewDesc("");
        setNewLoc("");
        // Redirect to scheduler immediately for the newly created upcoming event
        setSelectedEventId(newEvent.id);
        setActiveView("events");
      })
      .catch((err) => console.error(err));
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner Header */}
      <header className="bg-[#1e293b] border-b border-slate-800 sticky top-0 z-40 h-14">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold italic text-base shadow-lg shadow-indigo-600/10">
              E
            </div>
            <div>
              <h1 className="font-semibold text-slate-100 text-sm leading-none">EventPulse Pro</h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-wider mt-0.5 uppercase">Telemetry Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] uppercase font-bold tracking-wider rounded">System Online</span>
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] uppercase font-bold tracking-wider rounded font-mono">Sync Active</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => { setActiveView("dashboard"); setSelectedEventId(null); }}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeView === "dashboard" && !selectedEventId ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => { setActiveView("events"); setSelectedEventId(null); }}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeView === "events" && !selectedEventId ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Events Hub
              </button>
            </nav>

            <button
              id="new-event-btn"
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> New Event
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Workspace Main View Section */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="h-[400px] bg-slate-800/40 rounded-lg border border-slate-700 flex items-center justify-center flex-col">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
              <p className="text-xs text-slate-400">Syncing database registries...</p>
            </div>
          ) : selectedEvent ? (
            /* Selected Event detail view */
            <EventDetails
              event={selectedEvent}
              onBack={handleBackToFeed}
              onScheduleApplied={handleScheduleApplied}
              onCheckInToggle={handleCheckInToggle}
              onRegisterAttendee={handleRegisterAttendee}
              onStartSimulation={handleStartSimulation}
              onStopSimulation={handleStopSimulation}
              simulationActive={simulationActive}
            />
          ) : activeView === "dashboard" ? (
            /* Dashboard tab view */
            <Dashboard events={events} onSelectEvent={handleSelectEvent} />
          ) : (
            /* Event Feed tab view */
            <div id="events-grid-view" className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-100">Registered Events Feed</h2>
                  <p className="text-xs text-slate-400">Monitor scheduler status and track attendee capacities</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} onSelect={handleSelectEvent} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Workspace Side Activity Logs panel */}
        <div className="space-y-6 lg:border-l lg:border-slate-800 lg:pl-6">
          <ActivityLog logs={logs} onClear={() => setLogs([])} />

          {/* Quick instructions widget */}
          <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 space-y-2 text-xs text-slate-300">
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Live Telemetry Guide
            </h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Our telemetry framework is connected directly to a persistent Server-Sent Events stream:
            </p>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-400 font-mono">
              <li>Open <strong className="text-slate-200">Global Tech Synergy</strong> to test live check-ins.</li>
              <li>Click <strong className="text-slate-200">Simulate Crowd Influx</strong> to witness automated lobby entries updating check-in charts in real-time.</li>
              <li>Schedule <strong className="text-indigo-400">AI Frontiers & Robotics</strong> using server-side Gemini constraint resolution!</li>
            </ul>
          </div>
        </div>
      </main>

      {/* CREATE EVENT MODAL DIALOG */}
      {showCreateModal && (
        <div id="create-event-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#1e293b] rounded-lg max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden animate-scaleUp">
            <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
              <h3 className="font-bold text-slate-100 text-xs">Create New Event</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean Energy Innovations 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Description</label>
                <textarea
                  placeholder="Enter high-level details of the event topic..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 h-16 resize-none placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Category</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 bg-slate-900"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Robotics & AI">Robotics & AI</option>
                    <option value="Design & UX">Design & UX</option>
                    <option value="Science">Science</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Venue / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Convention Suite A"
                    value={newLoc}
                    onChange={(e) => setNewLoc(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={newCap}
                    onChange={(e) => setNewCap(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3.5 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs border border-slate-700 bg-slate-800 rounded text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition-colors shadow-md cursor-pointer"
                >
                  Create & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="bg-slate-900/50 border-t border-slate-800 py-4 mt-12 text-center text-[9px] text-slate-500 font-mono tracking-wide">
        &copy; 2026 EventPulse Pro Telemetry Sandbox. Handcrafted with React & Gemini.
      </footer>
    </div>
  );
}
