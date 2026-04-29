export function makeValid(): string {
  return ['a', 'a', 'B', 'B', '1', '1', 'c', 'c'].join('');
}

export function makeShort(): string {
  return ['a', 'B', '1'].join('');
}

export function makeNoUpper(): string {
  return ['a', 'a', 'b', 'b', '1', '1', '2', '2'].join('');
}

export function makeNoDigit(): string {
  return ['a', 'a', 'B', 'B', 'c', 'c', 'd', 'd'].join('');
}
