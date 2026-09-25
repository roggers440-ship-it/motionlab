'use client';
// The real Rive path. Only imported when /rive/login.riv exists, so the Rive
// WASM runtime (~1MB) is never downloaded otherwise.
import { useEffect } from 'react';
import { RuntimeLoader, useRive, useStateMachineInput } from '@rive-app/react-canvas';
import type { CharacterInputs } from './rive-login';

RuntimeLoader.setWasmUrl('/rive/rive.wasm'); // self-hosted runtime, no CDN

export const RIVE_CONFIG = {
  src: '/rive/login.riv',
  machine: 'Login Machine',
  inputs: { checking: 'isChecking', look: 'numLook', handsUp: 'isHandsUp', success: 'trigSuccess', fail: 'trigFail' },
};

export default function RiveCharacter({ state }: { state: CharacterInputs }) {
  const { rive, RiveComponent } = useRive({ src: RIVE_CONFIG.src, stateMachines: RIVE_CONFIG.machine, autoplay: true });
  const M = RIVE_CONFIG.machine;
  const checking = useStateMachineInput(rive, M, RIVE_CONFIG.inputs.checking);
  const look = useStateMachineInput(rive, M, RIVE_CONFIG.inputs.look);
  const handsUp = useStateMachineInput(rive, M, RIVE_CONFIG.inputs.handsUp);
  const success = useStateMachineInput(rive, M, RIVE_CONFIG.inputs.success);
  const fail = useStateMachineInput(rive, M, RIVE_CONFIG.inputs.fail);

  useEffect(() => { if (checking) checking.value = state.checking; }, [checking, state.checking]);
  useEffect(() => { if (look) look.value = state.look; }, [look, state.look]);
  useEffect(() => { if (handsUp) handsUp.value = state.handsUp; }, [handsUp, state.handsUp]);
  useEffect(() => { if (state.result === 'success') success?.fire(); if (state.result === 'fail') fail?.fire(); }, [state.result, state.resultId, success, fail]);

  return <RiveComponent className="h-full w-full" aria-hidden />;
}
