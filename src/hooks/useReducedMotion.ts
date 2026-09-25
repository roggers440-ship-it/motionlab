'use client';
import { selectReduced, useUI } from '@/store/ui';

/** Effective reduced-motion flag: OS preference OR the in-app override. */
export const useReducedMotion = () => useUI(selectReduced);
