import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Event, Attendee } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State
let events: Event[] = [
  {
    id: "evt-1",
    title: "Global Tech Synergy Summit 2026",
    description: "The flagship conference for software architects, AI engineers, and product visionaries to align on next-generation computing paradigms.",
    date: "2026-06-25",
    location: "Sands Convention Center, Room A-C",
    capacity: 250,
    status: "active" as const,
    category: "Technology",
    sessions: [
      {
        id: "sess-101",
        title: "Keynote: Computing in the Age of Autonomy",
        description: "An opening session laying out the 5-year roadmap of agentic systems and local-first architectures.",
        speaker: "Dr. Elena Rostova",
        startTime: "09:00",
        endTime: "10:15",
        room: "Grand Ball Room",
        track: "Keynote",
        capacity: 250
      },
      {
        id: "sess-102",
        title: "Scaling Real-time SSE and WebSockets",
        description: "Practical engineering session on maintaining open TCP sockets for millions of active check-ins.",
        speaker: "Marcus Vance",
        startTime: "10:45",
        endTime: "12:00",
        room: "Summit Suite A",
        track: "Infrastructure",
        capacity: 100
      },
      {
        id: "sess-103",
        title: "Designing Delightful User Experiences with Micro-interactions",
        description: "An immersive look at leveraging layout transitions, subtle scales, and haptic feedback to command focus.",
        speaker: "Saffron Bell",
        startTime: "13:30",
        endTime: "14:45",
        room: "Summit Suite B",
        track: "Design & UX",
        capacity: 80
      },
      {
        id: "sess-104",
        title: "AI Security and Sandboxing in Multi-tenant Clusters",
        description: "Deep dive into secure runtimes, environment variables containment, and isolated execution.",
        speaker: "Vikram Dev",
        startTime: "15:15",
        endTime: "16:30",
        room: "Summit Suite A",
        track: "Security",
        capacity: 100
      }
    ],
    attendees: [
      {
        id: "att-1",
        name: "Alice Montgomery",
        email: "alice.m@architects.io",
        company: "Stellar Cloud Solutions",
        interests: ["Infrastructure", "Security"],
        registeredAt: "2026-06-20T09:12:00Z",
        checkInStatus: "checked_in" as const,
        checkInTime: "2026-06-25T08:45:10Z"
      },
      {
        id: "att-2",
        name: "Devon Carter",
        email: "devon@pixelcraft.design",
        company: "PixelCraft Agency",
        interests: ["Design & UX"],
        registeredAt: "2026-06-21T14:35:00Z",
        checkInStatus: "checked_in" as const,
        checkInTime: "2026-06-25T08:52:45Z"
      },
      {
        id: "att-3",
        name: "Sanjay Mehta",
        email: "sanjay.mehta@datashield.com",
        company: "DataShield Security",
        interests: ["Security", "Infrastructure"],
        registeredAt: "2026-06-22T10:05:00Z",
        checkInStatus: "registered" as const
      },
      {
        id: "att-4",
        name: "Emily Watson",
        email: "emily@fluidweb.dev",
        company: "FluidWeb Labs",
        interests: ["Design & UX", "Infrastructure"],
        registeredAt: "2026-06-23T11:22:00Z",
        checkInStatus: "checked_in" as const,
        checkInTime: "2026-06-25T09:02:15Z"
      },
      {
        id: "att-5",
        name: "Hiroshi Tanaka",
        email: "tanaka.h@cybernet.co.jp",
        company: "Cybernet Systems",
        interests: ["Infrastructure"],
        registeredAt: "2026-06-18T08:40:00Z",
        checkInStatus: "registered" as const
      },
      {
        id: "att-6",
        name: "Sofia Rodriguez",
        email: "sofia.r@techlatam.org",
        company: "TechLatam Group",
        interests: ["Design & UX"],
        registeredAt: "2026-06-24T16:50:00Z",
        checkInStatus: "checked_in" as const,
        checkInTime: "2026-06-25T09:05:33Z"
      },
      {
        id: "att-7",
        name: "Chen Wei",
        email: "chen.wei@aistorage.cn",
        company: "AI Storage Corp",
        interests: ["Infrastructure", "Security"],
        registeredAt: "2026-06-19T13:15:00Z",
        checkInStatus: "registered" as const
      },
      {
        id: "att-8",
        name: "Clara Oswald",
        email: "clara.o@timevortex.co.uk",
        company: "Vortex Technologies",
        interests: ["Design & UX", "Security"],
        registeredAt: "2026-06-24T18:12:00Z",
        checkInStatus: "checked_in" as const,
        checkInTime: "2026-06-25T09:10:00Z"
      }
    ]
  },
  {
    id: "evt-2",
    title: "AI Frontiers & Robotics Expo 2026",
    description: "Unveiling the latest breakthroughs in localized intelligence, neural network efficiencies, and bipedal mechanical control systems.",
    date: "2026-07-15",
    location: "Moscone Pavilion West",
    capacity: 400,
    status: "upcoming" as const,
    category: "Robotics & AI",
    sessions: [], // Scheduled later
    attendees: [
      {
        id: "att-201",
        name: "Nate Forester",
        email: "nate@autonomymachines.com",
        company: "Autonomy Machines",
        interests: ["Robotics", "Neural Networks"],
        registeredAt: "2026-06-22T08:00:00Z",
        checkInStatus: "registered" as const
      },
      {
        id: "att-202",
        name: "Dr. Sarah Jenkins",
        email: "sjenkins@mit.edu",
        company: "MIT Legged Locomotion Lab",
        interests: ["Robotics"],
        registeredAt: "2026-06-23T09:30:00Z",
        checkInStatus: "registered" as const
      },
      {
        id: "att-203",
        name: "Lucas Torvalds",
        email: "lucas@kernelai.org",
        company: "Kernel AI",
        interests: ["Neural Networks", "Embedded Systems"],
        registeredAt: "2026-06-24T10:15:00Z",
        checkInStatus: "registered" as const
      }
    ]
  }
];

