const solc = require('solc');

const fs = require('fs');
const fse = require('fs-extra');

import buildMiMC from './buildMiMC'

const semaphorePath = '../semaphore/semaphorejs/contracts/'
const solidityPath = 'solidity/'

const compileInput = (input, outputPath : string) => {

    let output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors){
            console.log(output.errors)
            process.exit(1)
    }

    if (!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath);
    }

    for (var contract in output.contracts) {
        for (var contractName in output.contracts[contract]) {
            console.log("contract ", contractName)
            let outputfile = {
                abi: output.contracts[contract][contractName].abi,
                bytecode : output.contracts[contract][contractName].evm.bytecode.object,
                linkReferences : output.contracts[contract][contractName].evm.bytecode.linkReferences,
                }
            fs.writeFileSync(outputPath + contractName + '.json', JSON.stringify(outputfile))
        }
    }
}

const compileInputBytecode = (input) => {

    let output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors){
            console.log(output.errors)
            process.exit(1)
    }

    for (var contract in output.contracts) {
        for (var contractName in output.contracts[contract]) {
            console.log("contract ", contractName)
            return output.contracts[contract][contractName].evm.bytecode.object
        }
    }
    return null
}

const loadContract = (path : string) => {
    return fs.readFileSync(path).toString()
}

const inputMiMC = {
    language: 'Solidity',
    sources: {
        'MerkleTreeLib.sol' : {
            content: loadContract(semaphorePath + 'MerkleTreeLib.sol'),
        },
    },
    settings: {
        outputSelection: {
            '*': {
                'MiMC': [ 'evm.bytecode.object', 'abi']
            }
        }
    }
}

const inputSemaphore = {
    language: 'Solidity',
    sources: {
        'verifier.sol': {
            content: loadContract(semaphorePath + 'verifier.sol'),
        },
        'Semaphore.sol': {
            content: loadContract(semaphorePath + 'Semaphore.sol'),
        },
        'MerkleTreeLib.sol' : {
            content: loadContract(semaphorePath + 'MerkleTreeLib.sol'),
        },
        'Ownable.sol' : {
            content: loadContract(semaphorePath + 'Ownable.sol'),
        },
    },
    settings: {
        outputSelection: {
            '*': {
                'Semaphore': [ 'evm.bytecode.object', 'abi', 'linkReferences' ]
            }
        }
    }
}

const inputMixer = {
    language: 'Solidity',
    sources: {
        'verifier.sol': {
            content: loadContract(semaphorePath + 'verifier.sol'),
        },
        'Semaphore.sol': {
            content: loadContract(semaphorePath + 'Semaphore.sol'),
        },
        'MerkleTreeLib.sol' : {
            content: loadContract(semaphorePath + 'MerkleTreeLib.sol'),
        },
        'Ownable.sol' : {
            content: loadContract(semaphorePath + 'Ownable.sol'),
        },
        'Mixer.sol' : {
            content: loadContract(solidityPath + 'Mixer.sol'),
        },
        'openzeppelin/SafeMath.sol' : {
            content: loadContract(solidityPath + 'openzeppelin/SafeMath.sol'),
        },
        'token/IERC20.sol' : {
            content: loadContract(solidityPath + 'token/IERC20.sol'),
        },
    },
    settings: {
        outputSelection: {
            '*': {
                'Mixer': [ 'evm.bytecode.object', 'abi']
            }
        }
    }
}



const inputToken = {
    language: 'Solidity',
    sources: {
        'ERC20.sol': {
            content: loadContract(solidityPath + 'token/ERC20.sol'),
        },
        'ERC20Detailed.sol' : {
            content: loadContract(solidityPath + 'token/ERC20Detailed.sol'),
        },
        'ERC20Mintable.sol' : {
            content: loadContract(solidityPath + 'token/ERC20Mintable.sol'),
        },
        'IERC20.sol' : {
            content: loadContract(solidityPath + 'token/IERC20.sol'),
        },
        'openzeppelin/SafeMath.sol' : {
            content: loadContract(solidityPath + 'openzeppelin/SafeMath.sol'),
        },
        'openzeppelin/MinterRole.sol' : {
            content: loadContract(solidityPath + 'openzeppelin/MinterRole.sol'),
        },
        'openzeppelin/Roles.sol' : {
            content: loadContract(solidityPath + 'openzeppelin/Roles.sol'),
        },
    },
    settings: {
        outputSelection: {
            '*': {
                'ERC20Mintable': [ 'evm.bytecode.object', 'abi']
            }
        }
    }
}



const inputRelayerRegistry = {
    language: 'Solidity',
    sources: {
        'MockRelayerRegistry.sol': {
            content: loadContract(solidityPath + 'MockRelayerRegistry.sol'),
        },
    },
    settings: {
        outputSelection: {
            '*': {
                'RelayerRegistry': [ 'evm.bytecode.object', 'abi']
            }
        }
    }
}

const getSemaphoreBytecode = async () => {
    return compileInputBytecode(inputSemaphore)
}

const main = async () => {

    const outputPath = 'compiled/'

    if (fs.existsSync(outputPath)){
        fs.rmdirSync(outputPath, { recursive: true })
        fs.mkdirSync(outputPath)
    }

    buildMiMC(outputPath)
    //compileInput(inputMiMC, outputPath)
    compileInput(inputSemaphore, outputPath)
    compileInput(inputMixer, outputPath)
    compileInput(inputToken, outputPath)
    compileInput(inputRelayerRegistry, outputPath)


    fs.rmSync('../frontend/' + outputPath, { recursive: true, force : true })

    // To copy a folder or file
    fse.copySync(outputPath, '../frontend/' + outputPath)

}

if (require.main === module) {
    try {
        main()
    } catch (err) {
        console.error(err)
    }
}

export {
    getSemaphoreBytecode
}
