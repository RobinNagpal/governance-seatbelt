import { Contract } from 'ethers'
import { customProvider } from '../../../utils/clients/ethers'
import { getContractNameAndAbiFromFile } from '../abi-utils'
import { CometChains, ExecuteTransactionInfo, TransactionFormatter } from '../compound-types'
import {
  defactor,
  getContractSymbolAndDecimalsFromFile,
  getFormatCompTokens,
  getFormattedTokenNameWithLink,
  getFormattedTokenWithLink,
  getPercentageForTokenFactor,
  getPlatform,
  getRecipientNameWithLink,
} from './helper'

export const ERC20Formatters: { [functionName: string]: TransactionFormatter } = {
  'transfer(address,uint256)': async (
    chain: CometChains,
    transaction: ExecuteTransactionInfo,
    decodedParams: string[]
  ) => {
    const formattedTokenWithLink = await getFormattedTokenWithLink(chain, transaction.target, decodedParams[1])
    return `\n\nTransfer ${formattedTokenWithLink} to ${getRecipientNameWithLink(chain, decodedParams[0])}.`
  },
  'approve(address,uint256)': async (
    chain: CometChains,
    transaction: ExecuteTransactionInfo,
    decodedParams: string[]
  ) => {
    const tokenAddress = transaction.target
    const formattedTokenWithLink = await getFormattedTokenWithLink(chain, tokenAddress, decodedParams[1])
    return `\n\nApprove ${formattedTokenWithLink} tokens to ${getRecipientNameWithLink(chain, decodedParams[0])}`
  },
  '_setReserveFactor(uint256)': async (
    chain: CometChains,
    transaction: ExecuteTransactionInfo,
    decodedParams: string[]
  ) => {
    const tokenAddress = transaction.target
    const { abi } = await getContractNameAndAbiFromFile(chain, tokenAddress)
    const coinInstance = new Contract(tokenAddress, abi, customProvider(chain))
    const prevReserveFactor = await coinInstance.callStatic.reserveFactorMantissa()

    const newReserveFactor = getPercentageForTokenFactor(decodedParams[0])

    const tokenNameWithLink = await getFormattedTokenNameWithLink(chain, tokenAddress)
    const prevReserve = getPercentageForTokenFactor(prevReserveFactor)
    if (prevReserveFactor && prevReserve !== newReserveFactor) {
      return `\n\nSet reserve factor for ${tokenNameWithLink} from ${prevReserve}% to ${newReserveFactor}%`
    }

    return `\n\nSet reserve factor for ${tokenNameWithLink} to ${newReserveFactor}%`
  },
  'depositForBurn(uint256,uint32,bytes32,address)': async (
    chain: CometChains,
    transaction: ExecuteTransactionInfo,
    decodedParams: string[]
  ) => {
    const platform = await getPlatform(chain)

    const { contractName } = await getContractNameAndAbiFromFile(chain, transaction.target)

    const burnContractAddress = decodedParams[3]
    const { abi } = await getContractNameAndAbiFromFile(chain, burnContractAddress)
    const tokenInstance = new Contract(burnContractAddress, abi, customProvider(chain))
    const { symbol: tokenSymbol, decimals } = await getContractSymbolAndDecimalsFromFile(
      burnContractAddress,
      tokenInstance,
      chain
    )

    const amount = defactor(BigInt(decodedParams[0]), parseFloat(`1e${decimals}`))

    return `\n\nSet DepositforBurn of ${contractName} for the Burn contract [${tokenSymbol}](https://${platform}/address/${burnContractAddress}) with amount ${amount.toFixed(
      2
    )}, destination domain ${decodedParams[1]} and the Mint recipient ${decodedParams[2]}`
  },
  'setText(bytes32,string,string)': async (
    chain: CometChains,
    transaction: ExecuteTransactionInfo,
    decodedParams: string[]
  ) => {
    const ENSSubdomain =
      decodedParams[0] === '0x7dcf87198fd673716e5a32b206d9379c4fcbad8875073f52bfd0656759bf89ed'
        ? 'v3-additional-grants.compound-community-licenses.eth'
        : 'Unknown ENS Name'
    return `\n\nSet ENS text for ${ENSSubdomain} with key: ${decodedParams[1]} and value:\n\n ${decodedParams[2]}`
  },
  'setSubnodeRecord(bytes32,bytes32,address,address,uint64)': async (
    chain: CometChains,
    transaction: ExecuteTransactionInfo,
    decodedParams: string[]
  ) => {
    const platform = await getPlatform(chain)

    const { contractName: ownerName } = await getContractNameAndAbiFromFile(chain, decodedParams[2])
    const { contractName: resolverName } = await getContractNameAndAbiFromFile(chain, decodedParams[3])

    const ENSName = 'compound-community-licenses.eth'
    const ENSSubdomainLabel = 'v3-additional-grants'
    return `\n\nCreate new ${ENSSubdomainLabel} ENS subdomain for ${ENSName} with [${ownerName}](https://${platform}/address/${decodedParams[2]}) as owner and [${resolverName}](https://${platform}/address/${decodedParams[3]}) as resolver and ttl = ${decodedParams[4]}`
  },
  '_setInterestRateModel(address)': async (
    chain: CometChains,
    transaction: ExecuteTransactionInfo,
    decodedParams: string[]
  ) => {
    const platform = await getPlatform(chain)

    const coinLink = await getFormattedTokenNameWithLink(chain, transaction.target)

    return `\n\nSet [interest rate model](https://${platform}/address/${decodedParams[0]}) for ${coinLink}.`
  },
}