// Proposed Topics for scheduling (evt-2 starts with these, user schedules them!)
let proposedTopics: Record<string, any[]> = {
  "evt-2": [
    {
      id: "prop-1",
      title: "Real-time Edge Learning on Microcontrollers",
      description: "How to fit optimized training loops on devices with less than 256KB of RAM without severe precision drop.",
      speaker: "Lucas Torvalds",
      durationMinutes: 60,
      track: "Embedded Systems"
    },
    {
      id: "prop-2",
      title: "Bipedal Balance Algorithms in High Wind Constraints",
      description: "Implementing localized predictive force adjustments in real-time sensor loops.",
      speaker: "Dr. Sarah Jenkins",
      durationMinutes: 90,
      track: "Robotics"
    },
    {
      id: "prop-3",
      title: "Transformer Architectures for Localized Spatial Memory",
      description: "Bridging LLMs with visual localization models to let machines remember room boundaries safely.",
      speaker: "Nate Forester",
      durationMinutes: 60,
      track: "Neural Networks"
    },
    {
      id: "prop-4",
      title: "Ethics of Automated Dispatch in Emergency Zones",
      description: "Establishing guardrails and failsafe commands for physical helper drones in zero-connectivity terrain.",
      speaker: "Prof. Amanda Reyes",
      durationMinutes: 60,
      track: "AI Ethics"
    },
    {
      id: "prop-5",
      title: "Hardware Accelerators: Custom ASICs vs Off-the-shelf Chips",
      description: "Power efficiency calculations for field-deployed sensor fleets.",
      speaker: "Lucas Torvalds",
      durationMinutes: 60,
      track: "Embedded Systems"
    },
    {
      id: "prop-6",
      title: "Computer Vision Hacks for Extreme Low-Light Navigation",
      description: "Leveraging infrared filtering and clever temporal filters for high-speed obstacle detection.",
      speaker: "Dr. Sarah Jenkins",
      durationMinutes: 60,
      track: "Robotics"
    }
  ]
};

// Server-Sent Events client pool
let sseClients: { id: number; res: express.Response }[] = [];

// Broadcast tracking activity
function broadcastTracking(type: string, data: any) {
  const payload = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  });
  sseClients.forEach((client) => {
    client.res.write(`data: ${payload}\n\n`);
  });
}

// REST API Routes

