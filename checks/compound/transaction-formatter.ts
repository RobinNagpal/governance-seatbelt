import { TransactionFormatter } from './compound-types'
import { comptrollerFormatters } from './formatters/comptroller-formatters'
import { configuratorFormatters } from './formatters/configurator-formatters'
import { ERC20Formatters } from './formatters/erc20-formatters'
import { bridgeFormatters } from './formatters/bridge-formatters'
import { governorBravoFormatters } from './formatters/governor-bravo-formatters'

export const formattersLookup: {
  [contractName: string]: {
    [functionName: string]: TransactionFormatter
  }
} = {
  Configurator: configuratorFormatters,
  Comptroller: comptrollerFormatters,
  ERC20: ERC20Formatters,
  BridgeFormatters: bridgeFormatters,
  GovernorBravo: governorBravoFormatters,
}
