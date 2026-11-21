/**
 * The A&E nurse's view, drawn the way the birth looks from where she stands.
 * Nurse Chiu conducts. The pictures follow that job: look from the foot of the bed, ask at the
 * bedside, dress and open the set, then the birth frame by frame, the thigh injection, the
 * placenta separating on its own, and the trolley leaving.
 *
 * Figures are pixel blocks (the same crisp look as the rest of the gym). Hit targets stay on
 * the anatomy, in the same places, so a tap still lands on the head, the cord, or the thigh.
 */
import { useRef, useState, type ReactNode } from 'react'
import { toLocal } from '../bench/kit'
import { CLAMP_PICTURE, MIN_CLAMP_CM, cmAt, type NurseRun } from './model'

const FONT = 'Press Start 2P, monospace'
const INK = '#2c2416'
const PAPER = '#f4f0e4'
const SKIN = '#e8b494'
const SKIN_DARK = '#d89c7c'
const SKIN_EDGE = '#8a5238'
const HI = '#f3d0b4'
const MUCOSA = '#c4626a'
const MUCOSA_DEEP = '#8a2e3a'
const SCALP = '#c99a88'
const HAIR = '#3d2c22'
const HAIR_DARK = '#2a1c16'
const DRAPE = '#86aebd'
const DRAPE_DARK = '#6f98a8'
const CORD = '#dfe3ec'
const CORD_STRIPE = '#b4bccf'
const BLOOD = '#9a1020'
const MARK = '#1d6b45'
const BAD = '#9a1020'
const METAL = '#8e98a4'
const METAL_DARK = '#5c6770'
const GLOVE = '#f0e6c8'
const GLOVE_DARK = '#d4c8a4'
const GOWN = '#2a62a8'
const GOWN_DARK = '#1e4a80'
const BABY = '#f0b8a8'
const BABY_SHADE = '#d89888'
const VERNIX = '#f4f0e0'

function T({ x, y, children, size = 5, fill = INK }: { x: number | string; y: number | string; children: string; size?: number | string; fill?: string }) {
  return (
    <text x={Number(x)} y={Number(y)} fontFamily={FONT} fontSize={Number(size)} fill={fill} style={{ pointerEvents: 'none' }}>
      {children}
    </text>
  )
}

