import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query

  if (req.method === 'GET') {
    try {
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ error: 'Valid address is required' })
      }

      const pools = await prisma.pool.findMany({
        where: {
          createdBy: address
        },
        include: {
          assets: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Convert BigInt fields to strings for JSON serialization
      const serializedPools = pools.map(pool => ({
        ...pool,
        totalValue: pool.totalValue.toString(),
        availableCapital: pool.availableCapital.toString(),
        seniorTarget: pool.seniorTarget.toString(),
        mezzanineTarget: pool.mezzanineTarget.toString(),
        juniorTarget: pool.juniorTarget.toString(),
        assets: pool.assets.map(asset => ({
          ...asset,
          value: asset.value.toString()
        }))
      }))

      res.status(200).json(serializedPools)
    } catch (error) {
      console.error('Error fetching pools by creator:', error)
      res.status(500).json({ error: 'Failed to fetch pools' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
