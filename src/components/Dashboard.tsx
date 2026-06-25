import React from "react";
import { Event } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Users, CheckCircle, Flame } from "lucide-react";

interface DashboardProps {
  events: Event[];
  onSelectEvent: (id: string) => void;
}

const COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#f87171"];

export default function Dashboard({ events, onSelectEvent }: DashboardProps) {
  // Aggregate Metrics
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === "active").length;
  
  let totalRegistered = 0;
  let totalCheckedIn = 0;
  
  events.forEach((e) => {
    totalRegistered += e.attendees.length;
    totalCheckedIn += e.attendees.filter((a) => a.checkInStatus === "checked_in").length;
  });

  const checkInRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  // Recharts: Event Comparative Analytics
  const eventChartData = events.map((e) => ({
    name: e.title.length > 15 ? e.title.substring(0, 13) + "..." : e.title,
    "Registered": e.attendees.length,
    "Checked In": e.attendees.filter((a) => a.checkInStatus === "checked_in").length,
    id: e.id,
  }));

  // Recharts: Interests breakdown
  const interestCounts: Record<string, number> = {};
  events.forEach((e) => {
    e.attendees.forEach((a) => {
      a.interests.forEach((interest) => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });
  });

  const interestChartData = Object.entries(interestCounts).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <div id="dashboard-tab-content" className="space-y-6 animate-fadeIn">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div id="stat-card-total-events" className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm flex items-center justify-between hover:border-slate-600 transition-colors">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Managed</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalEvents}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div id="stat-card-active" className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm flex items-center justify-between hover:border-slate-600 transition-colors">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Events</span>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-bold text-slate-100">{activeEvents}</h3>
              {activeEvents > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded bg-green-500/10 flex items-center justify-center text-green-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div id="stat-card-registered" className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm flex items-center justify-between hover:border-slate-600 transition-colors">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RSVP Registries</span>
            <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalRegistered}</h3>
          </div>
          <div className="w-10 h-10 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div id="stat-card-checkedin" className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm flex items-center justify-between hover:border-slate-600 transition-colors">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Check-ins</span>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{totalCheckedIn}</h3>
              <span className="text-[11px] font-mono font-bold text-green-400">{checkInRate}%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center text-amber-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Attendance Chart */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Attendance & RSVP Rates</h3>
            <p className="text-[11px] text-slate-400">Comparing total registrations to checked-in attendees per event</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#f8fafc" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Registered" fill="#334155" radius={[3, 3, 0, 0]} barSize={24} />
                <Bar dataKey="Checked In" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interests Distribution Chart */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Popular Attendee Interests</h3>
            <p className="text-[11px] text-slate-400">Track allocations based on tags</p>
          </div>
          <div className="h-40 w-full relative flex items-center justify-center my-2">
            {interestChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interestChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {interestChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px" }}
                    itemStyle={{ fontSize: "11px", color: "#f8fafc" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No preference tags registered yet</p>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-bold text-slate-100">{totalRegistered}</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-mono">RSVPs</span>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {interestChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="text-slate-300 font-medium text-[11px]">{item.name}</span>
                </div>
                <span className="text-slate-100 font-bold font-mono text-[11px]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events List / Shortcuts */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Event Shortcuts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => (
            <div
              key={e.id}
              onClick={() => onSelectEvent(e.id)}
              className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col justify-between h-32 hover:shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    e.status === "active" ? "bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse" : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  }`}>
                    {e.status === "active" ? "Active" : "Upcoming"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{e.date}</span>
                </div>
                <h4 className="font-semibold text-slate-100 text-sm mt-1.5 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {e.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {e.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-700/50 mt-1.5">
                <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {e.attendees.length} RSVPs
                </span>
                <span className="text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
                  View detail &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