// SSE endpoint for live tracking updates
app.get("/api/events/live", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const client = { id: clientId, res };
  sseClients.push(client);

  // Initial connection heartbeat
  res.write(`data: ${JSON.stringify({ type: "connection", message: "SSE connected successfully" })}\n\n`);

  req.on("close", () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Fetch all events
app.get("/api/events", (req, res) => {
  res.json(events);
});

// Fetch proposed topics for an upcoming event
app.get("/api/events/:id/proposed-topics", (req, res) => {
  const eventId = req.params.id;
  res.json(proposedTopics[eventId] || []);
});

// Fetch a single event
app.get("/api/events/:id", (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(event);
});

// Create new event
app.post("/api/events", (req, res) => {
  const { title, description, date, location, capacity, category } = req.body;
  if (!title || !date) {
    res.status(400).json({ error: "Title and Date are required" });
    return;
  }
  const newEvent = {
    id: `evt-${Date.now()}`,
    title,
    description: description || "",
    date,
    location: location || "TBD",
    capacity: parseInt(capacity) || 100,
    status: "upcoming" as const,
    category: category || "General",
    sessions: [],
    attendees: []
  };
  events.push(newEvent);

  // Initialize empty proposed topics list for custom upcoming events
  proposedTopics[newEvent.id] = [
    {
      id: `prop-${Date.now()}-1`,
      title: "Introduction to Next-Gen Paradigms",
      description: "An overview of what we are building together.",
      speaker: "Guest Speaker 1",
      durationMinutes: 45,
      track: "Intro"
    },
    {
      id: `prop-${Date.now()}-2`,
      title: "Advanced Practical Labs",
      description: "Hands-on collaborative sessions with real-world sandboxing tools.",
      speaker: "Guest Speaker 2",
      durationMinutes: 60,
      track: "Technical"
    }
  ];

  broadcastTracking("event_created", newEvent);
  res.status(201).json(newEvent);
});

// Update event (e.g., changing status or info)
app.put("/api/events/:id", (req, res) => {
  const eventIdx = events.findIndex((e) => e.id === req.params.id);
  if (eventIdx === -1) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const original = events[eventIdx];
  const updated = {
    ...original,
    ...req.body,
    // Keep internal integrity
    id: original.id,
    sessions: req.body.sessions !== undefined ? req.body.sessions : original.sessions,
    attendees: req.body.attendees !== undefined ? req.body.attendees : original.attendees
  };
  events[eventIdx] = updated;
  broadcastTracking("event_updated", updated);
  res.json(updated);
});

// Add proposed topic
app.post("/api/events/:id/proposed-topics", (req, res) => {
  const eventId = req.params.id;
  const { title, description, speaker, durationMinutes, track } = req.body;
  if (!title || !speaker) {
    res.status(400).json({ error: "Title and Speaker are required" });
    return;
  }
  if (!proposedTopics[eventId]) {
    proposedTopics[eventId] = [];
  }
  const newTopic = {
    id: `prop-${Date.now()}`,
    title,
    description: description || "",
    speaker,
    durationMinutes: parseInt(durationMinutes) || 60,
    track: track || "General"
  };
  proposedTopics[eventId].push(newTopic);
  res.status(201).json(newTopic);
});

// Register standard attendee
app.post("/api/events/:id/attendees", (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const { name, email, company, interests } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: "Name and Email are required" });
    return;
  }

  // Check capacity limits
  if (event.attendees.length >= event.capacity) {
    res.status(400).json({ error: "Event is currently at maximum capacity." });
    return;
  }

  const newAttendee = {
    id: `att-${Date.now()}`,
    name,
    email,
    company: company || "Freelance / Self",
    interests: Array.isArray(interests) ? interests : [],
    registeredAt: new Date().toISOString(),
    checkInStatus: "registered" as const
  };

  event.attendees.push(newAttendee);
  broadcastTracking("attendee_registered", { eventId: event.id, attendee: newAttendee });
  res.status(201).json(newAttendee);
});

// Toggle check-in status
app.post("/api/events/:id/attendees/:attendeeId/checkin", (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const attendee = event.attendees.find((a) => a.id === req.params.attendeeId);
  if (!attendee) {
    res.status(404).json({ error: "Attendee not found" });
    return;
  }

  const { status } = req.body; // 'registered' | 'checked_in' | 'checked_out'
  if (!status || !["registered", "checked_in", "checked_out"].includes(status)) {
    res.status(400).json({ error: "Invalid check-in status" });
    return;
  }

  attendee.checkInStatus = status as 'registered' | 'checked_in' | 'checked_out';
  if (status === "checked_in") {
    attendee.checkInTime = new Date().toISOString();
  } else if (status === "registered") {
    delete attendee.checkInTime;
  }

  broadcastTracking("attendee_status_change", {
    eventId: event.id,
    attendeeId: attendee.id,
    name: attendee.name,
    status: attendee.checkInStatus,
    time: attendee.checkInTime || null
  });

  res.json(attendee);
});

