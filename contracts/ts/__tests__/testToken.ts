import * as ethers from 'ethers'
import { sleep } from 'mixer-utils'

const Mixer = require('@mixer-contracts/compiled/Mixer.json')
const ForwarderRegistryERC20 = require('@mixer-contracts/compiled/ForwarderRegistryERC20.json')

import {
    genIdentity,
    genIdentityCommitment,
    genMixerWitness,
    genProof,
    verifyProof,
    verifySignature,
    genPublicSignals,
} from 'libsemaphore'

import {
    surrogethMix,
    surrogetGetBroadcaster,
    surrogetSubmitTx,
} from './surrogeth'

import {
    deployContract,
    deployAllContracts,
} from '../deploy/deployContract'

import {
    performeDeposit,
    checkErrorReason,
    mix,
    genDepositProof,
    areEqualAddresses,
    getSnarks,
    addressInfo,
} from './utils'

const testToken = (
    configNetwork,
    configNetworkName,
    configTokenName,
    deployedAddressesNetwork,
    wallet,
    depositorAddress,
    recipientAddress,
    relayerAddress,
    accounts,
) => {

    console.log("Test token:", configTokenName);
    let configToken = configNetwork.get('token.' + configTokenName)

    describe(configNetworkName + '.' + configTokenName + ' Mixer', () => {

        if (!deployedAddressesNetwork.token[configTokenName]){
            deployedAddressesNetwork.token[configTokenName] = {}
        }
        let deployedAddressesToken = deployedAddressesNetwork.token[configTokenName]

        let isETH = 0
        if (!configToken.has('decimals')){
            isETH = 1
        }

        let decimals
        let mixAmtToken
        let feeAmt
        if (isETH){
            decimals = 18
        }else{
            decimals = configToken.get('decimals')
        }

        mixAmtToken = ethers.BigNumber.from((configToken.get('mixAmt') * (10 ** decimals)).toString())
        feeAmt = ethers.BigNumber.from((configToken.get('feeAmt') * (10 ** decimals)).toString())

        const users = accounts.slice(1, 6).map((user) => user.address)
        const identities = {}

        for (let i=0; i < users.length; i++) {
            const user = users[i]

            const identity = genIdentity()
            identities[user] = identity
        }

        let mimcContract
        let mixerContract
        let semaphoreContract
        let forwarderRegistryERC20Contract
        let tokenContract
        let tokenContractAddress
        let externalNullifier : string


        beforeAll( done =>  {
            const func_async = (async () => {
                console.log("Network:", configNetworkName, " Token ", configTokenName);
                const contracts = await deployAllContracts(
                    wallet,
                    configNetwork,
                    configToken,
                    depositorAddress,
                    deployedAddressesNetwork,
                    deployedAddressesToken,
                )

                expect(contracts).toBeTruthy()
                forwarderRegistryERC20Contract = contracts.forwarderRegistryERC20Contract
                mimcContract = contracts.mimcContract
                tokenContract = contracts.tokenContract
                if (tokenContract){
                    tokenContractAddress = tokenContract.address
                }
                semaphoreContract = contracts.semaphoreContract
                mixerContract = contracts.mixerContract
                expect(mimcContract).toBeTruthy()
                //expect(semaphoreContract).toBeTruthy()
                expect(mixerContract).toBeTruthy()
                expect(forwarderRegistryERC20Contract).toBeTruthy()
                if (isETH){
                    expect(tokenContract).not.toBeTruthy()
                }else{
                    expect(tokenContract).toBeTruthy()
                }
                externalNullifier = mixerContract.address
                done()
            })

            func_async()
            //expect(semaphoreContract).toBeTruthy()
        })



        describe('Contract deployments', () => {

            it('should not deploy mixer if the mixAmt is invalid', async () => {
                try{
                    const tx = await deployContract(wallet,
                        Mixer,
                        semaphoreContract.address,
                        ethers.utils.parseEther('0'),
                        '0x0000000000000000000000000000000000000000',
                        //{ gasLimit: 500000 }
                    )
                    expect(true).toBeFalsy()
                }catch (error){
                    checkErrorReason(error, 'Mixer: invalid mixAmt')
                }
            })

            it('should deploy contracts', () => {
                expect(ethers.utils.isAddress(mimcContract.address)).toBeTruthy()
                //expect(ethers.utils.isAddress(semaphoreContract.address)).toBeTruthy()
                expect(ethers.utils.isAddress(mixerContract.address)).toBeTruthy()
                expect(ethers.utils.isAddress(forwarderRegistryERC20Contract.address)).toBeTruthy()

            })

            it('the Mixer contract should be the owner of the Semaphore contract', async () => {
                expect(await semaphoreContract.owner()).toBe(mixerContract.address)
            })

            it('the Semaphore contract\'s external nullifier should be the mixer contract address', async () => {
                const semaphoreExtNullifier = await semaphoreContract.getExternalNullifierByIndex(1)
                const mixerAddress = mixerContract.address
                expect(areEqualAddresses(semaphoreExtNullifier, mixerAddress)).toBeTruthy()
            })
        })



        describe('Deposits and withdrawals', () => {

            if (isETH){
                /*
                it('should not add the identity commitment to the contract if the amount is incorrect', async () => {
                    await assert.revert(mixerContract.deposit(identityCommitment.toString(), { value: 0 }))

                    const invalidValue = (BigInt(mixAmtToken) + BigInt(1)).toString()
                    await assert.revert(mixerContract.deposit(identityCommitment.toString(), { value: invalidValue }))
                })
                */

                it('should fail to call depositERC20() (which is not ETH)', async () => {

                    const identity = identities[users[0]]
                    const identityCommitment = genIdentityCommitment(identity)

                    try {
                        const tx = await mixerContract.depositERC20(
                            '0x' + identityCommitment.toString(16),
                            //{ gasLimit: 1500000 }
                        )
                        const receipt = await tx.wait()
                        expect(true).toBeFalsy()
                    } catch (error) {
                        checkErrorReason(error, 'Mixer: only supports tokens')
                    }
                })
            } else {
                it('should fail to call deposit() (which is for ETH only)', async () => {
                    const identity = identities[users[0]]
                    const identityCommitment = genIdentityCommitment(identity)
                    try {
                        const tx = await mixerContract.deposit(
                            '0x' + identityCommitment.toString(16),
                            //{ gasLimit: 1500000 }
                        )
                        const receipt = await tx.wait()
                        expect(true).toBeFalsy()
                    } catch (error) {
                        checkErrorReason(error, 'Mixer: only supports ETH')
                    }
                })
            }

            it('should have setup semaphore', async () => {
                const semaphoreBefore = await mixerContract.semaphore()
                expect(semaphoreBefore).toBe(semaphoreContract.address)
            })

            it('should have setup mixAmt', async () => {
                const mixAmtBefore = await mixerContract.mixAmt()
                expect(mixAmtBefore.eq(mixAmtToken)).toBeTruthy()
            })

            it('address balance', async () => {
                await addressInfo("depositorAddress", depositorAddress, isETH, wallet, decimals, tokenContract)
                await addressInfo("recipientAddress", recipientAddress, isETH, wallet, decimals, tokenContract)
                await addressInfo("relayerAddress", relayerAddress, isETH, wallet, decimals, tokenContract)
            })

            it('should perform a deposit', async () => {

                const identity = identities[users[0]]
                const identityCommitment = genIdentityCommitment(identity)

                let balanceBefore
                if (isETH){
                    balanceBefore = await wallet.provider.getBalance(depositorAddress)
                } else {
                    balanceBefore = await tokenContract.balanceOf(depositorAddress)
                }
                expect(balanceBefore.gte(mixAmtToken)).toBeTruthy()

                // make a deposit
                const receipt = await performeDeposit(isETH, identityCommitment, mixAmtToken, mixerContract, tokenContract)

                const gasUsed = receipt.gasUsed
                console.log('Gas used for this deposit:', gasUsed.toString())

                // check that the leaf was added to the leaf history array in the contract
                const leaves = (await mixerContract.getLeaves()).map((x) => {
                    return x.toString()
                })
                expect(leaves.toString()).toMatch(identityCommitment.toString())

                let balanceAfter
                if (isETH){
                    balanceAfter = await wallet.provider.getBalance(depositorAddress)
                } else {
                    balanceAfter = await tokenContract.balanceOf(depositorAddress)
                }
                expect(balanceBefore.sub(balanceAfter).gte(mixAmtToken)).toBeTruthy()
            })

            it('should make a withdrawal', async () => {

                const identity = identities[users[0]]
                const identityCommitment = genIdentityCommitment(identity)

                // make a deposit
                await performeDeposit(isETH, identityCommitment, mixAmtToken, mixerContract, tokenContract)

                // get the circuit, verifying key, and proving key
                const { verifyingKey, provingKey, circuit } = await getSnarks()

                expect(circuit).toBeTruthy();
                expect(verifyingKey).toBeTruthy();
                expect(provingKey).toBeTruthy();

                let recipientBalanceBefore
                let recipientBalanceAfter
                let recipientBalanceDiff

                let relayerBalanceBefore
                let relayerBalanceAfter
                let relayerBalanceDiff

                let leaves

                leaves = await mixerContract.getLeaves()
                expect(leaves).toBeTruthy()

                externalNullifier = mixerContract.address

                const {
                    witness,
                    signal,
                    signalHash,
                    signature,
                    msg,
                    tree,
                    identityPath,
                    identityPathIndex,
                    identityPathElements,
                } = await genMixerWitness(
                    circuit,
                    identity,
                    leaves,
                    20,
                    recipientAddress,
                    relayerAddress,
                    feeAmt,
                    externalNullifier,
                )

                //Return boolen
                expect(await verifySignature(msg, signature, identity.keypair.pubKey)).toBeTruthy()
                expect(await circuit.checkWitness(witness)).toBeTruthy()

                //Return SnarkPublicSignals
                const publicSignals = await genPublicSignals(witness, circuit)
                expect(publicSignals).toBeTruthy()

                //Return async + Promise
                const proof = await await genProof(witness, provingKey)
                //console.log(proof)
                expect(proof).toBeTruthy()

                //Return boolen
                expect(await verifyProof(verifyingKey, proof, publicSignals)).toBeTruthy()

                const mixInputs = await genDepositProof(
                    signal,
                    proof,
                    publicSignals,
                    recipientAddress,
                    feeAmt,
                )
                expect(mixInputs).toBeTruthy()

                //console.log(mixInputs)
                //console.log(signalHash.toString())
                const preBroadcastChecked = await semaphoreContract.preBroadcastCheck(
                    mixInputs.a,
                    mixInputs.b,
                    mixInputs.c,
                    mixInputs.input,
                    signalHash.toString(),
                )
                //console.log(preBroadcastChecked)
                //todo fix
                expect(preBroadcastChecked).toBeTruthy()

                let mixTx

                if (isETH){

                    recipientBalanceBefore = ethers.BigNumber.from(await wallet.provider.getBalance(recipientAddress))
                    relayerBalanceBefore = ethers.BigNumber.from(await wallet.provider.getBalance(relayerAddress))

                    mixTx = await mix(
                        forwarderRegistryERC20Contract,
                        mixerContract,
                        tokenContractAddress,
                        signal,
                        proof,
                        publicSignals,
                        recipientAddress,
                        feeAmt,
                        relayerAddress,
                        "mix",
                    )
                } else {

                    recipientBalanceBefore = ethers.BigNumber.from(await tokenContract.balanceOf(recipientAddress))
                    relayerBalanceBefore = ethers.BigNumber.from(await tokenContract.balanceOf(relayerAddress))

                    mixTx = await mix(
                        forwarderRegistryERC20Contract,
                        mixerContract,
                        tokenContractAddress,
                        signal,
                        proof,
                        publicSignals,
                        recipientAddress,
                        feeAmt,
                        relayerAddress,
                        "mixERC20",
                    )
                }

                const mixReceipt = await mixTx.wait()
                expect(mixReceipt.events).toBeTruthy()

                if (isETH){
                    recipientBalanceAfter = ethers.BigNumber.from(await wallet.provider.getBalance(recipientAddress))
                    relayerBalanceAfter = ethers.BigNumber.from(await wallet.provider.getBalance(relayerAddress))
                } else {
                    recipientBalanceAfter = ethers.BigNumber.from(await tokenContract.balanceOf(recipientAddress))
                    relayerBalanceAfter = ethers.BigNumber.from(await tokenContract.balanceOf(relayerAddress))
                }
                const gasUsed = mixReceipt.gasUsed.toString()
                console.log('Gas used for this withdrawal:', gasUsed)

                relayerBalanceDiff = relayerBalanceAfter.sub(relayerBalanceBefore)
                expect(relayerBalanceDiff.eq(feeAmt)).toBeTruthy()
                recipientBalanceDiff = recipientBalanceAfter.sub(recipientBalanceBefore)
                expect(recipientBalanceDiff.add(feeAmt).eq(mixAmtToken)).toBeTruthy()
            })

            it('should make a withdrawal with surrogeth', async () => {

                const identity = identities[users[0]]
                const identityCommitment = genIdentityCommitment(identity)

                // make a deposit
                await performeDeposit(isETH, identityCommitment, mixAmtToken, mixerContract, tokenContract)

                // get the circuit, verifying key, and proving key
                const { verifyingKey, provingKey, circuit } = await getSnarks()

                expect(circuit).toBeTruthy();
                expect(verifyingKey).toBeTruthy();
                expect(provingKey).toBeTruthy();

                let recipientBalanceBefore
                let recipientBalanceAfter
                let recipientBalanceDiff

                let relayerBalanceBefore
                let relayerBalanceAfter
                let relayerBalanceDiff

                let leaves

                leaves = await mixerContract.getLeaves()
                expect(leaves).toBeTruthy()

                externalNullifier = mixerContract.address

                const {
                    witness,
                    signal,
                    signalHash,
                    signature,
                    msg,
                    tree,
                    identityPath,
                    identityPathIndex,
                    identityPathElements,
                } = await genMixerWitness(
                    circuit,
                    identity,
                    leaves,
                    20,
                    recipientAddress,
                    forwarderRegistryERC20Contract.address,
                    feeAmt,
                    externalNullifier,
                )

                //Return boolen
                expect(await verifySignature(msg, signature, identity.keypair.pubKey)).toBeTruthy()
                expect(await circuit.checkWitness(witness)).toBeTruthy()

                //Return SnarkPublicSignals
                const publicSignals = await genPublicSignals(witness, circuit)
                expect(publicSignals).toBeTruthy()

                //Return async + Promise
                const proof = await await genProof(witness, provingKey)
                //console.log(proof)
                expect(proof).toBeTruthy()

                //Return boolen
                expect(await verifyProof(verifyingKey, proof, publicSignals)).toBeTruthy()

                const mixInputs = await genDepositProof(
                    signal,
                    proof,
                    publicSignals,
                    recipientAddress,
                    feeAmt,
                )
                expect(mixInputs).toBeTruthy()

                //console.log(mixInputs)
                //console.log(signalHash.toString())
                const preBroadcastChecked = await semaphoreContract.preBroadcastCheck(
                    mixInputs.a,
                    mixInputs.b,
                    mixInputs.c,
                    mixInputs.input,
                    signalHash.toString(),
                )
                //console.log(preBroadcastChecked)
                //todo fix
                expect(preBroadcastChecked).toBeTruthy()

                let mixTx

                const broadcaster = await surrogetGetBroadcaster(
                    configNetworkName,
                    wallet,
                    forwarderRegistryERC20Contract.address,
                    tokenContractAddress,
                )
                expect(broadcaster).toBeTruthy()

                if (isETH){

                    recipientBalanceBefore = ethers.BigNumber.from(await wallet.provider.getBalance(recipientAddress))
                    relayerBalanceBefore = ethers.BigNumber.from(await wallet.provider.getBalance(relayerAddress))

                    mixTx = await surrogethMix(
                        configNetworkName,
                        wallet,
                        broadcaster,
                        forwarderRegistryERC20Contract,
                        mixerContract,
                        tokenContractAddress,
                        signal,
                        proof,
                        publicSignals,
                        recipientAddress,
                        feeAmt,
                        "mix",
                    )
                } else {

                    recipientBalanceBefore = ethers.BigNumber.from(await tokenContract.balanceOf(recipientAddress))
                    relayerBalanceBefore = ethers.BigNumber.from(await tokenContract.balanceOf(relayerAddress))

                    mixTx = await surrogethMix(
                        configNetworkName,
                        wallet,
                        broadcaster,
                        forwarderRegistryERC20Contract,
                        mixerContract,
                        tokenContractAddress,
                        signal,
                        proof,
                        publicSignals,
                        recipientAddress,
                        feeAmt,
                        "mixERC20",
                    )
                }

                //const mixReceipt = await mixTx.wait()
                //expect(mixReceipt.events).toBeTruthy()

                if (isETH){
                    recipientBalanceAfter = ethers.BigNumber.from(await wallet.provider.getBalance(recipientAddress))
                    relayerBalanceAfter = ethers.BigNumber.from(await wallet.provider.getBalance(relayerAddress))
                } else {
                    recipientBalanceAfter = ethers.BigNumber.from(await tokenContract.balanceOf(recipientAddress))
                    relayerBalanceAfter = ethers.BigNumber.from(await tokenContract.balanceOf(relayerAddress))
                }
                //const gasUsed = mixReceipt.gasUsed.toString()
                //console.log('Gas used for this withdrawal:', gasUsed)

                relayerBalanceDiff = relayerBalanceAfter.sub(relayerBalanceBefore)
                //expect(relayerBalanceDiff.eq(feeAmt)).toBeTruthy()
                recipientBalanceDiff = recipientBalanceAfter.sub(recipientBalanceBefore)
                expect(recipientBalanceDiff.add(feeAmt).eq(mixAmtToken)).toBeTruthy()
            })

            it('should get surrogeth broadcaster', async () => {
                const broadcaster = await surrogetGetBroadcaster(
                    configNetworkName,
                    wallet,
                    forwarderRegistryERC20Contract.address,
                    tokenContractAddress,
                )
                expect(broadcaster).toBeTruthy()

                const to = recipientAddress
                const value = ethers.utils.parseEther("0.01").toHexString()
                const value2 = ethers.utils.parseEther("0.02")

                //Fake transaction that will be rejected by surrogeth
                const iface = new ethers.utils.Interface(Mixer.abi)
                const mixCallData = iface.encodeFunctionData("deposit", [
                  recipientAddress,
                ])

                const forwarderIface = new ethers.utils.Interface(ForwarderRegistryERC20.abi)
                const relayCallData = forwarderIface.encodeFunctionData("relayCall",
                    [
                        mixerContract.address,
                        mixCallData
                    ],
                )

                try{
                    await surrogetSubmitTx(
                        configNetworkName,
                        wallet,
                        forwarderRegistryERC20Contract.address,
                        tokenContractAddress,
                        to,
                        relayCallData,
                        value2,
                        broadcaster,
                    )
                    expect(false).toBeTruthy()
                }catch (error){
                    console.log(error.response.data)
                    expect(error.response.data.msg).toMatch("Fee too low!")
                }
            })

        })
    })
}

export {testToken}
