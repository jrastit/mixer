
import { forwarderRegistryERC20Address } from '../utils/configFrontend'
import { SurrogethClient } from "surrogeth-client"
const ForwarderRegistryERC20 = require('../../compiled/ForwarderRegistryERC20.json')

const getBroadcasterList = async (wallet, network, token) => {

    const protocol = "http"

    const client = new SurrogethClient(
        wallet,
        network,
        forwarderRegistryERC20Address, // defaults to current deployment on specified network
        ForwarderRegistryERC20.abi,
        protocol // "https" || "http"
    )




    if (token){

    }else{
        let relayers = await client.getBroadcasters(
            1,
            //new Set([]), // don't ignore any addresses
            new Set(["ip"]) // only return relayers with an IP address
        )

        if (relayers.length > 0) {
            return relayers
        }

    }

    return null;
}




export { getBroadcasterList }