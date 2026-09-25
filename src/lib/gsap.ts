'use client';
// Register every GSAP plugin exactly once. Import gsap from HERE, never from
// 'gsap' directly, so plugins are guaranteed to be registered before use.
// (All GSAP plugins are free — including SplitText, MorphSVG, DrawSVG.)
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import { Observer } from 'gsap/Observer';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Observer, DrawSVGPlugin, MorphSVGPlugin, ScrambleTextPlugin, CustomEase, useGSAP);
  // Lenis drives the ticker; avoid GSAP "catching up" after a tab switch.
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, SplitText, Flip, Observer, DrawSVGPlugin, MorphSVGPlugin, ScrambleTextPlugin, CustomEase, useGSAP };
