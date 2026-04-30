export type HabitFrequency = 'daily' | 'weekly' | 'n_per_week';

export type HabitDTO = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  frequency: HabitFrequency;
  targetCount: number;
  createdAt: string;
};

export type CheckinDTO = {
  id: string;
  habitId: string;
  performedOn: string;
  count: number;
  notes?: string | null;
};
