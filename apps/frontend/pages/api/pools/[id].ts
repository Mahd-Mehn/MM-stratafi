import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'GET') {
    try {
      const pool = await prisma.pool.findUnique({
        where: { vaultId: parseInt(id as string) },
        include: {
          assets: true,
          investments: {
            orderBy: { createdAt: 'desc' },
            take: 10 // Latest 10 investments
          }
        }
      })

      if (!pool) {
        return res.status(404).json({ error: 'Pool not found' })
      }

      // Transform BigInt to string for JSON serialization
      const serializedPool = {
        ...pool,
        totalValue: pool.totalValue.toString(),
        availableCapital: pool.availableCapital.toString(),
        seniorAllocated: pool.seniorAllocated.toString(),
        mezzanineAllocated: pool.mezzanineAllocated.toString(),
        juniorAllocated: pool.juniorAllocated.toString(),
        seniorTarget: pool.seniorTarget.toString(),
        mezzanineTarget: pool.mezzanineTarget.toString(),
        juniorTarget: pool.juniorTarget.toString(),
        assets: pool.assets.map(asset => ({
          ...asset,
          value: asset.value.toString()
        })),
        investments: pool.investments.map(investment => ({
          ...investment,
          amount: investment.amount.toString()
        }))
      }

      res.status(200).json(serializedPool)
    } catch (error) {
      console.error('Error fetching pool:', error)
      res.status(500).json({ error: 'Failed to fetch pool' })
    }
  } else if (req.method === 'PUT') {
    try {
      const updateData = req.body
      
      // Convert string values back to BigInt for database
      if (updateData.totalValue) updateData.totalValue = BigInt(updateData.totalValue)
      if (updateData.availableCapital) updateData.availableCapital = BigInt(updateData.availableCapital)
      if (updateData.seniorAllocated) updateData.seniorAllocated = BigInt(updateData.seniorAllocated)
      if (updateData.mezzanineAllocated) updateData.mezzanineAllocated = BigInt(updateData.mezzanineAllocated)
      if (updateData.juniorAllocated) updateData.juniorAllocated = BigInt(updateData.juniorAllocated)

      const pool = await prisma.pool.update({
        where: { vaultId: parseInt(id as string) },
        data: updateData,
        include: {
          assets: true
        }
      })

      // Transform BigInt to string for JSON serialization
      const serializedPool = {
        ...pool,
        totalValue: pool.totalValue.toString(),
        availableCapital: pool.availableCapital.toString(),
        seniorAllocated: pool.seniorAllocated.toString(),
        mezzanineAllocated: pool.mezzanineAllocated.toString(),
        juniorAllocated: pool.juniorAllocated.toString(),
        seniorTarget: pool.seniorTarget.toString(),
        mezzanineTarget: pool.mezzanineTarget.toString(),
        juniorTarget: pool.juniorTarget.toString(),
        assets: pool.assets.map(asset => ({
          ...asset,
          value: asset.value.toString()
        }))
      }

      res.status(200).json(serializedPool)
    } catch (error) {
      console.error('Error updating pool:', error)
      res.status(500).json({ error: 'Failed to update pool' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