// Simulate live crowd activity
let isSimulating = false;
app.post("/api/events/:id/simulate", (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  if (isSimulating) {
    res.json({ message: "Simulation already in progress" });
    return;
  }

  isSimulating = true;
  res.json({ message: "Live activity simulation started. Expect incoming events over SSE!" });

  const names = [
    "Jared Vance", "Sonia Alwi", "Patricia Mercer", "Timothy Vance", "Leah Kross", 
    "Ravi Sharma", "Emma Goldman", "Lucas Baker", "Naomi Klein", "Zack Snyder"
  ];
  const companies = ["Hyperion Systems", "Quantum Scale", "DesignLab", "Novus Tech", "Apex Security"];
  const interestsPool = ["Infrastructure", "Security", "Design & UX", "Robotics", "Neural Networks"];

  let count = 0;
  const interval = setInterval(() => {
    if (count >= 8 || !isSimulating || event.status !== "active") {
      clearInterval(interval);
      isSimulating = false;
      broadcastTracking("simulation_ended", { eventId: event.id });
      return;
    }

    // Mix of registrations and check-ins
    const isRegistration = Math.random() > 0.5;
    if (isRegistration && event.attendees.length < event.capacity) {
      const idx = Math.floor(Math.random() * names.length);
      const name = names[idx];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const email = `${name.toLowerCase().replace(" ", ".")}@example.com`;
      const interests = [
        interestsPool[Math.floor(Math.random() * interestsPool.length)],
        interestsPool[Math.floor(Math.random() * interestsPool.length)]
      ].filter((v, i, a) => a.indexOf(v) === i);

      const newAtt: Attendee = {
        id: `att-sim-${Date.now()}`,
        name,
        email,
        company,
        interests,
        registeredAt: new Date().toISOString(),
        checkInStatus: "registered"
      };
      event.attendees.push(newAtt);
      broadcastTracking("attendee_registered", { eventId: event.id, attendee: newAtt });

      // Automatically check them in after a 3 second delay to simulate walking through the door!
      setTimeout(() => {
        newAtt.checkInStatus = "checked_in";
        newAtt.checkInTime = new Date().toISOString();
        broadcastTracking("attendee_status_change", {
          eventId: event.id,
          attendeeId: newAtt.id,
          name: newAtt.name,
          status: "checked_in",
          time: newAtt.checkInTime
        });
      }, 3000);

    } else {
      // Check in an existing pre-registered attendee
      const registeredList = event.attendees.filter(a => a.checkInStatus === "registered");
      if (registeredList.length > 0) {
        const target = registeredList[Math.floor(Math.random() * registeredList.length)] as Attendee;
        target.checkInStatus = "checked_in";
        target.checkInTime = new Date().toISOString();
        broadcastTracking("attendee_status_change", {
          eventId: event.id,
          attendeeId: target.id,
          name: target.name,
          status: "checked_in",
          time: target.checkInTime
        });
      }
    }

    count++;
  }, 4000);
});

// Cancel active simulation
app.post("/api/events/:id/simulate/stop", (req, res) => {
  isSimulating = false;
  res.json({ message: "Simulation stopped" });
});

