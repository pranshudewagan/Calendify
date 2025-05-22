import { ScheduleEntry as ApiScheduleEntry } from './api';

export interface ProcessedEntry extends ApiScheduleEntry {
  course: string;
  section: string;
  days: string[];
  startTime: string;
  endTime: string;
  location: string;
} 