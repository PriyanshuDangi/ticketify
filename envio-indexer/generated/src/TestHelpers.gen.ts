/* TypeScript file generated from TestHelpers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpersJS = require('./TestHelpers.res.js');

import type {Ticketify_EventCreated_event as Types_Ticketify_EventCreated_event} from './Types.gen';

import type {Ticketify_PlatformFeesWithdrawn_event as Types_Ticketify_PlatformFeesWithdrawn_event} from './Types.gen';

import type {Ticketify_RevenueWithdrawn_event as Types_Ticketify_RevenueWithdrawn_event} from './Types.gen';

import type {Ticketify_TicketPurchased_event as Types_Ticketify_TicketPurchased_event} from './Types.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

import type {t as TestHelpers_MockDb_t} from './TestHelpers_MockDb.gen';

/** The arguements that get passed to a "processEvent" helper function */
export type EventFunctions_eventProcessorArgs<event> = {
  readonly event: event; 
  readonly mockDb: TestHelpers_MockDb_t; 
  readonly chainId?: number
};

export type EventFunctions_eventProcessor<event> = (_1:EventFunctions_eventProcessorArgs<event>) => Promise<TestHelpers_MockDb_t>;

export type EventFunctions_MockBlock_t = {
  readonly hash?: string; 
  readonly number?: number; 
  readonly timestamp?: number
};

export type EventFunctions_MockTransaction_t = { readonly hash?: string };

export type EventFunctions_mockEventData = {
  readonly chainId?: number; 
  readonly srcAddress?: Address_t; 
  readonly logIndex?: number; 
  readonly block?: EventFunctions_MockBlock_t; 
  readonly transaction?: EventFunctions_MockTransaction_t
};

export type Ticketify_EventCreated_createMockArgs = {
  readonly eventId?: bigint; 
  readonly organizer?: Address_t; 
  readonly price?: bigint; 
  readonly maxAttendees?: bigint; 
  readonly eventTime?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type Ticketify_TicketPurchased_createMockArgs = {
  readonly eventId?: bigint; 
  readonly buyer?: Address_t; 
  readonly price?: bigint; 
  readonly timestamp?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type Ticketify_RevenueWithdrawn_createMockArgs = {
  readonly eventId?: bigint; 
  readonly organizer?: Address_t; 
  readonly amount?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type Ticketify_PlatformFeesWithdrawn_createMockArgs = {
  readonly owner?: Address_t; 
  readonly amount?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export const MockDb_createMockDb: () => TestHelpers_MockDb_t = TestHelpersJS.MockDb.createMockDb as any;

export const Addresses_mockAddresses: Address_t[] = TestHelpersJS.Addresses.mockAddresses as any;

export const Addresses_defaultAddress: Address_t = TestHelpersJS.Addresses.defaultAddress as any;

export const Ticketify_EventCreated_processEvent: EventFunctions_eventProcessor<Types_Ticketify_EventCreated_event> = TestHelpersJS.Ticketify.EventCreated.processEvent as any;

export const Ticketify_EventCreated_createMockEvent: (args:Ticketify_EventCreated_createMockArgs) => Types_Ticketify_EventCreated_event = TestHelpersJS.Ticketify.EventCreated.createMockEvent as any;

export const Ticketify_TicketPurchased_processEvent: EventFunctions_eventProcessor<Types_Ticketify_TicketPurchased_event> = TestHelpersJS.Ticketify.TicketPurchased.processEvent as any;

export const Ticketify_TicketPurchased_createMockEvent: (args:Ticketify_TicketPurchased_createMockArgs) => Types_Ticketify_TicketPurchased_event = TestHelpersJS.Ticketify.TicketPurchased.createMockEvent as any;

export const Ticketify_RevenueWithdrawn_processEvent: EventFunctions_eventProcessor<Types_Ticketify_RevenueWithdrawn_event> = TestHelpersJS.Ticketify.RevenueWithdrawn.processEvent as any;

export const Ticketify_RevenueWithdrawn_createMockEvent: (args:Ticketify_RevenueWithdrawn_createMockArgs) => Types_Ticketify_RevenueWithdrawn_event = TestHelpersJS.Ticketify.RevenueWithdrawn.createMockEvent as any;

export const Ticketify_PlatformFeesWithdrawn_processEvent: EventFunctions_eventProcessor<Types_Ticketify_PlatformFeesWithdrawn_event> = TestHelpersJS.Ticketify.PlatformFeesWithdrawn.processEvent as any;

export const Ticketify_PlatformFeesWithdrawn_createMockEvent: (args:Ticketify_PlatformFeesWithdrawn_createMockArgs) => Types_Ticketify_PlatformFeesWithdrawn_event = TestHelpersJS.Ticketify.PlatformFeesWithdrawn.createMockEvent as any;

export const Addresses: { mockAddresses: Address_t[]; defaultAddress: Address_t } = TestHelpersJS.Addresses as any;

export const Ticketify: {
  EventCreated: {
    processEvent: EventFunctions_eventProcessor<Types_Ticketify_EventCreated_event>; 
    createMockEvent: (args:Ticketify_EventCreated_createMockArgs) => Types_Ticketify_EventCreated_event
  }; 
  TicketPurchased: {
    processEvent: EventFunctions_eventProcessor<Types_Ticketify_TicketPurchased_event>; 
    createMockEvent: (args:Ticketify_TicketPurchased_createMockArgs) => Types_Ticketify_TicketPurchased_event
  }; 
  PlatformFeesWithdrawn: {
    processEvent: EventFunctions_eventProcessor<Types_Ticketify_PlatformFeesWithdrawn_event>; 
    createMockEvent: (args:Ticketify_PlatformFeesWithdrawn_createMockArgs) => Types_Ticketify_PlatformFeesWithdrawn_event
  }; 
  RevenueWithdrawn: {
    processEvent: EventFunctions_eventProcessor<Types_Ticketify_RevenueWithdrawn_event>; 
    createMockEvent: (args:Ticketify_RevenueWithdrawn_createMockArgs) => Types_Ticketify_RevenueWithdrawn_event
  }
} = TestHelpersJS.Ticketify as any;

export const MockDb: { createMockDb: () => TestHelpers_MockDb_t } = TestHelpersJS.MockDb as any;
