'use client';

import { AddHabitModal } from './add-habit-modal';
import type { HabitDTO } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
  habit: HabitDTO;
};

export function EditHabitDialog({ open, onClose, habit }: Props) {
  return <AddHabitModal open={open} onClose={onClose} mode="edit" habit={habit} />;
}
