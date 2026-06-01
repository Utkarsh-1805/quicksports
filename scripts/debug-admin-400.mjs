import 'dotenv/config';
import pg from 'pg';
import jwt from 'jsonwebtoken';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(`SELECT id, email, role FROM users WHERE role = 'ADMIN' AND "isActive" = true LIMIT 1`);
const u = r.rows[0];
if (!u) { console.log('no admin'); process.exit(1); }
const tok = jwt.sign({ userId: u.id, email: u.email, role: u.role }, process.env.JWT_SECRET, { expiresIn: '5m' });

for (const path of [
  '/api/admin/bookings?limit=5',
  '/api/admin/venues?limit=5',
  '/api/admin/bookings',
  '/api/admin/venues',
]) {
  const res = await fetch('http://localhost:3000' + path, { headers: { Authorization: `Bearer ${tok}` } });
  const body = await res.text();
  console.log('---', path, '->', res.status);
  console.log(body.slice(0, 800));
}
await pool.end();
