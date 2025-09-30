import type { NextApiRequest, NextApiResponse } from 'next'
import { ensureSchema, getDb } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { poolId, vaultId, tranche, amount, txHash } = req.body || {}
    if (
      typeof poolId !== 'number' ||
      typeof vaultId !== 'number' ||
      typeof tranche !== 'number' ||
      typeof amount !== 'number' ||
      typeof txHash !== 'string'
    ) {
      return res.status(400).json({ error: 'Invalid payload' })
    }

    await ensureSchema()
    const db = getDb()
    await db.query(
      `INSERT INTO pool_transactions (pool_id, vault_id, tranche, amount, tx_hash) VALUES ($1, $2, $3, $4, $5)`,
      [poolId, vaultId, tranche, amount, txHash]
    )

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Internal Server Error' })
  }
}
