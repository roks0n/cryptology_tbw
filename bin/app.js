#!/usr/bin/env node
'use strict'
require('dotenv').config()
const TrueBlockWeight = require('../lib/utils/trueblockweight')
const payoutBuilder = require('../lib/utils/payouts')
const network = require('../lib/services/network')
const logger = require('../lib/services/logger')
const BigNumber = require('bignumber.js')

const ARKTOSHI = Math.pow(10, 8)
const FEES = 0.1 * ARKTOSHI

async function start () {
  try {
    const trueblockweight = new TrueBlockWeight()
    const {payouts, delegateProfit} = await trueblockweight.generatePayouts()

    let {totalAmount, totalFees, transactions} = payoutBuilder.generatePayouts(payouts)

    const amount = new BigNumber(delegateProfit.div(ARKTOSHI).toFixed(8)).times(ARKTOSHI).toFixed(0)
    const adminTransactions = payoutBuilder.generateAdminPayouts(amount)
    if (adminTransactions.length) {
      totalAmount = totalAmount.plus(amount)
      totalFees = totalFees.plus(FEES * adminTransactions.length)
    }

    logger.info('==================================================================================')
    logger.info(`Ready to Payout: ${totalAmount.div(ARKTOSHI).toFixed(8)} + ${totalFees.div(ARKTOSHI).toFixed(1)} fees.`)
    logger.info('==================================================================================')
    const args = process.argv.slice(2)
    if (args.length >= 1 && args[0] === 'payout') {
      logger.info('Payouts initiated')
      const results = await network.postTransaction(transactions.concat(adminTransactions))
      if (results.data.success !== true) {
        throw new Error('Could not send transactions.')
      }
      logger.info(results.data.transactionIds)
    }
  } catch (error) {
    console.error(error)
  }
}

start()
