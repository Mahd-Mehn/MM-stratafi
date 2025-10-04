import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const {
        poolId,
        vaultId,
        tranche,
        amount,
        txHash,
        investorAddress
      } = req.body

      // Map tranche number to string
      const trancheNames = ['Senior', 'Mezzanine', 'Junior']
      const trancheName = trancheNames[tranche] || 'Unknown'

      const investment = await prisma.investment.create({
        data: {
          poolId,
          vaultId,
          investorAddress,
          tranche: trancheName,
          amount: BigInt(amount),
          txHash,
          confirmed: false // Will be updated when transaction is confirmed
        }
      })

      // Update pool allocations
      const updateField = tranche === 0 ? 'seniorAllocated' : 
                         tranche === 1 ? 'mezzanineAllocated' : 'juniorAllocated'

      await prisma.pool.update({
        where: { vaultId },
        data: {
          [updateField]: {
            increment: BigInt(amount)
          },
          availableCapital: {
            decrement: BigInt(amount)
          }
        }
      })

      const serializedInvestment = {
        ...investment,
        amount: investment.amount.toString()
      }

      res.status(201).json(serializedInvestment)
    } catch (error) {
      console.error('Error logging investment:', error)
      res.status(500).json({ error: 'Failed to log investment' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
