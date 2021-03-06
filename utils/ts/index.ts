import * as ethers from 'ethers'

const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve: Function) => setTimeout(resolve, ms))
}

const hexify = (n: BigInt) => {
    return '0x' + n.toString(16)
}

const genMixParams = (
    networkName: string,
    mixerAddress: string,
    signal: string,
    proof: any,
    recipientAddress: string,
    fee: ethers.BigNumber,
    publicSignals: BigInt[],
) => {
    return {
        networkName: networkName,
        mixer: mixerAddress,
        signal,
        a: proof.pi_a.slice(0, 2).map(hexify),
        b: [
            [
                hexify(proof.pi_b[0][1]),
                hexify(proof.pi_b[0][0]),
            ],
            [
                hexify(proof.pi_b[1][1]),
                hexify(proof.pi_b[1][0]),
            ],
        ],
        c: proof.pi_c.slice(0, 2).map(hexify),
        input: publicSignals.map(hexify),
        recipientAddress,
        fee: fee.toString(),
    }
}

export { sleep, genMixParams }
