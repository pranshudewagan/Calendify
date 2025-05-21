import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '5242880', 10);
const ALLOWED_FILE_TYPES = (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/png,image/jpeg,image/jpg').split(',');

export interface SchedulePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScheduleEntry {
  text: string;
  position: SchedulePosition;
}

export interface ParseResponse {
  schedule: ScheduleEntry[];
  warning?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const validateFile = (file: File): void => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }
};

export const uploadImageForSchedule = async (file: File): Promise<ParseResponse> => {
  try {
    validateFile(file);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post<ParseResponse>(`${API_URL}/parse`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new ApiError(
          error.response.status,
          error.response.data.error || 'Failed to parse schedule'
        );
      } else if (error.request) {
        throw new ApiError(0, 'No response from server');
      }
    }
    throw error;
  }
};
