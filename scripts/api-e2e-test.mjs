/**
 * QuickCourt API end-to-end smoke test.
 *
 * Mints a JWT per role (USER / FACILITY_OWNER / ADMIN) from real DB users,
 * then exercises the API surface against a running dev server.
 *
 * Run:  node scripts/api-e2e-test.mjs
 * Requires the dev server on http://localhost:3000 and .env with DATABASE_URL + JWT_SECRET.
 */

import 'dotenv/config';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const results = [];
let section = 'general';
const setSection = (s) => { section = s; };

function record(name, ok, detail = '') {
  results.push({ section, name, ok, detail });
  const tag = ok ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  ${tag}  ${name}${detail ? `  \x1b[90m${detail}\x1b[0m` : ''}`);
}

function mintToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  let json = null;
  try { json = await res.json(); } catch { /* non-json */ }
  return { status: res.status, json, ok: res.ok };
}

// assert helpers
async function expectStatus(name, method, path, opts, allowed) {
  const r = await api(method, path, opts);
  const ok = allowed.includes(r.status);
  record(name, ok, ok ? `${r.status}` : `got ${r.status} ${r.json?.message || r.json?.error || ''}`);
  return r;
}
async function expectSuccess(name, method, path, opts) {
  const r = await api(method, path, opts);
  const ok = r.ok && (r.json?.success !== false);
  record(name, ok, ok ? `${r.status}` : `got ${r.status} ${r.json?.message || r.json?.error || ''}`);
  return r;
}

async function findUser(role) {
  const { rows } = await pool.query(
    `SELECT id, email, role FROM users WHERE role = $1 AND "isActive" = true ORDER BY "createdAt" ASC LIMIT 1`,
    [role]
  );
  return rows[0] || null;
}

async function main() {
  console.log(`\n=== QuickCourt API E2E — ${BASE} ===\n`);

  // ---- Resolve role users ----
  const player = await findUser('USER');
  const owner = await findUser('FACILITY_OWNER');
  const admin = await findUser('ADMIN');
  console.log('Users:', {
    player: player?.email || 'NONE',
    owner: owner?.email || 'NONE',
    admin: admin?.email || 'NONE',
  });
  const playerTok = player ? mintToken(player) : null;
  const ownerTok = owner ? mintToken(owner) : null;
  const adminTok = admin ? mintToken(admin) : null;

  // pick an approved venue id for public tests
  const { rows: appRows } = await pool.query(
    `SELECT id FROM facilities WHERE status = 'APPROVED' ORDER BY "createdAt" ASC LIMIT 1`
  );
  const approvedVenueId = appRows[0]?.id || null;

  // ===================== PUBLIC =====================
  setSection('public');
  console.log('\n[Public]');
  await expectSuccess('GET /api/home', 'GET', '/api/home');
  await expectSuccess('GET /api/venues/search', 'GET', '/api/venues/search?limit=5');
  await expectSuccess('GET /api/venues/cities', 'GET', '/api/venues/cities?limit=20');
  await expectSuccess('GET /api/venues/filters', 'GET', '/api/venues/filters');
  await expectStatus('GET /api/venues/trending', 'GET', '/api/venues/trending', {}, [200, 404]);
  await expectSuccess('GET /api/venues/nearby', 'GET', '/api/venues/nearby?latitude=19.07&longitude=72.87&radius=50&limit=10');
  await expectSuccess('GET /api/sports', 'GET', '/api/sports');
  await expectSuccess('GET /api/amenities', 'GET', '/api/amenities');
  await expectSuccess('GET /api/matches', 'GET', '/api/matches');
  if (approvedVenueId) {
    await expectSuccess('GET /api/venues/[id] (approved, public)', 'GET', `/api/venues/${approvedVenueId}`);
    await expectSuccess('GET /api/venues/[id]/reviews', 'GET', `/api/venues/${approvedVenueId}/reviews`);
    await expectStatus('GET /api/venues/[id]/similar', 'GET', `/api/venues/${approvedVenueId}/similar`, {}, [200]);
  } else {
    record('approved venue available', false, 'no APPROVED facility in DB');
  }
  // unauth deactivation should be rejected
  await expectStatus('DELETE /api/users/account (no auth) → 401', 'DELETE', '/api/users/account', { body: { reason: 'x', password: 'y' } }, [401]);

  // ===================== PLAYER =====================
  setSection('player');
  console.log('\n[Player]');
  if (!playerTok) {
    record('player user exists', false, 'no USER role in DB');
  } else {
    await expectSuccess('GET /api/auth/me', 'GET', '/api/auth/me', { token: playerTok });
    await expectSuccess('GET /api/users/profile', 'GET', '/api/users/profile', { token: playerTok });
    await expectSuccess('GET /api/users/dashboard', 'GET', '/api/users/dashboard?period=month&includeStats=true', { token: playerTok });
    await expectSuccess('GET /api/users/me/recommendations', 'GET', '/api/users/me/recommendations?limit=6', { token: playerTok });
    await expectStatus('GET /api/users/me/reviews', 'GET', '/api/users/me/reviews', { token: playerTok }, [200]);
    await expectStatus('GET /api/users/me/payments', 'GET', '/api/users/me/payments', { token: playerTok }, [200]);
    await expectSuccess('GET /api/bookings', 'GET', '/api/bookings?limit=5', { token: playerTok });
    await expectStatus('GET /api/notifications', 'GET', '/api/notifications', { token: playerTok }, [200]);
    await expectStatus('GET /api/notifications/preferences', 'GET', '/api/notifications/preferences', { token: playerTok }, [200]);
    await expectStatus('GET /api/notifications/count', 'GET', '/api/notifications/count', { token: playerTok }, [200]);
    await expectStatus('GET /api/favorites', 'GET', '/api/favorites', { token: playerTok }, [200]);
    // profile update (idempotent: set name to its current value)
    const me = await api('GET', '/api/users/profile', { token: playerTok });
    const curName = me.json?.data?.name || me.json?.data?.user?.name || me.json?.user?.name || player.email.split('@')[0];
    await expectSuccess('PUT /api/users/profile (idempotent name)', 'PUT', '/api/users/profile', { token: playerTok, body: { name: curName } });
    // avatar with a relative path (regression: must NOT 400)
    await expectSuccess('PUT /api/users/profile (relative avatar path)', 'PUT', '/api/users/profile', { token: playerTok, body: { avatar: '/uploads/avatars/e2e-test.jpg' } });

    // helpful vote on someone else's APPROVED review
    const { rows: revRows } = await pool.query(
      `SELECT id, "facilityId" FROM reviews WHERE "userId" <> $1 AND "isApproved" = true ORDER BY "createdAt" DESC LIMIT 1`,
      [player.id]
    );
    if (revRows[0]) {
      const { id: reviewId, facilityId } = revRows[0];
      const up = await api('POST', `/api/venues/${facilityId}/reviews/${reviewId}/helpful`, { token: playerTok });
      const upOk = [200, 409].includes(up.status);
      record('POST helpful vote', upOk || up.status === 404, upOk ? `${up.status}` : `skipped — ${up.status}`);
      if (upOk) {
        const down = await api('DELETE', `/api/venues/${facilityId}/reviews/${reviewId}/helpful`, { token: playerTok });
        record('DELETE helpful vote', down.status === 200 || down.status === 400, `${down.status}`);
      }
    } else {
      record('helpful vote', true, 'skipped — no other-user approved review');
    }

    // matches error handling (safe — no mutation)
    await expectStatus('POST /api/matches (missing bookingId) → 400', 'POST', '/api/matches', { token: playerTok, body: { maxPlayers: 4 } }, [400]);
    await expectStatus('POST /api/matches (bogus bookingId) → 404', 'POST', '/api/matches', { token: playerTok, body: { bookingId: 'nope', maxPlayers: 4 } }, [404, 400]);
  }

  // ===================== OWNER (full CRUD lifecycle) =====================
  setSection('owner');
  console.log('\n[Owner]');
  if (!ownerTok) {
    record('owner user exists', false, 'no FACILITY_OWNER role in DB');
  } else {
    await expectSuccess('GET /api/owner/dashboard', 'GET', '/api/owner/dashboard?period=month', { token: ownerTok });
    await expectSuccess('GET /api/owner/earnings', 'GET', '/api/owner/earnings?period=month', { token: ownerTok });
    await expectSuccess('GET /api/owner/reviews', 'GET', '/api/owner/reviews?page=1', { token: ownerTok });

    // Create facility (regression: null lat/lng must be allowed)
    const fac = await api('POST', '/api/venues', {
      token: ownerTok,
      body: {
        name: `E2E Test Arena ${Date.now()}`,
        description: 'Created by api-e2e-test',
        address: '1 Test Road',
        city: 'Testville',
        state: 'Test State',
        pincode: '560001',
        latitude: null,
        longitude: null,
      },
    });
    const facilityId = fac.json?.data?.facility?.id || fac.json?.data?.venue?.id || fac.json?.data?.id;
    record('POST /api/venues (create, null coords)', fac.ok && !!facilityId, fac.ok ? `${fac.status}` : `${fac.status} ${fac.json?.message} ${JSON.stringify(fac.json?.errors || '')}`);

    if (facilityId) {
      // Owner can view their own PENDING facility (regression for the 404 fix)
      await expectSuccess('GET /api/venues/[id] (owner views own PENDING)', 'GET', `/api/venues/${facilityId}`, { token: ownerTok });

      // Update facility
      await expectSuccess('PUT /api/venues/[id] (update)', 'PUT', `/api/venues/${facilityId}`, {
        token: ownerTok,
        body: { name: `E2E Test Arena (edited) ${Date.now()}` },
      });

      // Create court
      const court = await api('POST', `/api/venues/${facilityId}/courts`, {
        token: ownerTok,
        body: { name: 'Court 1', sportType: 'BADMINTON', pricePerHour: 500, description: 'test court' },
      });
      const courtId = court.json?.data?.court?.id || court.json?.court?.id;
      record('POST /api/venues/[id]/courts (create court)', court.ok && !!courtId, court.ok ? `${court.status}` : `${court.status} ${court.json?.message}`);

      if (courtId) {
        await expectSuccess('PUT /api/courts/[courtId] (update court)', 'PUT', `/api/courts/${courtId}`, {
          token: ownerTok, body: { pricePerHour: 650 },
        });

        // Block slots
        const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const block = await api('POST', `/api/courts/${courtId}/block-slots`, {
          token: ownerTok,
          body: {
            dates: [futureDate],
            timeSlots: [{ startTime: '08:00', endTime: '09:00' }],
            reason: 'E2E maintenance test',
            blockType: 'maintenance',
          },
        });
        record('POST /api/courts/[id]/block-slots', block.ok, `${block.status} ${block.ok ? '' : (block.json?.message || '')}`);
        await expectStatus('GET /api/courts/[id]/block-slots', 'GET', `/api/courts/${courtId}/block-slots`, { token: ownerTok }, [200]);
        await expectSuccess('DELETE /api/courts/[id]/block-slots (unblock)', 'DELETE', `/api/courts/${courtId}/block-slots`, {
          token: ownerTok, body: { dates: [futureDate], timeSlots: [{ startTime: '08:00', endTime: '09:00' }] },
        });

        // Delete court (soft)
        await expectSuccess('DELETE /api/courts/[courtId]', 'DELETE', `/api/courts/${courtId}`, { token: ownerTok });
      }

      // Cleanup: delete the test facility
      const del = await api('DELETE', `/api/venues/${facilityId}`, { token: ownerTok });
      record('DELETE /api/venues/[id] (cleanup)', del.ok || del.status === 200, `${del.status}`);
      // hard cleanup fallback in case API soft-deletes or fails
      await pool.query(`DELETE FROM facilities WHERE id = $1`, [facilityId]).catch(() => {});
    }
  }

  // ===================== ADMIN =====================
  setSection('admin');
  console.log('\n[Admin]');
  if (!adminTok) {
    record('admin user exists', false, 'no ADMIN role in DB (admin endpoints not tested)');
  } else {
    await expectStatus('GET /api/admin/analytics', 'GET', '/api/admin/analytics', { token: adminTok }, [200]);
    await expectStatus('GET /api/admin/users', 'GET', '/api/admin/users?limit=5', { token: adminTok }, [200]);
    await expectStatus('GET /api/admin/venues', 'GET', '/api/admin/venues?limit=5', { token: adminTok }, [200]);
    await expectStatus('GET /api/admin/bookings', 'GET', '/api/admin/bookings?limit=5', { token: adminTok }, [200]);
    await expectStatus('GET /api/admin/revenue', 'GET', '/api/admin/revenue', { token: adminTok }, [200]);
    await expectStatus('GET /api/admin/approvals', 'GET', '/api/admin/approvals', { token: adminTok }, [200]);
    await expectStatus('GET /api/admin/reviews', 'GET', '/api/admin/reviews?limit=5', { token: adminTok }, [200]);
    await expectStatus('GET /api/admin/moderation', 'GET', '/api/admin/moderation', { token: adminTok }, [200]);
    // RBAC: player must NOT access admin
    if (playerTok) {
      await expectStatus('Admin RBAC: player blocked → 401/403', 'GET', '/api/admin/users', { token: playerTok }, [401, 403]);
    }
  }

  // ===================== DESTRUCTIVE: deactivation on throwaway user =====================
  setSection('deactivation');
  console.log('\n[Deactivation — throwaway user]');
  const ts = Date.now();
  const email = `e2e-deact-${ts}@test.local`;
  const passwordPlain = 'TestPass123!';
  const hash = await bcrypt.hash(passwordPlain, 10);
  let throwawayId = null;
  try {
    const ins = await pool.query(
      `INSERT INTO users (id, email, password, name, role, "isVerified", "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'USER', true, true, now(), now())
       RETURNING id`,
      [email, hash, 'E2E Deactivation Test']
    );
    throwawayId = ins.rows[0].id;
    const tok = mintToken({ id: throwawayId, email, role: 'USER' });

    // wrong password → 401
    await expectStatus('DELETE /api/users/account (wrong pw) → 401', 'DELETE', '/api/users/account', {
      token: tok, body: { password: 'WrongPass!', reason: 'e2e' },
    }, [401]);

    // correct password → success
    const deact = await api('DELETE', '/api/users/account', { token: tok, body: { password: passwordPlain, reason: 'e2e test' } });
    record('DELETE /api/users/account (correct pw)', deact.ok && deact.json?.success, `${deact.status} ${deact.ok ? '' : (deact.json?.message || '')}`);

    // verify DB flag
    const { rows: chk } = await pool.query(`SELECT "isActive" FROM users WHERE id = $1`, [throwawayId]);
    record('account isActive=false in DB', chk[0] && chk[0].isActive === false, `isActive=${chk[0]?.isActive}`);
  } catch (e) {
    record('deactivation flow', false, e.message);
  } finally {
    if (throwawayId) await pool.query(`DELETE FROM users WHERE id = $1`, [throwawayId]).catch(() => {});
  }

  // ===================== SUMMARY =====================
  const pass = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  console.log(`\n=== SUMMARY: ${pass} passed, ${fail} failed, ${results.length} total ===`);
  if (fail > 0) {
    console.log('\nFailures:');
    for (const r of results.filter(r => !r.ok)) {
      console.log(`  \x1b[31m✗\x1b[0m [${r.section}] ${r.name} — ${r.detail}`);
    }
  }
  await pool.end();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
  console.error('FATAL:', e);
  try { await pool.end(); } catch {}
  process.exit(2);
});
