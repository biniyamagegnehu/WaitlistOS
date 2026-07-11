import { api } from '@/lib/axios';

export interface OpenGatesRequest {
  waitlistId: string;
  batchSize: number;
}

export interface GateOpeningResult {
  cohortId: string;
  batchNumber: number;
  invitedCount: number;
  participants: Array<{
    email: string;
    position: number;
    rewards: string[];
  }>;
}

export interface CohortAnalytics {
  totalParticipants: number;
  invitedParticipants: number;
  waitingParticipants: number;
  totalCohorts: number;
  lastCohortSize: number;
  progress: number;
  cohorts: Array<{
    id: string;
    batchNumber: number;
    size: number;
    createdAt: string;
  }>;
}

export interface Cohort {
  id: string;
  waitlistId: string;
  batchNumber: number;
  size: number;
  createdAt: string;
  invitations: Array<{
    id: string;
    cohortId: string;
    participantId: string;
    invitedAt: string;
    participant: {
      email: string;
      position: number;
      status: string;
    };
  }>;
}

export const cohortsService = {
  async openGates(data: OpenGatesRequest): Promise<{ success: boolean; message: string; data: GateOpeningResult }> {
    const response = await api.post('/cohorts/open-gates', data);
    return response.data;
  },

  async getAnalytics(waitlistId: string): Promise<{ success: boolean; data: CohortAnalytics }> {
    const response = await api.get(`/cohorts/waitlist/${waitlistId}/analytics`);
    return response.data;
  },

  async getCohorts(waitlistId: string): Promise<{ success: boolean; data: Cohort[] }> {
    const response = await api.get(`/cohorts/waitlist/${waitlistId}`);
    return response.data;
  },

  async markAsAccessed(participantId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/cohorts/participants/${participantId}/accessed`);
    return response.data;
  },
};
