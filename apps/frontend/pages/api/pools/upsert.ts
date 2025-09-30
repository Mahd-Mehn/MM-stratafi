import type { NextApiRequest, NextApiResponse } from 'next'
import { ensureSchema, getDb } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { id, name, assetType, maturity, description, seniorAPY, mezzanineAPY, juniorAPY, moduleAddr, ownerAddr } = req.body || {}

    if (
      typeof id !== 'number' ||
      typeof name !== 'string' ||
      typeof assetType !== 'string' ||
      typeof maturity !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid payload' })
    }

    await ensureSchema()
    const db = getDb()
    await db.query(
      `INSERT INTO pools (id, name, asset_type, maturity, description, senior_apy, mezzanine_apy, junior_apy, module_addr, owner_addr)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         asset_type = EXCLUDED.asset_type,
         maturity = EXCLUDED.maturity,
         description = EXCLUDED.description,
         senior_apy = EXCLUDED.senior_apy,
         mezzanine_apy = EXCLUDED.mezzanine_apy,
         junior_apy = EXCLUDED.junior_apy,
         module_addr = EXCLUDED.module_addr,
         owner_addr = EXCLUDED.owner_addr,
         updated_at = NOW()
      `,
      [
        id,
        name,
        assetType,
        maturity,
        description ?? null,
        seniorAPY ?? null,
        mezzanineAPY ?? null,
        juniorAPY ?? null,
        moduleAddr ?? null,
        ownerAddr ?? null,
      ]
    )

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Server Error' })
  }
}
