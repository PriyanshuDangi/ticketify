open Table
open Enums.EntityType
type id = string

type internalEntity = Internal.entity
module type Entity = {
  type t
  let index: int
  let name: string
  let schema: S.t<t>
  let rowsSchema: S.t<array<t>>
  let table: Table.table
  let entityHistory: EntityHistory.t<t>
}
external entityModToInternal: module(Entity with type t = 'a) => Internal.entityConfig = "%identity"
external entityModsToInternal: array<module(Entity)> => array<Internal.entityConfig> = "%identity"
external entitiesToInternal: array<'a> => array<Internal.entity> = "%identity"

@get
external getEntityId: internalEntity => string = "id"

exception UnexpectedIdNotDefinedOnEntity
let getEntityIdUnsafe = (entity: 'entity): id =>
  switch Utils.magic(entity)["id"] {
  | Some(id) => id
  | None =>
    UnexpectedIdNotDefinedOnEntity->ErrorHandling.mkLogAndRaise(
      ~msg="Property 'id' does not exist on expected entity object",
    )
  }

//shorthand for punning
let isPrimaryKey = true
let isNullable = true
let isArray = true
let isIndex = true

@genType
type whereOperations<'entity, 'fieldType> = {
  eq: 'fieldType => promise<array<'entity>>,
  gt: 'fieldType => promise<array<'entity>>
}

module Event = {
  let name = (Event :> string)
  let index = 0
  @genType
  type t = {
    blockNumber: bigint,
    contractEventId: string,
    eventTime: bigint,
    id: id,
    maxAttendees: bigint,
    organizer: string,
    price: bigint,
    timestamp: bigint,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    blockNumber: s.field("blockNumber", BigInt.schema),
    contractEventId: s.field("contractEventId", S.string),
    eventTime: s.field("eventTime", BigInt.schema),
    id: s.field("id", S.string),
    maxAttendees: s.field("maxAttendees", BigInt.schema),
    organizer: s.field("organizer", S.string),
    price: s.field("price", BigInt.schema),
    timestamp: s.field("timestamp", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("contractEventId") contractEventId: whereOperations<t, string>,
    
      @as("organizer") organizer: whereOperations<t, string>,
    
      @as("transactionHash") transactionHash: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "blockNumber", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "contractEventId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "eventTime", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "maxAttendees", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "organizer", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "price", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module PlatformFeeWithdrawal = {
  let name = (PlatformFeeWithdrawal :> string)
  let index = 1
  @genType
  type t = {
    amount: bigint,
    blockNumber: bigint,
    id: id,
    owner: string,
    timestamp: bigint,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    blockNumber: s.field("blockNumber", BigInt.schema),
    id: s.field("id", S.string),
    owner: s.field("owner", S.string),
    timestamp: s.field("timestamp", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("owner") owner: whereOperations<t, string>,
    
      @as("transactionHash") transactionHash: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "blockNumber", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "owner", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module RevenueWithdrawal = {
  let name = (RevenueWithdrawal :> string)
  let index = 2
  @genType
  type t = {
    amount: bigint,
    blockNumber: bigint,
    eventId: string,
    id: id,
    organizer: string,
    timestamp: bigint,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    amount: s.field("amount", BigInt.schema),
    blockNumber: s.field("blockNumber", BigInt.schema),
    eventId: s.field("eventId", S.string),
    id: s.field("id", S.string),
    organizer: s.field("organizer", S.string),
    timestamp: s.field("timestamp", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("eventId") eventId: whereOperations<t, string>,
    
      @as("organizer") organizer: whereOperations<t, string>,
    
      @as("transactionHash") transactionHash: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "amount", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "blockNumber", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "eventId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "organizer", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module TicketPurchase = {
  let name = (TicketPurchase :> string)
  let index = 3
  @genType
  type t = {
    blockNumber: bigint,
    buyer: string,
    eventId: string,
    id: id,
    price: bigint,
    timestamp: bigint,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    blockNumber: s.field("blockNumber", BigInt.schema),
    buyer: s.field("buyer", S.string),
    eventId: s.field("eventId", S.string),
    id: s.field("id", S.string),
    price: s.field("price", BigInt.schema),
    timestamp: s.field("timestamp", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("buyer") buyer: whereOperations<t, string>,
    
      @as("eventId") eventId: whereOperations<t, string>,
    
      @as("transactionHash") transactionHash: whereOperations<t, string>,
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "blockNumber", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "buyer", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "eventId", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "price", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      ~isIndex,
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

let userEntities = [
  module(Event),
  module(PlatformFeeWithdrawal),
  module(RevenueWithdrawal),
  module(TicketPurchase),
]->entityModsToInternal

let allEntities =
  userEntities->Js.Array2.concat(
    [module(InternalTable.DynamicContractRegistry)]->entityModsToInternal,
  )

let byName =
  allEntities
  ->Js.Array2.map(entityConfig => {
    (entityConfig.name, entityConfig)
  })
  ->Js.Dict.fromArray
