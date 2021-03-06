import React, { useState, useEffect, useContext } from 'react'
import ReactDOM from 'react-dom'
import { ethers } from 'ethers'
import{
    chainId,
    supportedNetworkName,
    network,
    tokenAddress,
    tokenDecimals,
    tokenName,
    tokenSym,
    mixerRegistryAddress,
    forwarderRegistryERC20Address,
    enableBackend,
} from '../utils/configFrontend'

import {
    getTokenList,
    getMixerList,
} from '../utils/mixerRegistry'

import {
    getBackendStatus
} from '../utils/backend'

import {
    getBroadcasterList
} from '../web3/surrogeth'

const ContractInfo = (props) => {

    const [relayerAddress, setRelayerAddress] = useState(enableBackend? 'Request...': 'Disable by configuration')
    const [broadcasterList, setBroadcasterList] = useState(["Request..."])
    const [tokenList, setTokenList] = useState([{
        address : "Request...",
        tokenConfig : null
    }])
    const [mixerList, setMixerList] = useState([{
            mixAmt : null,
            address : "Request...",
            semaphore : null,
        }])
    const [isInit, setIsInit] = useState(false)

    useEffect(() => {
        if (!isInit && props.provider){
            setIsInit(true)
            if (enableBackend){
              getBackendStatus(network).then((result) => {
                  //console.log(result)
                  setRelayerAddress(result.address)
              })
            }
            getTokenList(props.provider).then((result) => {
                //console.log(JSON.stringify(result), JSON.stringify(tokenList))
                if (result && JSON.stringify(result) !== JSON.stringify(tokenList)){
                    //{locator, locatorType, address}
                    //setBroadcasterList(result[0].address + " " + result[0].locator)
                    setTokenList(result)
                }else if (!result){
                    setTokenList([{
                        address : "Error",
                        tokenConfig : null
                    }])
                }
            })
            getMixerList(props.provider, tokenAddress).then((result) => {
                //console.log(JSON.stringify(result), JSON.stringify(tokenList))
                if (result && JSON.stringify(result) !== JSON.stringify(mixerList)){
                    //{locator, locatorType, address}
                    //setBroadcasterList(result[0].address + " " + result[0].locator)
                    setMixerList(result)
                }else if (!result){
                    setMixerList([{
                        mixAmt : null,
                        address : "Error",
                        semaphore : null
                    }])
                }
            })
            getBroadcasterList(props.provider, network, tokenAddress).then((result) => {
                //console.log(JSON.stringify(result), JSON.stringify(broadcasterList))
                if (result && JSON.stringify(result) !== JSON.stringify(broadcasterList)){
                    //{locator, locatorType, address}
                    //setBroadcasterList(result[0].address + " " + result[0].locator)
                    setBroadcasterList(result)
                }else if (!result){
                    setBroadcasterList(["error"])
                }
            })
        }
    })

    //console.log("Draw Contract info")

    return (
        <div className='columns'>
            <div className='column is-12-mobile is-8-desktop is-offset-2-desktop'>
            <h1 className='title'>
                Contract Info
            </h1>
            <h2 className='subtitle'  style={{paddingTop:"1em"}}>
                Network
            </h2>
            <p>
                Network : { supportedNetworkName }
            </p>
            <p>
                Chain Id : {chainId}
            </p>
            <p>
                Token Address : {tokenAddress ? tokenAddress : "No token"}
            </p>

            <h2 className='subtitle'  style={{paddingTop:"1em"}}>
                Mixer
            </h2>
            <p>
                Mixer Registry Address : {mixerRegistryAddress}
            </p>
            Token : <br/>
            <table style={{marginLeft: "0em"}}>
                <thead>
                    <tr>
                        <td style={
                            {textAlign: "center", padding: '0 1em 0 1em'}
                        }>Name</td>
                        <td style={
                            {textAlign: "center", padding: '0 1em 0 1em'}
                        }>Fee</td>
                        <td style={
                            {textAlign: "center", padding: '0 1em 0 1em'}
                        }>ERC20 Token address</td>
                    </tr>
                </thead>
                <tbody>
                {
                    tokenList.map((obj:any) => {
                    if (typeof obj === 'string' || obj instanceof String){
                        return (<tr key="msg">
                            <td>{obj}</td>
                            <td></td>
                        </tr>)
                    }else{

                        return (
                            //The address is unique
                            <tr key={obj.address}>
                                <td style={{padding: '0 1em 0 1em'}}>
                                    {obj.tokenConfig ? obj.tokenConfig.name : "(not in config)"}
                                </td><td style={{padding: '0 1em 0 1em'}}>
                                    {obj.tokenConfig ? obj.tokenConfig.feeAmt + " " + obj.tokenConfig.sym : ""}
                                </td><td style={{padding: '0 1em 0 1em'}}>
                                    {obj.address == "0x0000000000000000000000000000000000000000" ? "" : obj.address}
                                </td></tr>)
                    }
                })}
            </tbody></table>
            Mixer for {tokenName} : <br/>
            <table style={{marginLeft: "0em"}}>
                <thead>
                    <tr>
                        <td style={
                            {textAlign: "center", padding: '0 1em 0 1em'}
                        }>Amount</td>
                        <td style={
                            {textAlign: "center", padding: '0 1em 0 1em'}
                        }>Address</td>
                        <td style={
                            {textAlign: "center", padding: '0 1em 0 1em'}
                        }>Semaphore address</td>
                    </tr>
                </thead>
                <tbody>
                {
                    mixerList.map((obj:any) => {
                    if (typeof obj === 'string' || obj instanceof String){
                        return (<tr key="msg">
                            <td>{obj}</td>
                            <td></td>
                        </tr>)
                    }else{

                        return (
                            //The address is unique
                            <tr key={obj.address}>
                                <td style={{padding: '0 1em 0 1em'}}>
                                    {obj.mixAmt ? ethers.utils.formatUnits(obj.mixAmt, tokenDecimals) : "(error)"}&nbsp;{tokenSym}
                                </td><td style={{padding: '0 1em 0 1em'}}>
                                    {obj.address}
                                </td><td style={{padding: '0 1em 0 1em'}}>
                                    {obj.semaphore}
                                </td></tr>)
                    }
                })}
            </tbody></table>
            <h2 className='subtitle' style={{paddingTop:"1em"}}>
                Backend
            </h2>
            <p>
                Relayer Address : {relayerAddress}
            </p>
            <h2 className='subtitle'  style={{paddingTop:"1em"}}>
                Surrogeth Forwarder
            </h2>
            <p>
                ForwarderRegistryERC20 Address : {forwarderRegistryERC20Address}
            </p>

                Broadcaster : <br/>
                <table style={{marginLeft: "0em"}}>
                    <thead>
                        <tr>
                            <td style={
                                {textAlign: "center", padding: '0 1em 0 1em'}
                            }>Location</td>
                            <td style={
                                {textAlign: "center", padding: '0 1em 0 1em'}
                            }>Address</td>
                            <td style={
                                {textAlign: "center", padding: '0 1em 0 1em'}
                            }>Fee</td>
                            <td style={
                                {textAlign: "center", padding: '0 1em 0 1em'}
                            }>Transaction</td>
                            <td style={
                                {textAlign: "center", padding: '0 1em 0 1em'}
                            }>Average fee</td>
                        </tr>
                    </thead>
                    <tbody>
                    {broadcasterList.map((obj:any) => {
                        if (typeof obj === 'string' || obj instanceof String){
                            return (<tr key="msg">
                                <td>{obj}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>)
                        }else{
                            const feeAvg = obj.feeCount.eq(0) ?
                                '' :
                                ethers.utils.formatUnits(
                                    obj.feeSum.div(obj.feeCount),
                                    tokenDecimals
                                )
                            let fee
                            if (obj.fee){
                                fee = ethers.utils.formatUnits(obj.fee)
                            } else {
                                fee = "KO"
                            }
                            return (
                                //The address is unique
                                <tr key={obj.address}>
                                    <td style={{padding: '0 1em 0 1em'}}>
                                        {obj.locatorType}:&nbsp;{obj.locator}
                                    </td><td style={{padding: '0 1em 0 1em'}}>
                                        {obj.address}
                                    </td><td style={{padding: '0 1em 0 1em'}}>
                                        {fee}&nbsp;{tokenSym}
                                    </td><td style={{padding: '0 1em 0 1em'}}>
                                        {obj.feeCount.toString()}
                                    </td><td style={{padding: '0 1em 0 1em'}}>
                                        {feeAvg}&nbsp;{feeAvg?tokenSym:''}
                                    </td></tr>)
                        }
                    })}
                </tbody></table>

        </div>
    </div>
    )
}

export default ContractInfo
