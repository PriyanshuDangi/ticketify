/* TypeScript file generated from Types.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {Event_t as Entities_Event_t} from '../src/db/Entities.gen';

import type {HandlerContext as $$handlerContext} from './Types.ts';

import type {HandlerWithOptions as $$fnWithEventConfig} from './bindings/OpaqueTypes.ts';

import type {LoaderContext as $$loaderContext} from './Types.ts';

import type {PlatformFeeWithdrawal_t as Entities_PlatformFeeWithdrawal_t} from '../src/db/Entities.gen';

import type {RevenueWithdrawal_t as Entities_RevenueWithdrawal_t} from '../src/db/Entities.gen';

import type {SingleOrMultiple as $$SingleOrMultiple_t} from './bindings/OpaqueTypes';

import type {TicketPurchase_t as Entities_TicketPurchase_t} from '../src/db/Entities.gen';

import type {entityHandlerContext as Internal_entityHandlerContext} from 'envio/src/Internal.gen';

import type {eventOptions as Internal_eventOptions} from 'envio/src/Internal.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericEvent as Internal_genericEvent} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {genericLoaderArgs as Internal_genericLoaderArgs} from 'envio/src/Internal.gen';

import type {genericLoader as Internal_genericLoader} from 'envio/src/Internal.gen';

import type {logger as Envio_logger} from 'envio/src/Envio.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

export type id = string;
export type Id = id;

export type contractRegistrations = { readonly log: Envio_logger; readonly addTicketify: (_1:Address_t) => void };

export type entityLoaderContext<entity,indexedFieldOperations> = {
  readonly get: (_1:id) => Promise<(undefined | entity)>; 
  readonly getOrThrow: (_1:id, message:(undefined | string)) => Promise<entity>; 
  readonly getWhere: indexedFieldOperations; 
  readonly getOrCreate: (_1:entity) => Promise<entity>; 
  readonly set: (_1:entity) => void; 
  readonly deleteUnsafe: (_1:id) => void
};

export type loaderContext = $$loaderContext;

export type entityHandlerContext<entity> = Internal_entityHandlerContext<entity>;

export type handlerContext = $$handlerContext;

export type event = Entities_Event_t;
export type Event = event;

export type platformFeeWithdrawal = Entities_PlatformFeeWithdrawal_t;
export type PlatformFeeWithdrawal = platformFeeWithdrawal;

export type revenueWithdrawal = Entities_RevenueWithdrawal_t;
export type RevenueWithdrawal = revenueWithdrawal;

export type ticketPurchase = Entities_TicketPurchase_t;
export type TicketPurchase = ticketPurchase;

export type Transaction_t = { readonly hash: string };

export type Block_t = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type AggregatedBlock_t = {
  readonly hash: string; 
  readonly number: number; 
  readonly timestamp: number
};

export type AggregatedTransaction_t = { readonly hash: string };

export type eventLog<params> = Internal_genericEvent<params,Block_t,Transaction_t>;
export type EventLog<params> = eventLog<params>;

export type SingleOrMultiple_t<a> = $$SingleOrMultiple_t<a>;

export type HandlerTypes_args<eventArgs,context> = { readonly event: eventLog<eventArgs>; readonly context: context };

export type HandlerTypes_contractRegisterArgs<eventArgs> = Internal_genericContractRegisterArgs<eventLog<eventArgs>,contractRegistrations>;

export type HandlerTypes_contractRegister<eventArgs> = Internal_genericContractRegister<HandlerTypes_contractRegisterArgs<eventArgs>>;

export type HandlerTypes_loaderArgs<eventArgs> = Internal_genericLoaderArgs<eventLog<eventArgs>,loaderContext>;

export type HandlerTypes_loader<eventArgs,loaderReturn> = Internal_genericLoader<HandlerTypes_loaderArgs<eventArgs>,loaderReturn>;

export type HandlerTypes_handlerArgs<eventArgs,loaderReturn> = Internal_genericHandlerArgs<eventLog<eventArgs>,handlerContext,loaderReturn>;

export type HandlerTypes_handler<eventArgs,loaderReturn> = Internal_genericHandler<HandlerTypes_handlerArgs<eventArgs,loaderReturn>>;

export type HandlerTypes_loaderHandler<eventArgs,loaderReturn,eventFilters> = Internal_genericHandlerWithLoader<HandlerTypes_loader<eventArgs,loaderReturn>,HandlerTypes_handler<eventArgs,loaderReturn>,eventFilters>;

export type HandlerTypes_eventConfig<eventFilters> = Internal_eventOptions<eventFilters>;

export type fnWithEventConfig<fn,eventConfig> = $$fnWithEventConfig<fn,eventConfig>;

export type handlerWithOptions<eventArgs,loaderReturn,eventFilters> = fnWithEventConfig<HandlerTypes_handler<eventArgs,loaderReturn>,HandlerTypes_eventConfig<eventFilters>>;

export type contractRegisterWithOptions<eventArgs,eventFilters> = fnWithEventConfig<HandlerTypes_contractRegister<eventArgs>,HandlerTypes_eventConfig<eventFilters>>;

export type Ticketify_chainId = 11155111;

export type Ticketify_EventCreated_eventArgs = {
  readonly eventId: bigint; 
  readonly organizer: Address_t; 
  readonly price: bigint; 
  readonly maxAttendees: bigint; 
  readonly eventTime: bigint
};

export type Ticketify_EventCreated_block = Block_t;

export type Ticketify_EventCreated_transaction = Transaction_t;

export type Ticketify_EventCreated_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: Ticketify_EventCreated_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: Ticketify_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: Ticketify_EventCreated_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: Ticketify_EventCreated_block
};

export type Ticketify_EventCreated_loaderArgs = Internal_genericLoaderArgs<Ticketify_EventCreated_event,loaderContext>;

export type Ticketify_EventCreated_loader<loaderReturn> = Internal_genericLoader<Ticketify_EventCreated_loaderArgs,loaderReturn>;

export type Ticketify_EventCreated_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<Ticketify_EventCreated_event,handlerContext,loaderReturn>;

export type Ticketify_EventCreated_handler<loaderReturn> = Internal_genericHandler<Ticketify_EventCreated_handlerArgs<loaderReturn>>;

export type Ticketify_EventCreated_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<Ticketify_EventCreated_event,contractRegistrations>>;

export type Ticketify_EventCreated_eventFilter = { readonly eventId?: SingleOrMultiple_t<bigint>; readonly organizer?: SingleOrMultiple_t<Address_t> };

export type Ticketify_EventCreated_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: Ticketify_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type Ticketify_EventCreated_eventFiltersDefinition = 
    Ticketify_EventCreated_eventFilter
  | Ticketify_EventCreated_eventFilter[];

export type Ticketify_EventCreated_eventFilters = 
    Ticketify_EventCreated_eventFilter
  | Ticketify_EventCreated_eventFilter[]
  | ((_1:Ticketify_EventCreated_eventFiltersArgs) => Ticketify_EventCreated_eventFiltersDefinition);

export type Ticketify_TicketPurchased_eventArgs = {
  readonly eventId: bigint; 
  readonly buyer: Address_t; 
  readonly price: bigint; 
  readonly timestamp: bigint
};

export type Ticketify_TicketPurchased_block = Block_t;

export type Ticketify_TicketPurchased_transaction = Transaction_t;

export type Ticketify_TicketPurchased_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: Ticketify_TicketPurchased_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: Ticketify_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: Ticketify_TicketPurchased_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: Ticketify_TicketPurchased_block
};

export type Ticketify_TicketPurchased_loaderArgs = Internal_genericLoaderArgs<Ticketify_TicketPurchased_event,loaderContext>;

export type Ticketify_TicketPurchased_loader<loaderReturn> = Internal_genericLoader<Ticketify_TicketPurchased_loaderArgs,loaderReturn>;

export type Ticketify_TicketPurchased_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<Ticketify_TicketPurchased_event,handlerContext,loaderReturn>;

export type Ticketify_TicketPurchased_handler<loaderReturn> = Internal_genericHandler<Ticketify_TicketPurchased_handlerArgs<loaderReturn>>;

export type Ticketify_TicketPurchased_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<Ticketify_TicketPurchased_event,contractRegistrations>>;

export type Ticketify_TicketPurchased_eventFilter = { readonly eventId?: SingleOrMultiple_t<bigint>; readonly buyer?: SingleOrMultiple_t<Address_t> };

export type Ticketify_TicketPurchased_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: Ticketify_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type Ticketify_TicketPurchased_eventFiltersDefinition = 
    Ticketify_TicketPurchased_eventFilter
  | Ticketify_TicketPurchased_eventFilter[];

export type Ticketify_TicketPurchased_eventFilters = 
    Ticketify_TicketPurchased_eventFilter
  | Ticketify_TicketPurchased_eventFilter[]
  | ((_1:Ticketify_TicketPurchased_eventFiltersArgs) => Ticketify_TicketPurchased_eventFiltersDefinition);

export type Ticketify_RevenueWithdrawn_eventArgs = {
  readonly eventId: bigint; 
  readonly organizer: Address_t; 
  readonly amount: bigint
};

export type Ticketify_RevenueWithdrawn_block = Block_t;

export type Ticketify_RevenueWithdrawn_transaction = Transaction_t;

export type Ticketify_RevenueWithdrawn_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: Ticketify_RevenueWithdrawn_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: Ticketify_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: Ticketify_RevenueWithdrawn_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: Ticketify_RevenueWithdrawn_block
};

export type Ticketify_RevenueWithdrawn_loaderArgs = Internal_genericLoaderArgs<Ticketify_RevenueWithdrawn_event,loaderContext>;

export type Ticketify_RevenueWithdrawn_loader<loaderReturn> = Internal_genericLoader<Ticketify_RevenueWithdrawn_loaderArgs,loaderReturn>;

export type Ticketify_RevenueWithdrawn_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<Ticketify_RevenueWithdrawn_event,handlerContext,loaderReturn>;

export type Ticketify_RevenueWithdrawn_handler<loaderReturn> = Internal_genericHandler<Ticketify_RevenueWithdrawn_handlerArgs<loaderReturn>>;

export type Ticketify_RevenueWithdrawn_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<Ticketify_RevenueWithdrawn_event,contractRegistrations>>;

export type Ticketify_RevenueWithdrawn_eventFilter = { readonly eventId?: SingleOrMultiple_t<bigint>; readonly organizer?: SingleOrMultiple_t<Address_t> };

export type Ticketify_RevenueWithdrawn_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: Ticketify_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type Ticketify_RevenueWithdrawn_eventFiltersDefinition = 
    Ticketify_RevenueWithdrawn_eventFilter
  | Ticketify_RevenueWithdrawn_eventFilter[];

export type Ticketify_RevenueWithdrawn_eventFilters = 
    Ticketify_RevenueWithdrawn_eventFilter
  | Ticketify_RevenueWithdrawn_eventFilter[]
  | ((_1:Ticketify_RevenueWithdrawn_eventFiltersArgs) => Ticketify_RevenueWithdrawn_eventFiltersDefinition);

export type Ticketify_PlatformFeesWithdrawn_eventArgs = { readonly owner: Address_t; readonly amount: bigint };

export type Ticketify_PlatformFeesWithdrawn_block = Block_t;

export type Ticketify_PlatformFeesWithdrawn_transaction = Transaction_t;

export type Ticketify_PlatformFeesWithdrawn_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: Ticketify_PlatformFeesWithdrawn_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: Ticketify_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: Ticketify_PlatformFeesWithdrawn_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: Ticketify_PlatformFeesWithdrawn_block
};

export type Ticketify_PlatformFeesWithdrawn_loaderArgs = Internal_genericLoaderArgs<Ticketify_PlatformFeesWithdrawn_event,loaderContext>;

export type Ticketify_PlatformFeesWithdrawn_loader<loaderReturn> = Internal_genericLoader<Ticketify_PlatformFeesWithdrawn_loaderArgs,loaderReturn>;

export type Ticketify_PlatformFeesWithdrawn_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<Ticketify_PlatformFeesWithdrawn_event,handlerContext,loaderReturn>;

export type Ticketify_PlatformFeesWithdrawn_handler<loaderReturn> = Internal_genericHandler<Ticketify_PlatformFeesWithdrawn_handlerArgs<loaderReturn>>;

export type Ticketify_PlatformFeesWithdrawn_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<Ticketify_PlatformFeesWithdrawn_event,contractRegistrations>>;

export type Ticketify_PlatformFeesWithdrawn_eventFilter = { readonly owner?: SingleOrMultiple_t<Address_t> };

export type Ticketify_PlatformFeesWithdrawn_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: Ticketify_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type Ticketify_PlatformFeesWithdrawn_eventFiltersDefinition = 
    Ticketify_PlatformFeesWithdrawn_eventFilter
  | Ticketify_PlatformFeesWithdrawn_eventFilter[];

export type Ticketify_PlatformFeesWithdrawn_eventFilters = 
    Ticketify_PlatformFeesWithdrawn_eventFilter
  | Ticketify_PlatformFeesWithdrawn_eventFilter[]
  | ((_1:Ticketify_PlatformFeesWithdrawn_eventFiltersArgs) => Ticketify_PlatformFeesWithdrawn_eventFiltersDefinition);

export type chainId = number;

export type chain = 11155111;