function Stage({ h, children }: { h: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 240 ${h}`} className="io-figure pixelated mx-auto mb-2 block w-full max-w-[360px] select-none">
      <rect width="240" height={h} fill={PAPER} />
      {children}
    </svg>
  )
}

/** Pixel art. Clicks pass through to the hit shapes drawn after it. */
function Pix({ children }: { children: ReactNode }) {
  return (
    <g shapeRendering="crispEdges" style={{ pointerEvents: 'none' }}>
      {children}
    </g>
  )
}

function Px({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={c} />
}

/** A block with a 2px rim, so a mass reads as a sprite rather than a flat patch. */
function Box({ x, y, w, h, c, edge = SKIN_EDGE }: { x: number; y: number; w: number; h: number; c: string; edge?: string }) {
  return (
    <g>
      <Px x={x} y={y} w={w} h={h} c={edge} />
      <Px x={x + 2} y={y + 2} w={Math.max(0, w - 4)} h={Math.max(0, h - 4)} c={c} />
    </g>
  )
}

/** Mrs Lai, facing you. x,y is the top of her hair. About 22 by 24. */
function PxFace({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Px x={x + 4} y={y} w={14} h={4} c={HAIR_DARK} />
      <Px x={x + 2} y={y + 4} w={18} h={4} c={HAIR} />
      <Px x={x} y={y + 6} w={4} h={10} c={HAIR} />
      <Px x={x + 18} y={y + 6} w={4} h={10} c={HAIR} />
      <Px x={x + 4} y={y + 8} w={14} h={14} c={SKIN} />
      <Px x={x + 4} y={y + 18} w={14} h={4} c={SKIN_DARK} />
      <Px x={x + 6} y={y + 10} w={4} h={2} c={HAIR} />
      <Px x={x + 12} y={y + 10} w={4} h={2} c={HAIR} />
      <Px x={x + 6} y={y + 12} w={3} h={3} c="#1a1410" />
      <Px x={x + 13} y={y + 12} w={3} h={3} c="#1a1410" />
      <Px x={x + 6} y={y + 12} w={1} h={1} c="#fff" />
      <Px x={x + 13} y={y + 12} w={1} h={1} c="#fff" />
      <Px x={x + 10} y={y + 15} w={2} h={3} c={SKIN_DARK} />
      <Px x={x + 7} y={y + 19} w={8} h={2} c="#a04858" />
      <Px x={x + 8} y={y + 20} w={6} h={1} c="#c06070" />
    </g>
  )
}

/**
 * The back of the crowning head. cx,cy is the middle of the scalp.
 * Hair cap, wet strands, a smear of vernix. No face: this is the occiput.
 * Stays inside about 36 by 36 so it fills the head you tap and does not cover the perineum.
 */
function PxOcciput({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <Px x={cx - 8} y={cy - 18} w={16} h={4} c={HAIR_DARK} />
      <Px x={cx - 12} y={cy - 14} w={24} h={4} c={HAIR} />
      <Px x={cx - 14} y={cy - 10} w={28} h={4} c={HAIR} />
      <Px x={cx - 2} y={cy - 16} w={4} h={4} c={HAIR_DARK} />
      <Px x={cx - 16} y={cy - 6} w={32} h={12} c={SCALP} />
      <Px x={cx - 14} y={cy + 6} w={28} h={6} c={SKIN_DARK} />
      <Px x={cx - 10} y={cy + 12} w={20} h={4} c="#b88878" />
      <Px x={cx - 12} y={cy - 6} w={4} h={4} c={HI} />
      <Px x={cx - 10} y={cy - 8} w={2} h={14} c={HAIR_DARK} />
      <Px x={cx - 2} y={cy - 6} w={2} h={16} c="#5a4638" />
      <Px x={cx + 6} y={cy - 8} w={2} h={12} c={HAIR_DARK} />
      <Px x={cx + 2} y={cy + 2} w={6} h={2} c={VERNIX} />
      <Px x={cx - 8} y={cy + 6} w={4} h={2} c={VERNIX} />
    </g>
  )
}

/** A newborn, about 64 by 58. x,y is the top-left. back: you are looking at her skin. */
/** A newborn lying flexed. Big head, frog legs, arms up by the cheeks. About 64 by 54. */
function PxNewborn({ x, y, back = false, hat = false }: { x: number; y: number; back?: boolean; hat?: boolean }) {
  return (
    <g>
      <Px x={x + 2} y={y + 34} w={16} h={8} c={BABY_SHADE} />
      <Px x={x} y={y + 40} w={14} h={8} c={BABY} />
      <Px x={x + 2} y={y + 46} w={8} h={4} c="#c07868" />
      <Px x={x + 46} y={y + 34} w={16} h={8} c={BABY_SHADE} />
      <Px x={x + 50} y={y + 40} w={14} h={8} c={BABY} />
      <Px x={x + 54} y={y + 46} w={8} h={4} c="#c07868" />
      <Px x={x + 6} y={y + 22} w={12} h={6} c={BABY} />
      <Px x={x + 4} y={y + 16} w={8} h={8} c={BABY_SHADE} />
      <Px x={x + 46} y={y + 22} w={12} h={6} c={BABY} />
      <Px x={x + 52} y={y + 16} w={8} h={8} c={BABY_SHADE} />
      <Px x={x + 18} y={y + 22} w={28} h={22} c="#c07868" />
      <Px x={x + 20} y={y + 24} w={24} h={18} c={BABY} />
      <Px x={x + 22} y={y + 26} w={8} h={6} c="#f6c8ba" />
      <Px x={x + 12} y={y + 6} w={40} h={18} c={BABY} />
      <Px x={x + 16} y={y + 4} w={32} h={6} c={BABY} />
      <Px x={x + 14} y={y + 10} w={4} h={8} c={HAIR} />
      <Px x={x + 46} y={y + 10} w={4} h={8} c={HAIR} />
      {hat ? (
        <>
          <Px x={x + 14} y={y} w={36} h={8} c="#e8a8bc" />
          <Px x={x + 16} y={y + 6} w={32} h={4} c="#f0c8d8" />
          <Px x={x + 18} y={y + 2} w={10} h={2} c="#f8e0ea" />
        </>
      ) : (
        <>
          <Px x={x + 18} y={y} w={28} h={4} c={HAIR_DARK} />
          <Px x={x + 16} y={y + 4} w={32} h={4} c={HAIR} />
        </>
      )}
      {back ? (
        <>
          <Px x={x + 30} y={y + 26} w={2} h={12} c={BABY_SHADE} />
          <Px x={x + 24} y={y + 28} w={16} h={2} c={BABY_SHADE} />
          <Px x={x + 26} y={y + 34} w={12} h={2} c="#c07868" />
        </>
      ) : (
        <>
          <Px x={x + 22} y={y + 12} w={4} h={3} c="#1a1410" />
          <Px x={x + 36} y={y + 12} w={4} h={3} c="#1a1410" />
          <Px x={x + 22} y={y + 12} w={1} h={1} c="#fff" />
          <Px x={x + 36} y={y + 12} w={1} h={1} c="#fff" />
          <Px x={x + 30} y={y + 16} w={4} h={2} c={BABY_SHADE} />
          <Px x={x + 28} y={y + 19} w={8} h={2} c="#c06070" />
        </>
      )}
    </g>
  )
}

/** Fingers point up. x,y is the top of the longest finger. About 26 by 24. */
function PxGlove({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  return (
    <g transform={flip ? `translate(${x + 22} ${y}) scale(-1 1)` : `translate(${x} ${y})`}>
      <Px x={2} y={0} w={4} h={8} c={GLOVE} />
      <Px x={7} y={-2} w={4} h={10} c="#f4ecd4" />
      <Px x={12} y={0} w={4} h={8} c={GLOVE} />
      <Px x={16} y={2} w={4} h={6} c={GLOVE_DARK} />
      <Px x={0} y={8} w={22} h={10} c={GLOVE} />
      <Px x={0} y={8} w={22} h={2} c={GLOVE_DARK} />
      <Px x={-4} y={10} w={6} h={6} c={GLOVE_DARK} />
      <Px x={0} y={18} w={22} h={4} c={GOWN} />
    </g>
  )
}

/** You, standing. x,y is the top of your hair. About 40 wide and 78 tall. */
function PxNurse({ x, y, dressed }: { x: number; y: number; dressed: boolean }) {
  const cloth = dressed ? GOWN : '#7dba9a'
  const clothDark = dressed ? GOWN_DARK : '#3d6b58'
  return (
    <g>
      <PxFace x={x + 8} y={y} />
      {dressed && (
        <>
          <Px x={x + 12} y={y + 12} w={16} h={4} c="#9ec4da" />
          <Px x={x + 14} y={y + 13} w={4} h={2} c="#e8f6ff" />
          <Px x={x + 22} y={y + 13} w={4} h={2} c="#e8f6ff" />
        </>
      )}
      <Px x={x + 4} y={y + 26} w={32} h={40} c={cloth} />
      <Px x={x + 4} y={y + 26} w={32} h={4} c={clothDark} />
      <Px x={x + 6} y={y + 30} w={6} h={16} c={dressed ? '#d8ecff' : clothDark} />
      <Px x={x - 2} y={y + 30} w={8} h={22} c={dressed ? cloth : SKIN} />
      <Px x={x + 34} y={y + 30} w={8} h={22} c={dressed ? cloth : SKIN} />
      <Px x={x - 4} y={y + 48} w={10} h={8} c={dressed ? GLOVE : SKIN} />
      <Px x={x + 34} y={y + 48} w={10} h={8} c={dressed ? GLOVE : SKIN_DARK} />
      <Px x={x + 8} y={y + 66} w={10} h={8} c={INK} />
      <Px x={x + 22} y={y + 66} w={10} h={8} c={INK} />
    </g>
  )
}

function PxClock({ x, y, noted }: { x: number; y: number; noted: boolean }) {
  return (
    <g>
      <Px x={x} y={y} w={32} h={32} c={noted ? MARK : INK} />
      <Px x={x + 4} y={y + 4} w={24} h={24} c={noted ? '#e5f5df' : '#fff'} />
      <Px x={x + 14} y={y + 8} w={2} h={10} c={INK} />
      <Px x={x + 14} y={y + 16} w={8} h={2} c={INK} />
      <Px x={x + 12} y={y + 14} w={4} h={4} c={INK} />
    </g>
  )
}

function PxBottle({ x, y, cap }: { x: number; y: number; cap: string }) {
  return (
    <g>
      <Px x={x} y={y + 6} w={14} h={22} c={INK} />
      <Px x={x + 2} y={y + 8} w={10} h={18} c="#f4f4f8" />
      <Px x={x + 4} y={y + 10} w={2} h={12} c="#fff" />
      <Px x={x + 2} y={y} w={10} h={8} c={cap} />
      <Px x={x + 4} y={y + 2} w={6} h={2} c="#fff" />
    </g>
  )
}

/** Horizontal 1 ml syringe. The needle points right. */
function PxSyringe({ x, y, pushed, bad }: { x: number; y: number; pushed: boolean; bad: boolean }) {
  return (
    <g>
      <Px x={x + 40} y={y + 4} w={10} h={2} c="#b0b8c4" />
      <Px x={x + 36} y={y + 2} w={4} h={6} c={METAL_DARK} />
      <Px x={x + 10} y={y} w={26} h={10} c={INK} />
      <Px x={x + 12} y={y + 2} w={22} h={6} c="#f4f8fc" />
      <Px x={x + (pushed ? 24 : 14)} y={y + 3} w={pushed ? 8 : 16} h={4} c={bad ? '#f0b0b8' : '#d8e8f8'} />
      <Px x={x + (pushed ? 18 : 4)} y={y - 2} w={4} h={14} c="#404858" />
      <Px x={x} y={y + 2} w={6} h={6} c="#404858" />
    </g>
  )
}

function PxForceps({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Px x={x} y={y} w={2} h={14} c={METAL} />
      <Px x={x + 4} y={y} w={2} h={14} c={METAL_DARK} />
      <Px x={x} y={y + 12} w={6} h={2} c={METAL} />
      <Px x={x - 1} y={y + 14} w={4} h={4} c={METAL_DARK} />
      <Px x={x + 3} y={y + 14} w={4} h={4} c={METAL} />
      <Px x={x} y={y + 15} w={2} h={2} c="#e8eef2" />
      <Px x={x + 4} y={y + 15} w={2} h={2} c="#e8eef2" />
    </g>
  )
}

/** A picture you tap. The drawing sits under a clear hit rect, so labels cannot steal the centre. */
function Hot({ id, x, y, w, h, on, onPress }: { id: string; x: number; y: number; w: number; h: number; on: boolean; onPress: () => void }) {
  return (
    <g>
      <rect data-testid={id} x={x} y={y} width={w} height={h} fill="transparent" style={{ cursor: 'pointer' }} onPointerDown={(e) => { e.stopPropagation(); onPress() }} />
      {on && <rect x={x + w - 8} y={y + 2} width={4} height={4} fill={MARK} style={{ pointerEvents: 'none' }} />}
    </g>
  )
}

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, k) => {
        const cx = 120 + (k - (n - 1) / 2) * 12
        const s = k === i ? 6 : 4
        return <rect key={k} x={cx - s / 2} y={10 - s / 2} width={s} height={s} fill={k < i ? MARK : k === i ? INK : '#c8c0b0'} />
      })}
    </g>
  )
}

/* ---------------------------------------------------------------- look: one view, four signs */

/**
 * From the foot of the bed, lithotomy. The head stays between contractions.
 * Hit shapes are unchanged: head at 120,78 r=18, perineum at 120,124, anus at 120,156, and her words.
 */
export function LookPicture({ run, onSign }: { run: NurseRun; onSign: (sign: 'crowning' | 'perineum' | 'anus' | 'push') => void }) {
  return (
    <svg viewBox="0 0 240 206" className="io-figure pixelated mx-auto mb-2 block w-full max-w-[360px] select-none" data-testid="nurse-picture">
      <Pix>
        <Px x={0} y={0} w={240} h={206} c={DRAPE} />
        <Px x={0} y={0} w={240} h={14} c={DRAPE_DARK} />
        <Px x={0} y={14} w={12} h={160} c={DRAPE_DARK} />
        <Px x={228} y={14} w={12} h={160} c={DRAPE_DARK} />
        <Px x={12} y={16} w={70} h={40} c={SKIN_EDGE} />
        <Px x={16} y={20} w={58} h={32} c={SKIN_DARK} />
        <Px x={24} y={24} w={24} h={16} c={SKIN} />
        <Px x={16} y={48} w={68} h={44} c={SKIN_EDGE} />
        <Px x={20} y={52} w={56} h={36} c={SKIN} />
        <Px x={28} y={58} w={18} h={14} c={HI} />
        <Px x={20} y={84} w={62} h={52} c={SKIN_EDGE} />
        <Px x={24} y={88} w={50} h={44} c={SKIN_DARK} />
        <Px x={28} y={128} w={44} h={36} c={SKIN_EDGE} />
        <Px x={32} y={132} w={34} h={28} c={SKIN} />
        <Px x={158} y={16} w={70} h={40} c={SKIN_EDGE} />
        <Px x={166} y={20} w={58} h={32} c={SKIN_DARK} />
        <Px x={192} y={24} w={24} h={16} c={SKIN} />
        <Px x={156} y={48} w={68} h={44} c={SKIN_EDGE} />
        <Px x={164} y={52} w={56} h={36} c={SKIN} />
        <Px x={194} y={58} w={18} h={14} c={HI} />
        <Px x={158} y={84} w={62} h={52} c={SKIN_EDGE} />
        <Px x={166} y={88} w={50} h={44} c={SKIN_DARK} />
        <Px x={168} y={128} w={44} h={36} c={SKIN_EDGE} />
        <Px x={174} y={132} w={34} h={28} c={SKIN} />
        <Px x={84} y={18} w={72} h={28} c={SKIN_EDGE} />
        <Px x={88} y={22} w={64} h={20} c={SKIN_DARK} />
        <Px x={100} y={20} w={4} h={8} c={HAIR_DARK} />
        <Px x={108} y={18} w={6} h={10} c={HAIR} />
        <Px x={118} y={20} w={6} h={8} c={HAIR_DARK} />
        <Px x={128} y={22} w={4} h={6} c={HAIR} />
        <Px x={114} y={60} w={12} h={4} c={HAIR_DARK} />
        <Px x={106} y={64} w={28} h={4} c={HAIR_DARK} />
        <Px x={102} y={68} w={36} h={6} c={HAIR} />
        <Px x={100} y={74} w={40} h={12} c={HAIR} />
        <Px x={100} y={86} w={40} h={6} c={HAIR_DARK} />
        <Px x={104} y={92} w={32} h={4} c={SCALP} />
        <Px x={110} y={96} w={20} h={4} c="#b88878" />
        <Px x={112} y={70} w={6} h={4} c="#5a4638" />
        <Px x={108} y={80} w={6} h={4} c={HAIR_DARK} />
        <Px x={126} y={88} w={8} h={2} c={VERNIX} />
        <Px x={92} y={78} w={8} h={6} c={MUCOSA} />
        <Px x={88} y={82} w={12} h={12} c={MUCOSA_DEEP} />
        <Px x={90} y={92} w={10} h={8} c={MUCOSA} />
        <Px x={94} y={98} w={8} h={4} c="#e08890" />
        <Px x={140} y={78} w={8} h={6} c={MUCOSA} />
        <Px x={140} y={82} w={12} h={12} c={MUCOSA_DEEP} />
        <Px x={140} y={92} w={10} h={8} c={MUCOSA} />
        <Px x={138} y={98} w={8} h={4} c="#e08890" />
        <Px x={108} y={98} w={24} h={6} c={MUCOSA} />
        <Px x={112} y={102} w={16} h={4} c={MUCOSA_DEEP} />
        <Px x={100} y={108} w={40} h={4} c={SKIN} />
        <Px x={88} y={112} w={64} h={6} c="#f3e4dc" />
        <Px x={84} y={118} w={72} h={8} c="#f6ece6" />
        <Px x={100} y={120} w={40} h={4} c="#fff6f2" />
        <Px x={92} y={126} w={56} h={6} c="#f3e4dc" />
        <Px x={104} y={132} w={32} h={4} c={SKIN} />
        <Px x={112} y={146} w={16} h={2} c={SKIN_DARK} />
        <Px x={108} y={148} w={24} h={4} c="#a06858" />
        <Px x={112} y={150} w={16} h={4} c="#6a4034" />
        <Px x={114} y={152} w={12} h={4} c="#4a2c24" />
        <Px x={116} y={156} w={8} h={4} c="#6a4034" />
        <Px x={118} y={160} w={4} h={3} c="#8a5040" />
        <Px x={100} y={28} w={40} h={6} c={GOWN} />
        <Px x={102} y={34} w={36} h={10} c={GLOVE} />
        <Px x={104} y={42} w={4} h={14} c="#f4ecd4" />
        <Px x={110} y={42} w={4} h={16} c={GLOVE} />
        <Px x={116} y={42} w={4} h={16} c="#f4ecd4" />
        <Px x={122} y={42} w={4} h={12} c={GLOVE} />
        <Px x={128} y={44} w={6} h={8} c={GLOVE_DARK} />
        <Px x={152} y={116} w={16} h={10} c="#fbfbf6" />
        <Px x={154} y={118} w={12} h={2} c="#d0d0c4" />
        <Px x={166} y={108} w={20} h={8} c={GLOVE} />
        <Px x={168} y={114} w={3} h={8} c="#f4ecd4" />
        <Px x={173} y={116} w={3} h={8} c={GLOVE} />
        <Px x={178} y={114} w={3} h={6} c={GLOVE_DARK} />
        <Px x={168} y={104} w={14} h={4} c={GOWN} />
      </Pix>
      <g style={{ pointerEvents: 'none' }}>
        <T x="6" y="11" size="4.4" fill="#f8f8f0">FROM THE FOOT</T>
        <T x="4" y="168" size="4" fill="#f8f8f0">HER R</T>
        <T x="196" y="168" size="4" fill="#f8f8f0">HER L</T>
        <T x="148" y="70" size="4.2" fill={run.crowning ? MARK : '#203040'}>HEAD STAYS</T>
        <T x="156" y="126" size="4.2" fill={run.perineum ? MARK : '#203040'}>BULGE</T>
        <T x="140" y="160" size="4.2" fill={run.anus ? MARK : '#203040'}>POUTING</T>
      </g>
      <ellipse data-testid="nurse-sign-perineum" cx="120" cy="124" rx="32" ry="12" fill="transparent" style={{ cursor: 'pointer' }} onPointerDown={() => onSign('perineum')} />
      <ellipse data-testid="nurse-sign-anus" cx="120" cy="156" rx="11" ry="8" fill="transparent" style={{ cursor: 'pointer' }} onPointerDown={() => onSign('anus')} />
      <g data-testid="nurse-sign-crowning" onPointerDown={() => onSign('crowning')} style={{ cursor: 'pointer' }}>
        <circle cx="120" cy="78" r="18" fill="transparent" />
      </g>
      <rect data-testid="nurse-sign-push" x="8" y="174" width="224" height="26" fill={run.push ? '#e5f5df' : '#fff'} stroke={run.push ? MARK : INK} strokeWidth="1.2" onPointerDown={() => onSign('push')} />
      <T x="16" y="190" size="5" fill={run.push ? MARK : INK}>SHE SAYS: I HAVE TO PUSH</T>
    </svg>
  )
}

/* ---------------------------------------------------------------- ask: at the bedside */

export function AskScene({ run, onAsk }: { run: NurseRun; onAsk: (key: 'liquorAsk' | 'allergy' | 'obstetric' | 'weeks') => void }) {
  const [line, setLine] = useState('Ask her.')
  function ask(key: 'liquorAsk' | 'allergy' | 'obstetric' | 'weeks', said: string) {
    setLine(said)
    onAsk(key)
  }
  return (
    <Stage h={196}>
      <Pix>
        <Px x={4} y={26} w={232} h={116} c="#c5d6e2" />
        <Px x={8} y={30} w={224} h={108} c="#d5e2ea" />
        <Px x={8} y={30} w={224} h={4} c="#f7fbfc" />
        <Px x={12} y={34} w={60} h={16} c="#f4f1e8" />
        <Px x={16} y={38} w={48} h={8} c="#fff" />
        <Px x={40} y={58} w={150} h={36} c={SKIN_EDGE} />
        <Px x={44} y={62} w={142} h={28} c={SKIN} />
        <Px x={48} y={66} w={20} h={10} c={HI} />
        <PxFace x={32} y={46} />
        <Px x={96} y={52} w={48} h={36} c={SKIN_EDGE} />
        <Px x={100} y={48} w={40} h={12} c={run.obstetric ? '#e8b8a8' : SKIN_DARK} />
        <Px x={100} y={56} w={40} h={28} c={run.obstetric ? '#f3d8cc' : SKIN} />
        <Px x={108} y={60} w={16} h={8} c={HI} />
        <Px x={118} y={52} w={2} h={24} c={SKIN_DARK} />
        <Px x={116} y={66} w={6} h={4} c={MUCOSA_DEEP} />
        <Px x={166} y={64} w={56} h={14} c={SKIN_EDGE} />
        <Px x={170} y={66} w={48} h={10} c={SKIN} />
        <Px x={174} y={68} w={12} h={6} c={HI} />
        <Px x={206} y={54} w={16} h={18} c={SKIN} />
        <Px x={210} y={50} w={4} h={10} c={SKIN_DARK} />
        <Px x={216} y={48} w={4} h={12} c={SKIN} />
        <Px x={220} y={52} w={4} h={8} c={SKIN_DARK} />
        <Px x={36} y={116} w={52} h={14} c="#9ec8dc" />
        <Px x={42} y={114} w={36} h={10} c="#d7eef8" />
        <Px x={50} y={116} w={14} h={4} c="#f4fcff" />
        <Px x={96} y={120} w={28} h={8} c="#c5e4f4" />
        <Px x={8} y={148} w={224} h={40} c="#fff" />
        <Px x={8} y={148} w={224} h={2} c={INK} />
        <Px x={8} y={186} w={224} h={2} c={INK} />
        <Px x={8} y={148} w={2} h={40} c={INK} />
        <Px x={230} y={148} w={2} h={40} c={INK} />
      </Pix>
      <g style={{ pointerEvents: 'none' }}>
        <T x="8" y="16" size="4.4">AT THE BEDSIDE</T>
        <T x="22" y="92" size="4" fill={run.weeks ? MARK : INK}>WEEKS</T>
        <T x="100" y="96" size="4" fill={run.obstetric ? MARK : INK}>BELLY</T>
        <T x="168" y="100" size="4" fill={run.allergy ? MARK : INK}>HER ARM</T>
        <T x="132" y="128" size="4.4" fill={run.liquorAsk ? MARK : INK}>CLEAR WATERS</T>
        <T x="16" y="174" size="5">{line}</T>
      </g>
      <Hot id="nurse-ask-weeks" x={14} y={34} w={58} h={62} on={run.weeks} onPress={() => ask('weeks', '39 weeks. My second.')} />
      <Hot id="nurse-ask-obstetric" x={78} y={40} w={78} h={64} on={run.obstetric} onPress={() => ask('obstetric', 'One baby. No scar. No bleed.')} />
      <Hot id="nurse-ask-allergy" x={164} y={36} w={66} h={70} on={run.allergy} onPress={() => ask('allergy', 'No allergies. No medicines.')} />
      <Hot id="nurse-ask-liquor" x={16} y={112} w={208} h={28} on={run.liquorAsk} onPress={() => ask('liquorAsk', 'The waters are clear.')} />
    </Stage>
  )
}

/* ---------------------------------------------------------------- prepare: the bay */

export function PrepareScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'ppe' | 'set' | 'pad' | 'drugOut' | 'bottles' | 'form' | 'explain' | 'consent') => void }) {
  return (
    <Stage h={250}>
      <Pix>
        <Px x={84} y={16} w={150} h={6} c="#98a2ac" />
        <Px x={86} y={22} w={146} h={108} c="#e6eaee" />
        <Px x={98} y={130} w={6} h={14} c={METAL_DARK} />
        <Px x={214} y={130} w={6} h={14} c={METAL_DARK} />
        <Px x={90} y={142} w={20} h={6} c={INK} />
        <Px x={206} y={142} w={20} h={6} c={INK} />
        <PxNurse x={16} y={8} dressed={run.ppe} />
        <Px x={98} y={40} w={52} h={24} c="#7d8b98" />
        <Px x={102} y={44} w={44} h={16} c="#d5dde4" />
        <Px x={106} y={48} w={36} h={8} c="#e8eef2" />
        {run.set ? (
          <>
            <PxForceps x={104} y={36} />
            <PxForceps x={116} y={38} />
            <Px x={128} y={42} w={2} h={10} c={METAL} />
            <Px x={134} y={42} w={2} h={10} c={METAL_DARK} />
            <Px x={126} y={50} w={6} h={2} c={METAL} />
            <Px x={130} y={46} w={4} h={4} c="#e8eef2" />
            <Px x={138} y={46} w={4} h={4} c="#e8eef2" />
            <Px x={140} y={48} w={6} h={12} c="#f4f4f8" />
            <Px x={142} y={50} w={2} h={8} c="#3878b8" />
            <Px x={148} y={48} w={6} h={12} c="#f4f4f8" />
            <Px x={150} y={50} w={2} h={8} c="#3878b8" />
          </>
        ) : (
          <>
            <Px x={108} y={46} w={32} h={14} c="#3d6b58" />
            <Px x={110} y={48} w={28} h={10} c="#c5ddd2" />
          </>
        )}
        <Px x={186} y={28} w={8} h={4} c="#c8ccd0" />
        <Px x={184} y={32} w={16} h={26} c="#f4f0c8" />
        <Px x={186} y={42} w={12} h={8} c="#e6c84a" />
        <Px x={190} y={34} w={2} h={16} c="#fff8dc" />
        <Px x={96} y={86} w={12} h={26} c="#3a7ca5" />
        <Px x={98} y={88} w={8} h={20} c="#d7eef8" />
        <Px x={100} y={96} w={4} h={8} c="#7ec8e8" />
        <Px x={112} y={96} w={36} h={16} c="#f7f7f2" />
        <Px x={116} y={102} w={28} h={3} c="#7eb6e0" />
        <PxBottle x={174} y={84} cap="#6a3d8a" />
        <PxBottle x={196} y={84} cap="#b03040" />
        <Px x={18} y={128} w={44} h={36} c={INK} />
        <Px x={20} y={130} w={40} h={32} c="#fff" />
        <Px x={24} y={136} w={32} h={2} c="#c8c0b0" />
        <Px x={24} y={142} w={24} h={2} c="#c8c0b0" />
        <Px x={24} y={148} w={28} h={2} c="#c8c0b0" />
        <PxFace x={96} y={150} />
        <Px x={120} y={168} w={28} h={8} c={SKIN} />
        <Px x={146} y={164} w={16} h={12} c={GLOVE} />
        <Px x={148} y={160} w={4} h={6} c="#f4ecd4" />
        <Px x={154} y={162} w={4} h={6} c={GLOVE} />
        <Px x={28} y={208} w={2} h={12} c={METAL} />
        <Px x={34} y={208} w={2} h={12} c={METAL_DARK} />
        <Px x={26} y={218} w={6} h={2} c={METAL} />
        <Px x={24} y={214} w={4} h={4} c="#e8eef2" />
        <Px x={34} y={214} w={4} h={4} c="#e8eef2" />
      </Pix>
      <g style={{ pointerEvents: 'none' }}>
        <T x="88" y="16" size="4" fill="#606878">TROLLEY</T>
        {!run.ppe && <T x="10" y="112" size="3.6">WASH AND DRESS</T>}
        {!run.set && <T x="112" y="56" size="4">SET</T>}
        <T x="168" y="70" size="3.6">{run.drugOut ? '1 ml READY' : '1 ml NOT GIVEN'}</T>
        <T x="92" y="124" size="3.6">0.05% AND PAD</T>
        <T x="174" y="124" size="3.6">EDTA TSH</T>
        <T x="28" y="156" size="4">BBA</T>
        <T x="168" y="166" size="3.8">I AM STAYING</T>
        <T x="52" y="216" size="4.2">IF A CUT IS NEEDED</T>
        <T x="52" y="230" size="4" fill="#606878">YOU DO NOT DECIDE</T>
      </g>
      <Hot id="nurse-ppe" x={6} y={8} w={72} h={108} on={run.ppe} onPress={() => onFlag('ppe')} />
      <Hot id="nurse-set" x={88} y={22} w={70} h={54} on={run.set} onPress={() => onFlag('set')} />
      <Hot id="nurse-drug-out" x={164} y={22} w={66} h={54} on={run.drugOut} onPress={() => onFlag('drugOut')} />
      <Hot id="nurse-pad" x={88} y={80} w={70} h={52} on={run.pad} onPress={() => onFlag('pad')} />
      <Hot id="nurse-bottles" x={164} y={80} w={66} h={52} on={run.bottles} onPress={() => onFlag('bottles')} />
      <Hot id="nurse-form" x={6} y={122} w={72} h={52} on={run.form} onPress={() => onFlag('form')} />
      <Hot id="nurse-explain" x={84} y={142} w={148} h={48} on={run.explain} onPress={() => onFlag('explain')} />
      <Hot id="nurse-consent" x={8} y={198} w={224} h={44} on={run.consent} onPress={() => onFlag('consent')} />
    </Stage>
  )
}

/* ---------------------------------------------------------------- birth, one frame at a time */

function birthStep(run: NurseRun) {
  if (!run.time) return 0
  if (!run.cord) return 1
  if (!run.liquor) return 2
  if (!run.shown) return 3
  if (!run.birthmark) return 4
  return 5
}

export function BirthScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'time' | 'cord' | 'liquor' | 'shown' | 'birthmark') => void }) {
  const step = birthStep(run)
  return (
    <Stage h={176}>
      <Dots n={6} i={step} />
      {step === 0 && (
        <>
          <Pix>
            <Px x={0} y={18} w={240} h={158} c="#e7eef2" />
            <Px x={0} y={18} w={240} h={8} c={DRAPE_DARK} />
            <PxClock x={18} y={56} noted={false} />
            <Px x={120} y={70} w={28} h={40} c={SKIN_EDGE} />
            <Px x={124} y={74} w={20} h={32} c={SKIN} />
            <Px x={156} y={70} w={28} h={40} c={SKIN_EDGE} />
            <Px x={160} y={74} w={20} h={32} c={SKIN} />
            <PxOcciput cx={162} cy={96} />
            <Px x={148} y={108} w={28} h={8} c={MUCOSA} />
            <PxGlove x={128} y={78} />
            <PxGlove x={176} y={100} flip />
          </Pix>
          <g style={{ pointerEvents: 'none' }}>
            <T x="78" y="32" size="4.4">NURSE CHIU DELIVERS</T>
            <T x="14" y="108" size="4">CALL TIME</T>
          </g>
          <Hot id="nurse-time" x={8} y={48} w={56} h={64} on={false} onPress={() => onFlag('time')} />
        </>
      )}
      {step === 1 && (
        <>
          <Pix>
            <Px x={0} y={18} w={240} h={158} c="#f6efe8" />
            <Px x={108} y={30} w={24} h={4} c={HAIR_DARK} />
            <Px x={100} y={34} w={40} h={6} c={HAIR} />
            <Px x={96} y={40} w={48} h={8} c={SCALP} />
            <Px x={94} y={48} w={52} h={10} c={SCALP} />
            <Px x={100} y={44} w={8} h={4} c={HI} />
            <Px x={98} y={58} w={44} h={6} c={SKIN_DARK} />
            <Px x={108} y={64} w={24} h={14} c={SKIN} />
            <Px x={112} y={68} w={16} h={6} c={SKIN_DARK} />
            <Px x={80} y={76} w={80} h={8} c={SKIN_EDGE} />
            <Px x={64} y={84} w={112} h={10} c={SKIN} />
            <Px x={52} y={94} w={136} h={44} c={SKIN_EDGE} />
            <Px x={56} y={98} w={128} h={36} c={SKIN} />
            <Px x={64} y={102} w={16} h={10} c={HI} />
            <Px x={112} y={108} w={10} h={10} c={MUCOSA} />
            <Px x={114} y={110} w={6} h={6} c={MUCOSA_DEEP} />
            <Px x={120} y={112} w={72} h={10} c={CORD} />
            {Array.from({ length: 12 }, (_, i) => (
              <Px key={i} x={120 + i * 6} y={112} w={2} h={10} c={CORD_STRIPE} />
            ))}
          </Pix>
          <g style={{ pointerEvents: 'none' }}>
            <T x="70" y="28" size="4.4">LOOK AT THE NECK</T>
            <T x="16" y="164" size="4">CORD IS ON THE CHEST</T>
          </g>
          <Hot id="nurse-cord" x={88} y={96} w={64} h={36} on={false} onPress={() => onFlag('cord')} />
        </>
      )}
      {step === 2 && (
        <>
          <Pix>
            <Px x={0} y={18} w={240} h={158} c={DRAPE} />
            <Px x={28} y={48} w={40} h={70} c={SKIN_EDGE} />
            <Px x={32} y={52} w={32} h={62} c={SKIN} />
            <Px x={172} y={48} w={40} h={70} c={SKIN_EDGE} />
            <Px x={176} y={52} w={32} h={62} c={SKIN} />
            <Px x={96} y={56} w={48} h={28} c={MUCOSA_DEEP} />
            <Px x={100} y={60} w={40} h={20} c={MUCOSA} />
            <Px x={112} y={66} w={16} h={8} c="#e08890" />
            <Px x={68} y={112} w={104} h={32} c="#d8d8cc" />
            <Px x={72} y={116} w={96} h={24} c="#f7f7f2" />
            <Px x={84} y={126} w={64} h={14} c="#d5eef8" />
            <Px x={96} y={128} w={24} h={4} c="#f4fcff" />
            <Px x={80} y={132} w={12} h={4} c="#c5e4f4" />
          </Pix>
          <g style={{ pointerEvents: 'none' }}>
            <T x="62" y="32" size="4.4" fill="#f8f8f0">LIQUOR ON THE PAD</T>
          </g>
          <Hot id="nurse-liquor" x={78} y={120} w={84} h={28} on={false} onPress={() => onFlag('liquor')} />
        </>
      )}
      {step === 3 && (
        <>
          <Pix>
            <Px x={0} y={18} w={240} h={158} c="#d8e4ea" />
            <Px x={8} y={48} w={224} h={120} c={SKIN_EDGE} />
            <Px x={12} y={52} w={216} h={112} c={SKIN} />
            <Px x={20} y={60} w={28} h={16} c={HI} />
            <PxFace x={186} y={22} />
            <PxNewborn x={88} y={64} />
            <PxGlove x={58} y={70} />
            <PxGlove x={160} y={72} flip />
          </Pix>
          <g style={{ pointerEvents: 'none' }}>
            <T x="8" y="32" size="4">SHOW HER THE BABY</T>
          </g>
          <Hot id="nurse-show" x={70} y={58} w={100} h={90} on={false} onPress={() => onFlag('shown')} />
        </>
      )}
      {step === 4 && (
        <>
          <Pix>
            <Px x={0} y={18} w={240} h={158} c="#f6efe8" />
            <Px x={40} y={48} w={160} h={100} c="#f3e6dc" />
            <PxNewborn x={88} y={52} back />
          </Pix>
          <g style={{ pointerEvents: 'none' }}>
            <T x="62" y="32" size="4.4">LOOK OVER HER SKIN</T>
          </g>
          <Hot id="nurse-look" x={48} y={40} w={144} h={110} on={false} onPress={() => onFlag('birthmark')} />
        </>
      )}
      {step === 5 && (
        <>
          <Pix>
            <Px x={0} y={18} w={240} h={158} c="#d8e4ea" />
            <Px x={4} y={36} w={232} h={132} c={SKIN_EDGE} />
            <Px x={8} y={40} w={224} h={124} c={SKIN} />
            <Px x={16} y={48} w={36} h={20} c={HI} />
            <PxFace x={12} y={44} />
            <Px x={48} y={96} w={36} h={12} c={SKIN_DARK} />
            <Px x={56} y={88} w={28} h={12} c={SKIN} />
            <Px x={156} y={96} w={36} h={12} c={SKIN_DARK} />
            <Px x={156} y={88} w={28} h={12} c={SKIN} />
            <Px x={16} y={140} w={36} h={14} c="#f0c8d8" />
            <Px x={188} y={140} w={36} h={14} c="#f0c8d8" />
            <PxNewborn x={88} y={62} hat />
          </Pix>
          <g style={{ pointerEvents: 'none' }}>
            <T x="16" y="156" size="4.4" fill={MARK}>A GIRL · NO CORD · CLEAR · NO MARK</T>
          </g>
        </>
      )}
    </Stage>
  )
}

/* ---------------------------------------------------------------- two clamps, then the cut */

function CordClamp({ x, y, bad }: { x: number; y: number; bad?: boolean }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <Px x={x - 5} y={y - 16} w={10} h={32} c={bad ? BAD : '#3878b8'} />
      <Px x={x - 3} y={y - 14} w={6} h={28} c={bad ? '#f8d0d4' : '#f4f4f8'} />
      <Px x={x - 1} y={y - 8} w={2} h={16} c={bad ? BAD : '#3878b8'} />
    </g>
  )
}

function CordRun({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  if (x2 - x1 < 2) return null
  const w = x2 - x1
  return (
    <g style={{ pointerEvents: 'none' }}>
      <Px x={x1} y={y - 6} w={w} h={12} c={CORD} />
      {Array.from({ length: Math.floor(w / 6) }, (_, i) => (
        <Px key={i} x={x1 + i * 6} y={y - 6} w={2} h={12} c={CORD_STRIPE} />
      ))}
    </g>
  )
}

/** The cord from the umbilicus. One tap places the clamp on the baby's side. */
export function ClampPicture({ run, onPick }: { run: NurseRun; onPick: (cm: number) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const p = CLAMP_PICTURE
  const xAt = (cm: number) => p.umbilicusX + cm * p.pxPerCm
  const placed = run.clampCm
  const close = placed !== null && placed < MIN_CLAMP_CM
  const secondCm = placed === null ? null : Math.min(placed + 1.6, (p.w - 18 - p.umbilicusX) / p.pxPerCm)
  const cut = placed !== null && !close && secondCm !== null && secondCm - placed >= 1.2
  const mid = cut && secondCm !== null && placed !== null ? (xAt(placed) + xAt(secondCm)) / 2 : 0
  return (
    <div className="mx-auto mb-2 max-w-[360px]" style={{ touchAction: 'none' }}>
      <svg
        ref={svg}
        viewBox={`0 0 ${p.w} ${p.h}`}
        className="io-figure pixelated block h-auto w-full select-none"
        data-testid="nurse-clamp-picture"
        onPointerDown={(e) => {
          const pt = toLocal(svg.current, e)
          if (!pt) return
          const cm = cmAt(pt.x, pt.y)
          if (cm === null) return
          onPick(cm)
        }}
      >
        <rect width={p.w} height={p.h} fill="#e6eef2" />
        <Pix>
          <Px x={2} y={34} w={40} h={52} c="#c07868" />
          <Px x={6} y={38} w={32} h={44} c={BABY} />
          <Px x={10} y={30} w={20} h={10} c={HAIR} />
          <Px x={14} y={42} w={8} h={6} c="#f6c8ba" />
          <Px x={44} y={58} w={8} h={8} c={MUCOSA_DEEP} />
          <Px x={46} y={60} w={4} h={4} c="#6a2830" />
          <Px x={208} y={40} w={32} h={44} c={SKIN_EDGE} />
          <Px x={212} y={44} w={28} h={36} c={SKIN} />
          <Px x={222} y={50} w={18} h={24} c={MUCOSA} />
          <Px x={228} y={56} w={12} h={12} c={MUCOSA_DEEP} />
          {placed === null || !cut ? (
            <CordRun x1={p.umbilicusX} x2={p.w - 16} y={p.cordY} />
          ) : (
            <>
              <CordRun x1={p.umbilicusX} x2={xAt(placed) - 7} y={p.cordY} />
              <CordRun x1={xAt(secondCm!) + 7} x2={p.w - 16} y={p.cordY} />
            </>
          )}
          {[1, 2, 3, 4, 5].map((cm) => (
            <Px key={cm} x={xAt(cm)} y={p.cordY + 14} w={2} h={6} c={INK} />
          ))}
          {Array.from({ length: 11 }, (_, i) => (
            <Px key={i} x={xAt(MIN_CLAMP_CM)} y={p.cordY - 22 + i * 4} w={2} h={2} c={MARK} />
          ))}
          {cut && (
            <>
              <Px x={mid - 8} y={p.cordY - 16} w={4} h={4} c={METAL_DARK} />
              <Px x={mid + 4} y={p.cordY - 16} w={4} h={4} c={METAL_DARK} />
              <Px x={mid - 6} y={p.cordY - 12} w={2} h={10} c={METAL} />
              <Px x={mid + 4} y={p.cordY - 12} w={2} h={10} c={METAL} />
              <Px x={mid - 4} y={p.cordY - 4} w={8} h={2} c={METAL_DARK} />
              <Px x={mid - 2} y={p.cordY + 8} w={2} h={4} c={BLOOD} />
              <Px x={mid - 3} y={p.cordY + 12} w={4} h={3} c={BLOOD} />
            </>
          )}
        </Pix>
        {placed !== null && <CordClamp x={xAt(placed)} y={p.cordY} bad={close} />}
        {cut && secondCm !== null && <CordClamp x={xAt(secondCm)} y={p.cordY} />}
        <g style={{ pointerEvents: 'none' }}>
          <T x="4" y="14" size="4.2">BABY</T>
          <T x="196" y="14" size="4.2">MOTHER</T>
          <T x={xAt(MIN_CLAMP_CM) - 14} y={p.cordY - 26} size="4" fill={MARK}>2.5 cm</T>
          {[1, 2, 3, 4, 5].map((cm) => (
            <T key={cm} x={xAt(cm) - 3} y={p.cordY + 30} size="4.4">{String(cm)}</T>
          ))}
          <T x="6" y={p.h - 6} size="4.2" fill={close ? BAD : placed === null ? INK : MARK}>
            {placed === null ? 'BABY SIDE, 2.5 cm OR FURTHER' : close ? `${placed.toFixed(1)} cm. TOO CLOSE` : `${placed.toFixed(1)} cm, THEN CUT BETWEEN`}
          </T>
        </g>
      </svg>
    </div>
  )
}

/* ---------------------------------------------------------------- drug: feel, then the thigh */

export function DrugScene({ run, onPalpate, onInject, onFlag }: { run: NurseRun; onPalpate: () => void; onInject: () => void; onFlag: (key: 'drugTime' | 'edta' | 'clotted') => void }) {
  const early = run.drugEarly
  return (
    <Stage h={200}>
      <Pix>
        <Px x={86} y={24} w={146} h={112} c={SKIN_EDGE} />
        <Px x={90} y={28} w={138} h={104} c={SKIN} />
        <Px x={100} y={36} w={24} h={12} c={HI} />
        <Px x={148} y={4} w={20} h={8} c={HAIR} />
        <Px x={146} y={10} w={24} h={16} c={BABY} />
        <Px x={150} y={14} w={4} h={3} c="#1a1410" />
        <Px x={158} y={14} w={4} h={3} c="#1a1410" />
        <Px x={152} y={18} w={8} h={2} c="#c06070" />
        <Px x={140} y={24} w={36} h={16} c={BABY_SHADE} />
        <Px x={144} y={26} w={28} h={12} c={BABY} />
        {run.palpated ? (
          <>
            <Px x={136} y={50} w={32} h={6} c="#a05040" />
            <Px x={128} y={56} w={48} h={8} c="#a05040" />
            <Px x={124} y={64} w={56} h={16} c="#c87060" />
            <Px x={132} y={68} w={20} h={8} c="#d8a090" />
            <Px x={128} y={80} w={48} h={8} c="#a05040" />
            <Px x={136} y={88} w={32} h={6} c="#c87060" />
          </>
        ) : (
          <>
            <Px x={128} y={48} w={48} h={6} c={SKIN_EDGE} />
            <Px x={120} y={54} w={64} h={8} c="#e8b0a0" />
            <Px x={116} y={62} w={72} h={16} c="#f0c0b0" />
            <Px x={120} y={78} w={64} h={8} c="#e8b0a0" />
            <Px x={128} y={86} w={48} h={6} c={SKIN_EDGE} />
          </>
        )}
        {run.palpated && (
          <>
            <Px x={108} y={58} w={18} h={10} c={GLOVE} />
            <Px x={110} y={54} w={4} h={8} c="#f4ecd4" />
            <Px x={116} y={52} w={4} h={10} c={GLOVE} />
            <Px x={122} y={56} w={4} h={6} c={GLOVE_DARK} />
            <Px x={186} y={58} w={18} h={10} c={GLOVE} />
            <Px x={186} y={54} w={4} h={8} c="#f4ecd4" />
            <Px x={192} y={52} w={4} h={10} c={GLOVE} />
            <Px x={198} y={56} w={4} h={6} c={GLOVE_DARK} />
          </>
        )}
        <Px x={8} y={48} w={70} h={88} c={early ? BAD : SKIN_EDGE} />
        <Px x={12} y={52} w={62} h={80} c={early ? '#f3c2c6' : SKIN} />
        <Px x={16} y={60} w={16} h={28} c={early ? '#f8d0d4' : HI} />
        <Px x={20} y={120} w={40} h={12} c={early ? '#e8a0a8' : SKIN_DARK} />
        <PxSyringe x={12} y={78} pushed={run.syntometrine} bad={early} />
        <PxClock x={16} y={150} noted={run.drugTime} />
        <PxBottle x={86} y={152} cap="#6a3d8a" />
        {run.edta && (
          <>
            <Px x={108} y={162} w={28} h={16} c="#fff" />
            <Px x={108} y={162} w={28} h={2} c={MARK} />
            <Px x={108} y={176} w={28} h={2} c={MARK} />
          </>
        )}
        <PxBottle x={168} y={152} cap="#b03040" />
        {run.clotted && (
          <>
            <Px x={190} y={162} w={28} h={16} c="#fff" />
            <Px x={190} y={162} w={28} h={2} c={MARK} />
            <Px x={190} y={176} w={28} h={2} c={MARK} />
          </>
        )}
      </Pix>
      <g style={{ pointerEvents: 'none' }}>
        <T x="8" y="14" size="4">HER R THIGH</T>
        {run.palpated && <T x="124" y="108" size="4" fill={MARK}>ONE BABY</T>}
        <T x="14" y="132" size="3.6" fill={early ? BAD : INK}>{early ? 'TOO SOON' : run.syntometrine ? '1 ml IM' : '1 ml'}</T>
        <T x="16" y="192" size="3.6">{run.drugTime ? 'NOTED' : 'TIME'}</T>
        <T x="112" y="174" size="3.6">{run.edta ? 'LAI' : 'EDTA'}</T>
        <T x="194" y="174" size="3.6">{run.clotted ? 'LAI' : 'TSH'}</T>
      </g>
      <Hot id="nurse-palpate" x={90} y={32} w={130} h={84} on={run.palpated} onPress={onPalpate} />
      <Hot id="nurse-syntometrine" x={8} y={40} w={70} h={96} on={run.syntometrine && !early} onPress={onInject} />
      <Hot id="nurse-drug-time" x={8} y={148} w={52} h={46} on={run.drugTime} onPress={() => onFlag('drugTime')} />
      <Hot id="nurse-label-edta" x={66} y={148} w={80} h={46} on={run.edta} onPress={() => onFlag('edta')} />
      <Hot id="nurse-label-clotted" x={152} y={148} w={80} h={46} on={run.clotted} onPress={() => onFlag('clotted')} />
    </Stage>
  )
}

/* ---------------------------------------------------------------- third stage: watch, do not pull */

export function MotherScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'gush' | 'lengthen' | 'fundus' | 'vessels' | 'bag' | 'padOn' | 'warm' | 'loss' | 'pulse') => void }) {
  const cordY2 = run.lengthen ? 154 : 142
  return (
    <Stage h={268}>
      <Pix>
        <Px x={0} y={0} w={156} h={164} c={DRAPE} />
        <Px x={0} y={0} w={20} h={164} c={DRAPE_DARK} />
        <Px x={16} y={28} w={36} h={100} c={SKIN_EDGE} />
        <Px x={20} y={32} w={28} h={92} c={SKIN} />
        <Px x={108} y={28} w={36} h={100} c={SKIN_EDGE} />
        <Px x={112} y={32} w={28} h={92} c={SKIN} />
        <Px x={52} y={36} w={56} h={28} c={SKIN_DARK} />
        <Px x={run.lengthen ? 56 : 64} y={56} w={run.lengthen ? 48 : 32} h={run.lengthen ? 28 : 20} c={MUCOSA_DEEP} />
        <Px x={run.lengthen ? 60 : 68} y={60} w={run.lengthen ? 40 : 24} h={run.lengthen ? 20 : 12} c={MUCOSA} />
        {run.lengthen && <Px x={68} y={66} w={24} h={12} c="#7a1424" />}
        <Px x={114} y={86} w={8} h={cordY2 - 86} c={CORD} />
        {Array.from({ length: Math.floor((cordY2 - 86) / 6) }, (_, i) => (
          <Px key={i} x={114} y={86 + i * 6} w={8} h={2} c={CORD_STRIPE} />
        ))}
        {run.gush ? (
          <>
            <Px x={100} y={84} w={8} h={10} c={BLOOD} />
            <Px x={96} y={92} w={12} h={8} c={BLOOD} />
            <Px x={108} y={96} w={8} h={12} c={BLOOD} />
            <Px x={104} y={104} w={6} h={6} c="#c04048" />
          </>
        ) : (
          <Px x={112} y={90} w={10} h={8} c={BLOOD} />
        )}
        <Px x={160} y={22} w={68} h={48} c={INK} />
        <Px x={162} y={24} w={64} h={44} c={SKIN} />
        <Px x={run.fundus ? 182 : 170} y={run.fundus ? 36 : 42} w={run.fundus ? 28 : 40} h={run.fundus ? 22 : 18} c={run.fundus ? '#a05040' : '#e8b0a0'} />
        <Px x={run.fundus ? 186 : 176} y={run.fundus ? 40 : 46} w={run.fundus ? 16 : 24} h={run.fundus ? 10 : 8} c={run.fundus ? '#c87060' : '#f0c0b0'} />
        <Px x={168} y={108} w={36} h={36} c="#9aa0b8" />
        <Px x={172} y={112} w={28} h={28} c="#eef0f4" />
        <Px x={176} y={124} w={8} h={8} c="#f0e0e0" />
        <Px x={178} y={126} w={4} h={4} c="#b03040" />
        <Px x={192} y={124} w={8} h={8} c="#f0e0e0" />
        <Px x={194} y={126} w={4} h={4} c="#b03040" />
        <Px x={180} y={114} w={16} h={10} c="#f0e0e0" />
        <Px x={182} y={116} w={12} h={6} c="#6a2838" />
        <Px x={16} y={176} w={36} h={24} c="#7a1424" />
        <Px x={20} y={180} w={28} h={16} c="#5a1020" />
        <Px x={14} y={174} w={48} h={28} c="#607080" />
        <Px x={16} y={186} w={44} h={14} c="#dfe8ea" />
        {run.bag && <Px x={16} y={178} w={44} h={3} c={MARK} />}
        <Px x={96} y={180} w={48} h={22} c="#d8d8cc" />
        <Px x={100} y={184} w={40} h={14} c="#f7f7f2" />
        <Px x={104} y={188} w={32} h={3} c="#7eb6e0" />
        <Px x={168} y={180} w={56} h={22} c={run.warm ? '#f4f4ec' : '#e7d7c4'} />
        <Px x={172} y={184} w={48} h={2} c="#dcdcd0" />
        <Px x={170} y={190} w={50} h={2} c="#dcdcd0" />
        <Px x={172} y={196} w={44} h={2} c="#dcdcd0" />
        <Px x={24} y={228} w={32} h={28} c="#7a90a0" />
        <Px x={28} y={232} w={24} h={20} c="#e7eef2" />
        <Px x={32} y={242} w={16} h={8} c={BLOOD} />
        <Px x={96} y={232} w={88} h={14} c={SKIN_EDGE} />
        <Px x={100} y={234} w={80} h={10} c={SKIN} />
        <Px x={108} y={230} w={6} h={16} c={GLOVE} />
        <Px x={118} y={228} w={6} h={18} c={GLOVE} />
        <Px x={116} y={236} w={4} h={4} c={GLOVE_DARK} />
      </Pix>
      <g style={{ pointerEvents: 'none' }}>
        <T x="6" y="14" size="4" fill="#f8f8f0">FROM THE FOOT</T>
        <T x="166" y="34" size="3.4">{run.fundus ? 'FIRM' : 'FUNDUS'}</T>
        <T x="166" y="148" size="3.4">{run.vessels ? '2 ART 1 VEIN' : 'CUT END'}</T>
        <T x="18" y="204" size="3.6">{run.bag ? 'SEALED' : 'BAG'}</T>
        <T x="108" y="176" size="3.6">PAD</T>
        <T x="176" y="176" size="3.6">BLANKET</T>
        <T x="12" y="262" size="3.4" fill={run.loss ? MARK : INK}>{run.loss ? 'UNDER 500' : 'LOSS'}</T>
        <T x="150" y="248" size="3.8">{run.pulse ? 'PULSE STEADY' : 'HER WRIST'}</T>
      </g>
      <Hot id="nurse-sign-fundus" x={156} y={18} w={76} h={56} on={run.fundus} onPress={() => onFlag('fundus')} />
      <Hot id="nurse-sign-gush" x={96} y={78} w={44} h={34} on={run.gush} onPress={() => onFlag('gush')} />
      <Hot id="nurse-sign-length" x={98} y={116} w={40} h={36} on={run.lengthen} onPress={() => onFlag('lengthen')} />
      <Hot id="nurse-vessels" x={162} y={96} w={70} h={56} on={run.vessels} onPress={() => onFlag('vessels')} />
      <Hot id="nurse-bag" x={8} y={168} w={70} h={46} on={run.bag} onPress={() => onFlag('bag')} />
      <Hot id="nurse-pad-on" x={84} y={168} w={72} h={46} on={run.padOn} onPress={() => onFlag('padOn')} />
      <Hot id="nurse-warm" x={162} y={168} w={70} h={46} on={run.warm} onPress={() => onFlag('warm')} />
      <Hot id="nurse-loss" x={8} y={220} w={70} h={42} on={run.loss} onPress={() => onFlag('loss')} />
      <Hot id="nurse-pulse" x={84} y={220} w={148} h={42} on={run.pulse} onPress={() => onFlag('pulse')} />
    </Stage>
  )
}

/* ---------------------------------------------------------------- leaving A&E */

export function HandoverScene({ run, onFlag }: { run: NurseRun; onFlag: (key: 'stable' | 'ward' | 'specimens' | 'papers' | 'escort') => void }) {
  return (
    <Stage h={220}>
      <Pix>
        <Px x={12} y={36} w={130} h={28} c="#c5ced6" />
        <Px x={16} y={32} w={40} h={8} c="#f4f1e8" />
        <Px x={20} y={28} w={28} h={12} c={SKIN} />
        <Px x={24} y={24} w={16} h={6} c={HAIR} />
        <Px x={26} y={30} w={3} h={2} c="#1a1410" />
        <Px x={34} y={30} w={3} h={2} c="#1a1410" />
        <Px x={70} y={30} w={28} h={8} c="#f0c8d8" />
        <Px x={72} y={36} w={24} h={16} c={BABY} />
        <Px x={76} y={40} w={3} h={2} c="#1a1410" />
        <Px x={86} y={40} w={3} h={2} c="#1a1410" />
        <Px x={22} y={62} w={12} h={6} c={METAL_DARK} />
        <Px x={118} y={62} w={12} h={6} c={METAL_DARK} />
        <Px x={176} y={28} w={36} h={48} c={INK} />
        <Px x={180} y={32} w={28} h={28} c={run.ward ? '#d7f0e0' : '#8fd0c8'} />
        <Px x={184} y={36} w={8} h={2} c="#fff" />
        <Px x={184} y={42} w={16} h={2} c={INK} />
        <Px x={184} y={48} w={12} h={2} c={INK} />
        <Px x={190} y={64} w={8} h={6} c="#c8c0b0" />
        <Px x={14} y={124} w={96} h={28} c="#7d8b98" />
        <Px x={18} y={128} w={88} h={20} c="#d5dde4" />
        <PxBottle x={24} y={124} cap="#6a3d8a" />
        <PxBottle x={42} y={124} cap="#b03040" />
        <Px x={62} y={132} w={22} h={14} c="#607080" />
        <Px x={64} y={134} w={18} h={10} c="#dfe8ea" />
        <Px x={68} y={136} w={10} h={6} c="#7a1424" />
        <Px x={132} y={122} w={36} h={30} c={INK} />
        <Px x={134} y={124} w={32} h={26} c="#fff" />
        <Px x={138} y={130} w={24} h={2} c="#c8c0b0" />
        <Px x={138} y={136} w={18} h={2} c="#c8c0b0" />
        <Px x={172} y={126} w={36} h={28} c="#a09040" />
        <Px x={174} y={128} w={32} h={24} c="#fff8e8" />
        <Px x={178} y={134} w={20} h={2} c="#c8b060" />
        <Px x={178} y={140} w={16} h={2} c="#c8b060" />
        <PxFace x={16} y={172} />
        <Px x={18} y={196} w={24} h={14} c={GOWN} />
        <Px x={14} y={204} w={10} h={6} c={GLOVE} />
        <Px x={52} y={186} w={24} h={18} c="#b03040" />
        <Px x={54} y={188} w={20} h={4} c="#d04858" />
        <Px x={86} y={182} w={16} h={26} c={INK} />
        <Px x={88} y={186} w={12} h={12} c="#8fd0c8" />
        <Px x={120} y={196} w={90} h={4} c="#8a929c" />
        <Px x={120} y={192} w={16} h={4} c="#c5ced6" />
        <Px x={140} y={192} w={16} h={4} c="#c5ced6" />
      </Pix>
      <g style={{ pointerEvents: 'none' }}>
        <T x="16" y="22" size="3.8">{run.stable ? 'BOTH STEADY' : 'MOTHER AND BABY'}</T>
        <T x="184" y="50" size="3.4" fill={INK}>{run.ward ? 'WARD' : 'CALL'}</T>
        <T x="82" y="142" size="3.4">TRAY</T>
        <T x="138" y="146" size="3.4">NOTES</T>
        <T x="178" y="146" size="3.4">BBA</T>
        <T x="120" y="188" size="3.8">WALK, BAG, PHONE</T>
      </g>
      <Hot id="nurse-stable" x={8} y={8} w={150} h={64} on={run.stable} onPress={() => onFlag('stable')} />
      <Hot id="nurse-ward" x={164} y={12} w={68} h={72} on={run.ward} onPress={() => onFlag('ward')} />
      <Hot id="nurse-specimens" x={8} y={112} w={108} h={48} on={run.specimens} onPress={() => onFlag('specimens')} />
      <Hot id="nurse-papers" x={124} y={112} w={108} h={48} on={run.papers} onPress={() => onFlag('papers')} />
      <Hot id="nurse-escort" x={8} y={168} w={224} h={44} on={run.escort} onPress={() => onFlag('escort')} />
    </Stage>
  )
}
