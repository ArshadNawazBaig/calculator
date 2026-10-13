'use client';

import {useMemo, useSyncExternalStore} from 'react';
import {emptyWorkspace, isSavedCalculation, maxBackupLength, maxSavedCalculations, mergeWorkspaces, parseWorkspace, workspaceKey, type SavedCalculation, type Workspace} from './model';

const changeEvent = 'finflo-workspace-change';
const unavailable = '\0storage-unavailable';
export type WorkspaceError = 'storage' | 'invalid' | 'limit' | 'backup';
export type WriteResult = {ok: true} | {ok: false; error: WorkspaceError};

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {if (event.key === workspaceKey || event.key === null) listener();};
  window.addEventListener('storage', onStorage);
  window.addEventListener(changeEvent, listener);
  return () => {window.removeEventListener('storage', onStorage); window.removeEventListener(changeEvent, listener);};
}
function getSnapshot() {
  try {return window.localStorage.getItem(workspaceKey);} catch {return unavailable;}
}
const getServerSnapshot = () => null;
let cachedRaw: string | null | undefined;
let cachedWorkspace: Workspace | null = null;
function parseSnapshot(raw: string | null) {
  if (cachedRaw !== raw) {cachedRaw = raw;cachedWorkspace = parseWorkspace(raw);}
  return cachedWorkspace;
}

export function useWorkspace() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {const data = parseSnapshot(raw);return {data: data ?? emptyWorkspace, error: raw === unavailable ? 'storage' as const : data ? null : 'invalid' as const};}, [raw]);
}

function write(data: Workspace): WriteResult {
  const raw = JSON.stringify(data);
  if (raw.length > maxBackupLength || data.calculations.length > maxSavedCalculations || data.favorites.length > 250) return {ok: false, error: 'limit'};
  try {window.localStorage.setItem(workspaceKey, raw);} catch {return {ok: false, error: 'storage'};}
  window.dispatchEvent(new Event(changeEvent));
  return {ok: true};
}
function update(transform: (data: Workspace) => Workspace): WriteResult {
  const raw = getSnapshot(), data = parseWorkspace(raw);
  if (!data) return {ok: false, error: raw === unavailable ? 'storage' : 'invalid'};
  return write(transform(data));
}
export function toggleFavorite(slug: string) {
  return update(data => ({...data, favorites: data.favorites.includes(slug) ? data.favorites.filter(item => item !== slug) : [...data.favorites, slug]}));
}
export function saveCalculation(calculation: SavedCalculation): WriteResult {
  if (!isSavedCalculation(calculation)) return {ok: false, error: 'limit'};
  return update(data => ({...data, calculations: [calculation, ...data.calculations]}));
}
export function renameCalculation(id: string, name: string): WriteResult {
  return update(data => ({...data, calculations: data.calculations.map(item => item.id === id ? {...item, name: name.trim().slice(0, 80) || item.name} : item)}));
}
export function deleteCalculation(id: string) {
  return update(data => ({...data, calculations: data.calculations.filter(item => item.id !== id)}));
}
export function clearWorkspace(): WriteResult {
  try {window.localStorage.removeItem(workspaceKey);} catch {return {ok: false, error: 'storage'};}
  window.dispatchEvent(new Event(changeEvent));
  return {ok: true};
}
export function importWorkspace(raw: string): WriteResult {
  const incoming = parseWorkspace(raw);
  if (!incoming) return {ok: false, error: 'backup'};
  const currentRaw = getSnapshot();
  if (currentRaw === unavailable) return {ok: false, error: 'storage'};
  const merged = mergeWorkspaces(parseWorkspace(currentRaw) ?? emptyWorkspace, incoming);
  return merged ? write(merged) : {ok: false, error: 'limit'};
}
