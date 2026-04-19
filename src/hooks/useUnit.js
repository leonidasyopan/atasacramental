import { useContext } from 'react';
import { UnitContext } from '../contexts/UnitContext';

export function useUnit() {
  const ctx = useContext(UnitContext);
  if (!ctx) throw new Error('useUnit must be used inside UnitProvider');
  return ctx;
}
