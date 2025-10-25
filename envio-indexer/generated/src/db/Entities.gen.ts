/* TypeScript file generated from Entities.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type id = string;

export type whereOperations<entity,fieldType> = { readonly eq: (_1:fieldType) => Promise<entity[]>; readonly gt: (_1:fieldType) => Promise<entity[]> };

export type Event_t = {
  readonly blockNumber: bigint; 
  readonly contractEventId: string; 
  readonly eventTime: bigint; 
  readonly id: id; 
  readonly maxAttendees: bigint; 
  readonly organizer: string; 
  readonly price: bigint; 
  readonly timestamp: bigint; 
  readonly transactionHash: string
};

export type Event_indexedFieldOperations = {
  readonly contractEventId: whereOperations<Event_t,string>; 
  readonly organizer: whereOperations<Event_t,string>; 
  readonly transactionHash: whereOperations<Event_t,string>
};

export type PlatformFeeWithdrawal_t = {
  readonly amount: bigint; 
  readonly blockNumber: bigint; 
  readonly id: id; 
  readonly owner: string; 
  readonly timestamp: bigint; 
  readonly transactionHash: string
};

export type PlatformFeeWithdrawal_indexedFieldOperations = { readonly owner: whereOperations<PlatformFeeWithdrawal_t,string>; readonly transactionHash: whereOperations<PlatformFeeWithdrawal_t,string> };

export type RevenueWithdrawal_t = {
  readonly amount: bigint; 
  readonly blockNumber: bigint; 
  readonly eventId: string; 
  readonly id: id; 
  readonly organizer: string; 
  readonly timestamp: bigint; 
  readonly transactionHash: string
};

export type RevenueWithdrawal_indexedFieldOperations = {
  readonly eventId: whereOperations<RevenueWithdrawal_t,string>; 
  readonly organizer: whereOperations<RevenueWithdrawal_t,string>; 
  readonly transactionHash: whereOperations<RevenueWithdrawal_t,string>
};

export type TicketPurchase_t = {
  readonly blockNumber: bigint; 
  readonly buyer: string; 
  readonly eventId: string; 
  readonly id: id; 
  readonly price: bigint; 
  readonly timestamp: bigint; 
  readonly transactionHash: string
};

export type TicketPurchase_indexedFieldOperations = {
  readonly buyer: whereOperations<TicketPurchase_t,string>; 
  readonly eventId: whereOperations<TicketPurchase_t,string>; 
  readonly transactionHash: whereOperations<TicketPurchase_t,string>
};
