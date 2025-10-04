import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const pools = await prisma.pool.findMany({
        include: {
          assets: true,
          _count: {
            select: { investments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      // Transform BigInt to string for JSON serialization
      const serializedPools = pools.map(pool => ({
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
      }))

      res.status(200).json(serializedPools)
    } catch (error) {
      console.error('Error fetching pools:', error)
      res.status(500).json({ error: 'Failed to fetch pools' })
    }
  } else if (req.method === 'POST') {
    try {
      const {
        vaultId,
        name,
        description,
        assetType,
        maturity,
        totalValue,
        availableCapital,
        seniorApy,
        mezzanineApy,
        juniorApy,
        seniorTarget,
        mezzanineTarget,
        juniorTarget,
        createdBy,
        assets
      } = req.body

      const pool = await prisma.pool.create({
        data: {
          vaultId,
          name,
          description,
          assetType,
          maturity,
          totalValue: BigInt(totalValue),
          availableCapital: BigInt(availableCapital),
          seniorApy,
          mezzanineApy,
          juniorApy,
          seniorTarget: BigInt(seniorTarget),
          mezzanineTarget: BigInt(mezzanineTarget),
          juniorTarget: BigInt(juniorTarget),
          createdBy,
          assets: {
            create: assets?.map((asset: any) => ({
              type: asset.type,
              value: BigInt(asset.value),
              rating: asset.rating
            })) || []
          }
        },
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

      res.status(201).json(serializedPool)
    } catch (error) {
      console.error('Error creating pool:', error)
      res.status(500).json({ error: 'Failed to create pool' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
