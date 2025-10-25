module ContractType = {
  @genType
  type t = 
    | @as("Ticketify") Ticketify

  let name = "CONTRACT_TYPE"
  let variants = [
    Ticketify,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("Event") Event
    | @as("PlatformFeeWithdrawal") PlatformFeeWithdrawal
    | @as("RevenueWithdrawal") RevenueWithdrawal
    | @as("TicketPurchase") TicketPurchase
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    Event,
    PlatformFeeWithdrawal,
    RevenueWithdrawal,
    TicketPurchase,
    DynamicContractRegistry,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

let allEnums = ([
  ContractType.config->Internal.fromGenericEnumConfig,
  EntityType.config->Internal.fromGenericEnumConfig,
])
