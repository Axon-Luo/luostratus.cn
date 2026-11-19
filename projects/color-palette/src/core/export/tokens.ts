import type { Palette, Role } from '../palette/types';
import { toColorMap } from '../palette/types';
import { buildScale, buildSemanticTokens, SCALE_STEPS } from '../palette/scale';
import type { SemanticKey } from '../palette/scale';

export type TokenFormat = 'css' | 'tailwind' | 'figma' | 'android' | 'ios' | 'flutter';

export interface TokenSet {
  light: Record<Role, string>;
  dark?: Record<Role, string>;
  scales: Record<Role, Record<number, string>>;
  semantic: Record<SemanticKey, string>;
}

const ROLE_NAMES: Array<{ id: Role; name: string }> = [
  { id: 'primary', name: 'primary' },
  { id: 'secondary', name: 'secondary' },
  { id: 'accent', name: 'accent' },
  { id: 'bg', name: 'bg' },
  { id: 'surface', name: 'surface' },
  { id: 'text', name: 'text' },
];

export function buildTokens(p: Palette): TokenSet {
  const light = toColorMap(p);
  const dark = p.dark
    ? (Object.fromEntries(p.dark.map((c) => [c.role, c.hex])) as Record<Role, string>)
    : undefined;
  const scales = {} as Record<Role, Record<number, string>>;
  for (const role of ROLE_NAMES) scales[role.id] = buildScale(light[role.id]);
  return {
    light,
    dark,
    scales,
    semantic: buildSemanticTokens(light.bg),
  };
}

function cssLines(tokens: TokenSet, prefix = '--color'): string[] {
  const lines: string[] = [];
  for (const role of ROLE_NAMES) {
    for (const step of SCALE_STEPS) {
      lines.push(`  ${prefix}-${role.name}-${step}: ${tokens.scales[role.id][step]};`);
    }
  }
  for (const [key, hex] of Object.entries(tokens.semantic)) {
    lines.push(`  ${prefix}-${key}: ${hex};`);
  }
  return lines;
}

export function tokensToCss(tokens: TokenSet): string {
  const parts = [':root {', ...cssLines(tokens), '}'];
  if (tokens.dark) {
    parts.push('', '[data-theme="dark"] {', ...ROLE_NAMES.map((r) => `  --color-${r.name}: ${tokens.dark?.[r.id]};`), '}');
  }
  return parts.join('\n') + '\n';
}

export function tokensToTailwind(tokens: TokenSet): string {
  return ['@theme {', ...cssLines(tokens), '}'].join('\n') + '\n';
}

function tokenValue(value: string) {
  return { $value: value, $type: 'color' };
}

export function tokensToFigma(tokens: TokenSet): string {
  const color: Record<string, unknown> = {};
  for (const role of ROLE_NAMES) {
    const steps: Record<string, unknown> = {};
    for (const step of SCALE_STEPS) steps[String(step)] = tokenValue(tokens.scales[role.id][step]);
    color[role.name] = steps;
  }
  const semantic: Record<string, unknown> = {};
  for (const [key, hex] of Object.entries(tokens.semantic)) semantic[key] = tokenValue(hex);
  color.semantic = semantic;
  return JSON.stringify({ color }, null, 2);
}

export function tokensToAndroid(tokens: TokenSet): string {
  const lines = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>'];
  for (const role of ROLE_NAMES) {
    for (const step of SCALE_STEPS) {
      lines.push(`  <color name="${role.name}_${step}">${tokens.scales[role.id][step]}</color>`);
    }
  }
  for (const [key, hex] of Object.entries(tokens.semantic)) {
    lines.push(`  <color name="${key}">${hex}</color>`);
  }
  lines.push('</resources>');
  return lines.join('\n') + '\n';
}

function hexToInt(hex: string): string {
  return `0x${hex.replace('#', '').toUpperCase()}`;
}

export function tokensToIos(tokens: TokenSet): string {
  const lines = ['import SwiftUI', '', 'enum ColorTokens {'];
  for (const role of ROLE_NAMES) {
    for (const step of SCALE_STEPS) {
      lines.push(`  static let ${role.name}${step} = Color(hex: ${hexToInt(tokens.scales[role.id][step])})`);
    }
  }
  for (const [key, hex] of Object.entries(tokens.semantic)) {
    lines.push(`  static let ${key} = Color(hex: ${hexToInt(hex)})`);
  }
  lines.push('}');
  return lines.join('\n') + '\n';
}

export function tokensToFlutter(tokens: TokenSet): string {
  const lines = ['import \'package:flutter/material.dart\';', '', 'class ColorTokens {'];
  for (const role of ROLE_NAMES) {
    for (const step of SCALE_STEPS) {
      const value = tokens.scales[role.id][step].replace('#', '').toUpperCase();
      lines.push(`  static const ${role.name}${step} = Color(0xFF${value});`);
    }
  }
  for (const [key, hex] of Object.entries(tokens.semantic)) {
    const value = hex.replace('#', '').toUpperCase();
    lines.push(`  static const ${key} = Color(0xFF${value});`);
  }
  lines.push('}');
  return lines.join('\n') + '\n';
}

export function tokenText(p: Palette, format: TokenFormat): string {
  const tokens = buildTokens(p);
  if (format === 'css') return tokensToCss(tokens);
  if (format === 'tailwind') return tokensToTailwind(tokens);
  if (format === 'figma') return tokensToFigma(tokens);
  if (format === 'android') return tokensToAndroid(tokens);
  if (format === 'ios') return tokensToIos(tokens);
  return tokensToFlutter(tokens);
}

export const TOKEN_FORMATS: Array<{ id: TokenFormat; label: string; ext: string }> = [
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'tailwind', label: 'Tailwind', ext: 'css' },
  { id: 'figma', label: 'Figma Tokens', ext: 'json' },
  { id: 'android', label: 'Android XML', ext: 'xml' },
  { id: 'ios', label: 'iOS Swift', ext: 'swift' },
  { id: 'flutter', label: 'Flutter', ext: 'dart' },
];
