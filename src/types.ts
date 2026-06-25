export interface Session {
  id: string;
  title: string;
  description: string;
  speaker: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "10:00"
  room: string;
  track: string;
  capacity: number;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  company: string;
  interests: string[];
  registeredAt: string;
  checkInStatus: 'registered' | 'checked_in' | 'checked_out';
  checkInTime?: string;
  notes?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  location: string;
  capacity: number;
  status: 'upcoming' | 'active' | 'completed';
  sessions: Session[];
  attendees: Attendee[];
  category: string;
}

export interface ProposedTopic {
  id: string;
  title: string;
  description: string;
  speaker: string;
  durationMinutes: number;
  track: string;
}

export interface AutoScheduleParams {
  eventTitle: string;
  description: string;
  date: string;
  location: string;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  lunchBreak: boolean;
  rooms: string[];
  tracks: string[];
  proposedTopics: ProposedTopic[];
}

export interface AutoScheduleResponse {
  sessions: Session[];
  summary: string;
}
