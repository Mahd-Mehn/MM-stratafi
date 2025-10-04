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

      const investments = await prisma.investment.findMany({
        where: {
          investorAddress: address
        },
        include: {
          pool: {
            select: {
              id: true,
              name: true,
              assetType: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Convert BigInt fields to strings for JSON serialization
      const serializedInvestments = investments.map(investment => ({
        ...investment,
        amount: investment.amount.toString(),
        pool: investment.pool ? {
          ...investment.pool,
          id: investment.pool.id
        } : null
      }))

      res.status(200).json(serializedInvestments)
    } catch (error) {
      console.error('Error fetching investments by investor:', error)
      res.status(500).json({ error: 'Failed to fetch investments' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
