import { v7 as uuidv7 } from 'uuid';

export function genId(): string {
  return uuidv7();
}
