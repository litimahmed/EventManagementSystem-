import React, { useState, useEffect } from "react";
import { Event, ProposedTopic, Session } from "../types";
import { Sparkles, Clock, MapPin, Plus, Trash2, Calendar, AlertCircle, RefreshCw, LayoutGrid, Check, Info } from "lucide-react";

interface SmartSchedulerProps {
  event: Event;
  onScheduleApplied: (sessions: Session[]) => void;
}

export default function SmartScheduler({ event, onScheduleApplied }: SmartSchedulerProps) {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Configuration States
  const [rooms, setRooms] = useState<string[]>(["Summit Suite A", "Summit Suite B", "Grand Ballroom"]);
  const [newRoom, setNewRoom] = useState("");
  const [tracks, setTracks] = useState<string[]>(["Core Technology", "Design & UX", "Safety & Policy"]);
  const [newTrack, setNewTrack] = useState("");
  
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [lunchBreak, setLunchBreak] = useState(true);

  // Proposed topics list
  const [topics, setTopics] = useState<ProposedTopic[]>([]);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicSpeaker, setNewTopicSpeaker] = useState("");
  const [newTopicDuration, setNewTopicDuration] = useState(60);
  const [newTopicTrack, setNewTopicTrack] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");

  // Result State
  const [scheduledSessions, setScheduledSessions] = useState<Session[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");

  // Load initial proposed topics from server if available
  useEffect(() => {
    fetch(`/api/events/${event.id}/proposed-topics`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load topics");
        return res.json();
      })
      .then((data) => {
        setTopics(data);
        if (data.length > 0 && tracks.length === 3) {
          // Sync tracks from pre-seeded topics if they exist
          const uniqueTracks: string[] = Array.from(new Set(data.map((t: any) => t.track))).filter(Boolean) as string[];
          if (uniqueTracks.length > 0) setTracks(uniqueTracks);
        }
      })
      .catch(() => {
        // Fallback to local default topics
        setTopics([
          {
            id: "prop-local-1",
            title: "Scaling Distributed Graph State",
            description: "How to design mesh architectures for synchronized check-ins.",
            speaker: "Sarah Jenkins",
            durationMinutes: 60,
            track: "Core Technology"
          }
        ]);
      });
  }, [event.id]);

  // Loading animations steps simulation
  useEffect(() => {
    if (!loading) return;
    const steps = [
      "Contacting Gemini AI Scheduler...",
      "Analyzing proposed topic topics and session constraints...",
      "Checking speaker schedules to eliminate overlaps...",
      "Assigning optimal rooms and track slots...",
      "Formulating event manager summary insights..."
    ];
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  const loadingMessages = [
    "Contacting Gemini AI Scheduler...",
    "Analyzing proposed topic topics and session constraints...",
    "Checking speaker schedules to eliminate overlaps...",
    "Assigning optimal rooms and track slots...",
    "Formulating event manager summary insights..."
  ];

  // Room additions
  const addRoom = () => {
    if (newRoom.trim() && !rooms.includes(newRoom.trim())) {
      setRooms([...rooms, newRoom.trim()]);
      setNewRoom("");
    }
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    }
  };

  // Track additions
  const addTrack = () => {
    if (newTrack.trim() && !tracks.includes(newTrack.trim())) {
      setTracks([...tracks, newTrack.trim()]);
      setNewTrack("");
    }
  };

  const removeTrack = (index: number) => {
    if (tracks.length > 1) {
      setTracks(tracks.filter((_, i) => i !== index));
    }
  };

  // Proposed topic additions
  const addTopic = () => {
    if (!newTopicTitle.trim() || !newTopicSpeaker.trim()) return;
    const newTopic: ProposedTopic = {
      id: `prop-custom-${Date.now()}`,
      title: newTopicTitle.trim(),
      description: newTopicDesc.trim(),
      speaker: newTopicSpeaker.trim(),
      durationMinutes: Number(newTopicDuration),
      track: newTopicTrack || tracks[0] || "General"
    };

    setTopics([...topics, newTopic]);
    setNewTopicTitle("");
    setNewTopicSpeaker("");
    setNewTopicDesc("");
  };

  const removeTopic = (id: string) => {
    setTopics(topics.filter((t) => t.id !== id));
  };

  // Automated scheduling API trigger
  const runAutoSchedule = async () => {
    if (topics.length === 0) {
      setError("Please add at least one proposed topic to schedule.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/events/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTitle: event.title,
          description: event.description,
          date: event.date,
          startTime,
          endTime,
          lunchBreak,
          rooms,
          tracks,
          proposedTopics: topics
        })
      });

      if (!response.ok) {
        throw new Error("Automated scheduling service encountered an issue.");
      }

      const data = await response.json();
      setScheduledSessions(data.sessions || []);
      setAiSummary(data.summary || "");
    } catch (err: any) {
      setError(err.message || "Failed to organize schedule.");
    } finally {
      setLoading(false);
    }
  };

  const applySchedule = () => {
    if (scheduledSessions.length > 0) {
      onScheduleApplied(scheduledSessions);
    }
  };

  return (
    <div id="smart-scheduler-module" className="space-y-6 animate-fadeIn">
      {/* Configuration Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-700 text-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-100">Automated AI Event Scheduler</h3>
            </div>
            <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
              Arrange speaker sessions and distribute them across rooms with zero collisions. Powered by server-side Gemini AI constraints optimization.
            </p>
          </div>
          {scheduledSessions.length === 0 && (
            <button
              id="generate-ai-schedule-btn"
              onClick={runAutoSchedule}
              disabled={loading || topics.length === 0}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded text-xs transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-auto shadow-sm shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Optimize Timeline &rarr;
            </button>
          )}
        </div>
      </div>

      {loading ? (
        /* Highly immersive progress loading screen */
        <div id="scheduler-loader-screen" className="bg-slate-800/50 rounded-lg border border-slate-700 p-8 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin"></div>
            <Sparkles className="w-5 h-5 text-amber-400 absolute animate-ping" />
          </div>
          <h4 className="text-slate-100 font-bold text-xs transition-all duration-300 font-mono">
            {loadingMessages[loadingStep]}
          </h4>
          <p className="text-[11px] text-slate-400 max-w-sm mt-1.5">
            Evaluating speaker availability and building conflict matrices...
          </p>
          <div className="w-64 bg-slate-950 h-1.5 rounded-full overflow-hidden mt-6 border border-slate-800">
            <div
              className="bg-indigo-500 h-full transition-all duration-1000 ease-out"
              style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
            ></div>
          </div>
        </div>
      ) : scheduledSessions.length > 0 ? (
        /* SCHEDULE GENERATED PREVIEW PANEL */
        <div id="schedule-generated-preview" className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-green-300 font-bold text-xs">Optimal Schedule Draft Complete</h4>
                <p className="text-green-400 text-[11px] mt-0.5">
                  Arranged {scheduledSessions.length} sessions. Confirmed clash-free room and speaker allocations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                id="reset-schedule-draft-btn"
                onClick={() => setScheduledSessions([])}
                className="px-3 py-1.5 text-xs border border-slate-700 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Reconfigure
              </button>
              <button
                id="apply-schedule-btn"
                onClick={applySchedule}
                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold transition-colors shadow-md cursor-pointer"
              >
                Apply Schedule
              </button>
            </div>
          </div>

          {/* AI Insights Explanation */}
          {aiSummary && (
            <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20 flex gap-3">
              <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs leading-relaxed text-slate-300 space-y-1">
                <h5 className="font-bold text-indigo-300 text-xs">AI Planning Insights</h5>
                <p className="text-[11px]">{aiSummary}</p>
              </div>
            </div>
          )}

          {/* Sessions Grid */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700/50">
              <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider">Proposed Timeline Draft</h4>
            </div>
            <div className="divide-y divide-slate-700/50">
              {scheduledSessions.map((sess) => (
                <div key={sess.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-700/10 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[9px] font-semibold rounded uppercase border border-slate-600">
                        {sess.track}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {sess.id}</span>
                    </div>
                    <h5 className="font-bold text-slate-100 text-xs">{sess.title}</h5>
                    <p className="text-[11px] text-slate-400 max-w-xl leading-normal">{sess.description}</p>
                    <p className="text-[11px] text-slate-500">Speaker: <strong className="text-slate-300 font-semibold">{sess.speaker}</strong></p>
                  </div>
                  <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-2 pt-3 md:pt-0 border-t border-slate-700/30 md:border-0">
                    <span className="text-indigo-400 font-bold font-mono text-xs flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5" />
                      {sess.startTime} - {sess.endTime}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {sess.room}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* DUAL CONFIGURATION INTERFACE */
        <div id="scheduler-config-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Limits & Infrastructure Config */}
          <div className="space-y-6">
            {/* Event Hours */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2 pb-2.5 border-b border-slate-700/50 uppercase tracking-wider font-mono">
                <Clock className="w-4 h-4 text-indigo-400" />
                Schedule Limits
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 pt-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lunchBreak}
                  onChange={(e) => setLunchBreak(e.target.checked)}
                  className="rounded-sm border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
                Include standard 1-hour Lunch break
              </label>
            </div>

            {/* Room Allocations */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2 pb-2.5 border-b border-slate-700/50 uppercase tracking-wider font-mono">
                <MapPin className="w-4 h-4 text-green-400" />
                Room Assignments
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Summit Room C"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="flex-1 text-xs p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                />
                <button
                  id="add-room-btn"
                  onClick={addRoom}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {rooms.map((room, idx) => (
                  <span key={room} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/50 text-[11px] font-medium text-slate-300 border border-slate-700 font-mono">
                    {room}
                    {rooms.length > 1 && (
                      <button onClick={() => removeRoom(idx)} className="text-slate-500 hover:text-red-400 ml-1 cursor-pointer text-[12px] font-bold">
                        &times;
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Tracks Allocations */}
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2 pb-2.5 border-b border-slate-700/50 uppercase tracking-wider font-mono">
                <LayoutGrid className="w-4 h-4 text-indigo-400" />
                Event Tracks
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., General Sessions"
                  value={newTrack}
                  onChange={(e) => setNewTrack(e.target.value)}
                  className="flex-1 text-xs p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                />
                <button
                  id="add-track-btn"
                  onClick={addTrack}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded text-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tracks.map((track, idx) => (
                  <span key={track} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 text-[11px] font-medium text-indigo-400 border border-indigo-500/20 font-mono">
                    {track}
                    {tracks.length > 1 && (
                      <button onClick={() => removeTrack(idx)} className="text-indigo-400 hover:text-red-400 ml-1 cursor-pointer text-[12px] font-bold">
                        &times;
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Proposed Topics Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/50">
                <div>
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Proposed Topics Queue</h4>
                  <p className="text-[11px] text-slate-400">Total {topics.length} topics ready for automated organization</p>
                </div>
              </div>

              {/* Add Custom proposed topic */}
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 space-y-3">
                <h5 className="font-bold text-slate-300 text-xs">Add New Proposal</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Topic Title"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    className="text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Presenter Name"
                    value={newTopicSpeaker}
                    onChange={(e) => setNewTopicSpeaker(e.target.value)}
                    className="text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Duration (mins)"
                      value={newTopicDuration}
                      onChange={(e) => setNewTopicDuration(Number(e.target.value))}
                      className="text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 w-24 font-mono placeholder-slate-500"
                    />
                    <select
                      value={newTopicTrack}
                      onChange={(e) => setNewTopicTrack(e.target.value)}
                      className="text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 flex-1"
                    >
                      <option value="" className="bg-[#1e293b]">Choose Track</option>
                      {tracks.map((t) => (
                        <option key={t} value={t} className="bg-[#1e293b]">{t}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Brief description (optional)"
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    className="text-xs p-2 bg-slate-800 border border-slate-700 rounded text-slate-100 outline-hidden focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
                <button
                  id="add-topic-queue-btn"
                  onClick={addTopic}
                  disabled={!newTopicTitle.trim() || !newTopicSpeaker.trim()}
                  className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded text-white font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add to Queue
                </button>
              </div>

              {/* Topics Queue List */}
              <div className="space-y-2.5">
                {topics.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Queue is empty. Add a custom speaker proposal above.</p>
                  </div>
                ) : (
                  topics.map((topic) => (
                    <div key={topic.id} className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-300 text-xs">{topic.speaker}</span>
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-semibold uppercase">
                            {topic.track}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5 font-mono">
                            <Clock className="w-3 h-3" />
                            {topic.durationMinutes}m
                          </span>
                        </div>
                        <h5 className="font-semibold text-slate-100 text-xs mt-1 truncate">{topic.title}</h5>
                        {topic.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate leading-relaxed">{topic.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeTopic(topic.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-3 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Optimization Error: </span>
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
