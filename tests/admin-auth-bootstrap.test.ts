import {describe, expect, it, vi} from 'vitest';
import {verifyPassword} from 'better-auth/crypto';
import type {Pool} from 'pg';
import {createBootstrapSuperAdmin, resetBootstrapSuperAdminPassword} from '@/lib/server/auth-core';

const password = 'fictional-local-bootstrap-password';
function database({existing = false, credentialCount = 1} = {}) {
  const query = vi.fn(async (sql: string) => {
    if (sql.startsWith('SELECT id FROM blog_user WHERE role')) return {rowCount: existing ? 1 : 0, rows: existing ? [{id: 'existing'}] : []};
    if (sql.startsWith('SELECT id FROM blog_user WHERE lower')) return {rowCount: existing ? 1 : 0, rows: existing ? [{id: 'existing'}] : []};
    if (sql.startsWith('UPDATE blog_account')) return {rowCount: credentialCount, rows: credentialCount ? [{id: 'credential'}] : []};
    return {rowCount: 1, rows: []};
  });
  const release = vi.fn(), connect = vi.fn().mockResolvedValue({query, release});
  return {db: {connect} as unknown as Pool, query, release};
}

describe('trusted CLI account creation and recovery', () => {
  it('creates a reader then promotes it in one transaction using the official password format', async () => {
    const {db, query, release} = database();
    await createBootstrapSuperAdmin(db, {email: 'fictional@example.com', name: 'Test operator', password});
    const calls = query.mock.calls as unknown as [string, unknown[]?][];
    expect(calls[0][0]).toBe('BEGIN');
    expect(calls[1][0]).toContain('pg_advisory_xact_lock');
    expect(calls.find(([sql]) => sql.startsWith('INSERT INTO blog_user'))?.[1]).toContain('reader');
    expect(calls.find(([sql]) => sql.startsWith('UPDATE blog_user'))?.[1]).toContain('super_admin');
    const credential = calls.find(([sql]) => sql.startsWith('INSERT INTO blog_account'))![1]!;
    expect(credential).toContain('credential');
    expect(credential).not.toContain(password);
    expect(await verifyPassword({hash: credential[3] as string, password})).toBe(true);
    expect(calls.at(-1)?.[0]).toBe('COMMIT');
    expect(calls.some(([sql]) => sql.startsWith('INSERT INTO blog_session'))).toBe(false);
    expect(release).toHaveBeenCalledOnce();
  });
  it('refuses an existing administrator/account and rolls back without overwriting it', async () => {
    const {db, query} = database({existing: true});
    await expect(createBootstrapSuperAdmin(db, {email: 'fictional@example.com', name: 'Test operator', password})).rejects.toThrow('Bootstrap refused');
    expect(query.mock.calls.some(([sql]) => /^(INSERT|UPDATE|DELETE)/.test(sql))).toBe(false);
    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });
  it('recovery only updates an exact existing super admin credential and revokes its sessions', async () => {
    const {db, query} = database({existing: true});
    await resetBootstrapSuperAdminPassword(db, {email: 'fictional@example.com', password});
    const calls = query.mock.calls as unknown as [string, unknown[]?][];
    const selected = calls.find(([sql]) => sql.startsWith('SELECT id FROM blog_user WHERE lower'))!;
    expect(selected[1]).toEqual(['fictional@example.com', 'super_admin']);
    const updated = calls.find(([sql]) => sql.startsWith('UPDATE blog_account'))!;
    expect(updated[1]?.slice(1)).toEqual(['existing', 'credential']);
    expect(await verifyPassword({hash: updated[1]![0] as string, password})).toBe(true);
    expect(calls.find(([sql]) => sql.startsWith('DELETE FROM blog_session'))?.[1]).toEqual(['existing']);
    expect(calls.at(-1)?.[0]).toBe('COMMIT');
  });
  it('does not create/promote an unknown recovery account', async () => {
    const {db, query} = database();
    await expect(resetBootstrapSuperAdminPassword(db, {email: 'fictional@example.com', password})).rejects.toThrow('Password recovery refused');
    expect(query.mock.calls.some(([sql]) => /^(INSERT|UPDATE|DELETE)/.test(sql))).toBe(false);
  });
  it('rolls back recovery if the expected credential does not exist', async () => {
    const {db, query} = database({existing: true, credentialCount: 0});
    await expect(resetBootstrapSuperAdminPassword(db, {email: 'fictional@example.com', password})).rejects.toThrow('exactly one password credential');
    expect(query.mock.calls.some(([sql]) => sql.startsWith('DELETE'))).toBe(false);
    expect(query.mock.calls.at(-1)?.[0]).toBe('ROLLBACK');
  });
});
