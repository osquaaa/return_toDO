export function makeValid(): string {
  return ['a', 'a', 'B', 'B', '1', '1', 'c', 'c'].join('');
}

export const makeValidPassword = makeValid;

export function makeShort(): string {
  return ['a', 'B', '1'].join('');
}

export const makeShortPassword = makeShort;

export function makeNoUpper(): string {
  return ['a', 'a', 'b', 'b', '1', '1', '2', '2'].join('');
}

export const makeNoUpperPassword = makeNoUpper;

export function makeNoDigit(): string {
  return ['a', 'a', 'B', 'B', 'c', 'c', 'd', 'd'].join('');
}

export const makeNoDigitPassword = makeNoDigit;