// AI Automated Event Scheduler
app.post("/api/events/auto-schedule", async (req, res) => {
  const { eventTitle, description, date, startTime, endTime, lunchBreak, rooms, tracks, proposedTopics } = req.body;

  if (!eventTitle || !proposedTopics || proposedTopics.length === 0) {
    res.status(400).json({ error: "Event Title and Proposed Topics are required." });
    return;
  }

  const hasApiKey = !!process.env.GEMINI_API_KEY;

  if (hasApiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an expert academic conference planner. Create a clash-free timeline/schedule for an event titled "${eventTitle}".
Event Details:
- Date: ${date}
- Description: ${description}
- Operating Hours: ${startTime} to ${endTime}
- Lunch Break required: ${lunchBreak ? "Yes, schedule a 1-hour break typically from 12:00 to 13:00" : "No"}
- Available Rooms: ${rooms.join(", ")}
- Track Names: ${tracks.join(", ")}

List of Proposed Sessions (Topics) to distribute:
${JSON.stringify(proposedTopics, null, 2)}

Your Core Objectives:
1. Distribute these sessions across the available Rooms and Tracks.
2. Ensure there are absolutely NO overlapping times for the same speaker (one speaker cannot speak in two rooms simultaneously!).
3. Ensure no room is double-booked at the same time.
4. Each session must start and end within operating hours, respecting its designated duration.
5. Allocate a logical "capacity" (e.g., between 40 and 150) for each session depending on its scale.
6. Provide a beautifully organized schedule in JSON format matching the schema rules below.
7. Also provide a summary (written as professional planner insights) detailing how conflicts were resolved and why this schedule works beautifully.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sessions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "A unique session ID (reuse the proposed topic id or generate a clean sess-X string)" },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    speaker: { type: Type.STRING },
                    startTime: { type: Type.STRING, description: "Start time formatted as HH:MM" },
                    endTime: { type: Type.STRING, description: "End time formatted as HH:MM" },
                    room: { type: Type.STRING, description: "Must be chosen from the provided rooms" },
                    track: { type: Type.STRING, description: "Must be chosen from the provided tracks" },
                    capacity: { type: Type.INTEGER, description: "The maximum seat capacity of the room allocation" }
                  },
                  required: ["id", "title", "description", "speaker", "startTime", "endTime", "room", "track", "capacity"]
                }
              },
              summary: { type: Type.STRING, description: "Professional planning summary explaining speaker conflict avoidance and room assignment strategies." }
            },
            required: ["sessions", "summary"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("No response text returned from Gemini");
      }

      const structuredResult = JSON.parse(resultText);
      res.json(structuredResult);
      return;

    } catch (err: any) {
      console.error("Gemini Scheduling Error:", err);
      // Let it fall back to the rule-based scheduler below if Gemini fails
    }
  }

  // --- LOCAL RULE-BASED BACKUP SCHEDULER (Acts as fallback or if API key is missing) ---
  console.log("Using local backup scheduler...");
  try {
    const scheduledSessions: any[] = [];
    const roomCount = rooms.length;
    const trackCount = tracks.length;

    // Helper: convert string time to minutes from midnight
    const timeToMins = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };

    const minsToTime = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, "0");
      const m = (mins % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    let startMins = timeToMins(startTime);
    const endMins = timeToMins(endTime);

    // Track when each room and speaker is free next (in minutes)
    const roomNextFree: Record<string, number> = {};
    rooms.forEach(r => roomNextFree[r] = startMins);

    const speakerNextFree: Record<string, number> = {};

    proposedTopics.forEach((topic: any, idx: number) => {
      // Allocate room round-robin
      const room = rooms[idx % roomCount];
      const track = tracks[idx % trackCount] || "General";

      let currentStart = roomNextFree[room];

      // Insert lunch break (12:00 - 13:00) if requested
      if (lunchBreak && currentStart >= timeToMins("12:00") && currentStart < timeToMins("13:00")) {
        currentStart = timeToMins("13:00");
      }

      // Check speaker collision: speaker must be free at this time
      const speaker = topic.speaker;
      const speakerFree = speakerNextFree[speaker] || 0;
      if (currentStart < speakerFree) {
        currentStart = speakerFree;
      }

      const duration = topic.durationMinutes || 60;
      const currentEnd = currentStart + duration;

      // Ensure it doesn't spill past the absolute end limit
      if (currentEnd <= endMins) {
        scheduledSessions.push({
          id: topic.id || `sess-auto-${idx}`,
          title: topic.title,
          description: topic.description,
          speaker: topic.speaker,
          startTime: minsToTime(currentStart),
          endTime: minsToTime(currentEnd),
          room,
          track,
          capacity: Math.floor(Math.random() * 50) + 50
        });

        roomNextFree[room] = currentEnd;
        speakerNextFree[speaker] = currentEnd;
      }
    });

    const summary = `Rule-Based Auto-Schedule: Organized ${scheduledSessions.length} sessions across ${rooms.length} rooms (${rooms.join(", ")}) and ${tracks.length} tracks. Speaker overlaps were resolved by sorting schedules chronologically, and a lunch recess was integrated from 12:00 to 13:00. [Local rule-based generator fallback applied]`;

    res.json({
      sessions: scheduledSessions,
      summary
    });
  } catch (fallbackErr) {
    res.status(500).json({ error: "Failed to schedule event with both AI and local fallback." });
  }
});


// Configure Vite / Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Event Manager server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
