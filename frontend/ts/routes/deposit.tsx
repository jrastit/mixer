import React, { useState, Component } from 'react'
import ReactDOM from 'react-dom'
import { Redirect } from 'react-router-dom'
import * as ethers from 'ethers'
import { Buffer } from 'buffer'
import { useWeb3Context } from 'web3-react'
const config = require('../exported_config')
const deployedAddresses = config.chain.deployedAddresses
import { TxButton, TxStatuses } from '../components/txButton'
import { TxHashMessage } from '../components/txHashMessage'
import { sleep } from 'mixer-utils'

import {
    initStorage,
    storeDeposit,
    updateDepositTxStatus,
    getNumUnwithdrawn,
} from '../storage'

import { deposit } from '../web3/deposit'
import {
    genIdentity,
    genIdentityCommitment,
} from 'mixer-crypto'

const blockExplorerTxPrefix = config.frontend.blockExplorerTxPrefix

export default () => {
    initStorage()
    const [txStatus, setTxStatus] = useState(TxStatuses.None)
    const [txHash, setTxHash] = useState('')
    const [recipientAddress, setRecipientAddress] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const operatorFeeEth = config.operatorFeeEth
    const mixAmtEth = config.mixAmtEth
    const mixAmt = ethers.utils.parseEther(mixAmtEth)

    const validRecipientAddress= !recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)
    const depositBtnDisabled = validRecipientAddress

    // Check whether there already is a deposit and disallow the user
    // from making another one
    // Redirect the user to the withdraw page if so

    if (getNumUnwithdrawn() > 0) {
          return <Redirect to='/countdown' />
    }

    const context = useWeb3Context()

    const handleDepositBtnClick = async () => {
        if (validRecipientAddress) {
            return
        }

        initStorage()

        // generate an Identity
        const identity = genIdentity()
        const keypair = identity.keypair
        const pubKey = keypair.pubKey
        const identityNullifier = identity.identityNullifier

        const identityCommitment = '0x' + genIdentityCommitment(identityNullifier, pubKey).toString(16)

        // Perform the deposit tx
        try {
            setTxStatus(TxStatuses.Pending)

            const tx = await deposit(context, identityCommitment, mixAmt)

            setTxHash(tx.hash)

            storeDeposit(identity, recipientAddress)

            if (config.env === 'local-dev') {
                await sleep(3000)
            }

            const receipt = await tx.wait()

            updateDepositTxStatus(identity, tx.hash)
            setTxStatus(TxStatuses.Mined)

        } catch (err) {
            console.log(err)
            setTxStatus(TxStatuses.Err)

            if (
                err.code === ethers.errors.UNSUPPORTED_OPERATION &&
                err.reason === 'contract not deployed'
            ) {
                setErrorMsg(`The mixer contract was not deployed to the expected ` +
                    `address ${deployedAddresses.Mixer}`)
            } else {
                setErrorMsg('An error with the transaction occurred.')
            }
        }
    }

    return (
        <div className='section'>
            <div className='columns has-text-centered'>
                <div className='column is-12'>
                    <div className='section'>
                        <h2 className='subtitle'>
                            MultiMix makes your Kovan ETH anonymous.
                        </h2>

                        <div className='column is-8 is-offset-2'>
                            <p>
                                MultiMix is an Ethereum mixer based on
                                zero-knowledge proofs.
                                It is highly experimental, likely insecure,
                                and not yet audited. Do not use it to mix real
                                funds yet.  Click <a
                                    href="https://github.com/weijiekoh/mixer"
                                    target="_blank">here</a> for more information.
                            </p>
                        </div>
                    </div>

                    <div className='section'>
                        <p>
                            {`You can mix ${mixAmtEth} ETH at a time.`}
                        </p>
                    <p>
                        {`The fee is ${operatorFeeEth * 2} ETH.`}
                    </p>
                    <p>
                        {`You can get back ${mixAmtEth - operatorFeeEth * 2} ETH at midnight, UTC.`}
                    </p>
                </div>

                { (context.error != null && context.error.code === 'UNSUPPORTED_NETWORK') ?
                    <p>
                        To continue, please connect to the correct Ethereum network.
                    </p>
                    :

                    <div>
                        <div className='column is-8 is-offset-2'>
                            <p>Recipient's address:</p>
                            <br />
                            <input
                                spellCheck={false}
                                className="input eth_address"
                                type="text"
                                placeholder="Recipient's ETH address" 
                                value={recipientAddress}
                                onChange={(e) => {
                                    setRecipientAddress(e.target.value)
                                }}
                            />
                        </div>

                        <div className='section'>
                            <TxButton
                                onClick={handleDepositBtnClick}
                                txStatus={txStatus}
                                isDisabled={depositBtnDisabled}
                                label={`Mix ${mixAmtEth} ETH`}
                            />

                            { txHash.length > 0 &&
                                <div>
                                    <br />
                                    <TxHashMessage 
                                        mixSuccessful={false}
                                        txHash={txHash}
                                        txStatus={TxStatuses.Pending} />
                                </div>
                            }
                                
                            <br />
                            <br />

                            { txStatus === TxStatuses.Mined &&
                                <article className="message is-success">
                                  <div className="message-body">
                                      Transaction mined.
                                  </div>
                                  <Redirect to='/countdown' />
                                </article>
                            }

                            { txStatus === TxStatuses.Err &&
                                <article className="message is-danger">
                                  <div className="message-body">
                                    {errorMsg}
                                  </div>
                              </article>
                            }
                        </div>
                    </div>
                }

                </div>
            </div>
        </div>
    )
}
