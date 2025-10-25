/* TypeScript file generated from Handlers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const HandlersJS = require('./Handlers.res.js');

import type {HandlerTypes_eventConfig as Types_HandlerTypes_eventConfig} from './Types.gen';

import type {Ticketify_EventCreated_eventFilters as Types_Ticketify_EventCreated_eventFilters} from './Types.gen';

import type {Ticketify_EventCreated_event as Types_Ticketify_EventCreated_event} from './Types.gen';

import type {Ticketify_PlatformFeesWithdrawn_eventFilters as Types_Ticketify_PlatformFeesWithdrawn_eventFilters} from './Types.gen';

import type {Ticketify_PlatformFeesWithdrawn_event as Types_Ticketify_PlatformFeesWithdrawn_event} from './Types.gen';

import type {Ticketify_RevenueWithdrawn_eventFilters as Types_Ticketify_RevenueWithdrawn_eventFilters} from './Types.gen';

import type {Ticketify_RevenueWithdrawn_event as Types_Ticketify_RevenueWithdrawn_event} from './Types.gen';

import type {Ticketify_TicketPurchased_eventFilters as Types_Ticketify_TicketPurchased_eventFilters} from './Types.gen';

import type {Ticketify_TicketPurchased_event as Types_Ticketify_TicketPurchased_event} from './Types.gen';

import type {chain as Types_chain} from './Types.gen';

import type {contractRegistrations as Types_contractRegistrations} from './Types.gen';

import type {fnWithEventConfig as Types_fnWithEventConfig} from './Types.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {genericLoaderArgs as Internal_genericLoaderArgs} from 'envio/src/Internal.gen';

import type {genericLoader as Internal_genericLoader} from 'envio/src/Internal.gen';

import type {handlerContext as Types_handlerContext} from './Types.gen';

import type {loaderContext as Types_loaderContext} from './Types.gen';

import type {onBlockArgs as Envio_onBlockArgs} from 'envio/src/Envio.gen';

import type {onBlockOptions as Envio_onBlockOptions} from 'envio/src/Envio.gen';

export const Ticketify_EventCreated_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_Ticketify_EventCreated_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_Ticketify_EventCreated_eventFilters>> = HandlersJS.Ticketify.EventCreated.contractRegister as any;

export const Ticketify_EventCreated_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_EventCreated_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_Ticketify_EventCreated_eventFilters>> = HandlersJS.Ticketify.EventCreated.handler as any;

export const Ticketify_EventCreated_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_Ticketify_EventCreated_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_EventCreated_event,Types_handlerContext,loaderReturn>>,Types_Ticketify_EventCreated_eventFilters>) => void = HandlersJS.Ticketify.EventCreated.handlerWithLoader as any;

export const Ticketify_TicketPurchased_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_Ticketify_TicketPurchased_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_Ticketify_TicketPurchased_eventFilters>> = HandlersJS.Ticketify.TicketPurchased.contractRegister as any;

export const Ticketify_TicketPurchased_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_TicketPurchased_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_Ticketify_TicketPurchased_eventFilters>> = HandlersJS.Ticketify.TicketPurchased.handler as any;

export const Ticketify_TicketPurchased_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_Ticketify_TicketPurchased_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_TicketPurchased_event,Types_handlerContext,loaderReturn>>,Types_Ticketify_TicketPurchased_eventFilters>) => void = HandlersJS.Ticketify.TicketPurchased.handlerWithLoader as any;

export const Ticketify_RevenueWithdrawn_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_Ticketify_RevenueWithdrawn_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_Ticketify_RevenueWithdrawn_eventFilters>> = HandlersJS.Ticketify.RevenueWithdrawn.contractRegister as any;

export const Ticketify_RevenueWithdrawn_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_RevenueWithdrawn_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_Ticketify_RevenueWithdrawn_eventFilters>> = HandlersJS.Ticketify.RevenueWithdrawn.handler as any;

export const Ticketify_RevenueWithdrawn_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_Ticketify_RevenueWithdrawn_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_RevenueWithdrawn_event,Types_handlerContext,loaderReturn>>,Types_Ticketify_RevenueWithdrawn_eventFilters>) => void = HandlersJS.Ticketify.RevenueWithdrawn.handlerWithLoader as any;

export const Ticketify_PlatformFeesWithdrawn_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_Ticketify_PlatformFeesWithdrawn_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_Ticketify_PlatformFeesWithdrawn_eventFilters>> = HandlersJS.Ticketify.PlatformFeesWithdrawn.contractRegister as any;

export const Ticketify_PlatformFeesWithdrawn_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_PlatformFeesWithdrawn_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_Ticketify_PlatformFeesWithdrawn_eventFilters>> = HandlersJS.Ticketify.PlatformFeesWithdrawn.handler as any;

export const Ticketify_PlatformFeesWithdrawn_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_Ticketify_PlatformFeesWithdrawn_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_PlatformFeesWithdrawn_event,Types_handlerContext,loaderReturn>>,Types_Ticketify_PlatformFeesWithdrawn_eventFilters>) => void = HandlersJS.Ticketify.PlatformFeesWithdrawn.handlerWithLoader as any;

/** Register a Block Handler. It'll be called for every block by default. */
export const onBlock: (_1:Envio_onBlockOptions<Types_chain>, _2:((_1:Envio_onBlockArgs<Types_handlerContext>) => Promise<void>)) => void = HandlersJS.onBlock as any;

export const Ticketify: {
  EventCreated: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_Ticketify_EventCreated_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_EventCreated_event,Types_handlerContext,loaderReturn>>,Types_Ticketify_EventCreated_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_EventCreated_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_Ticketify_EventCreated_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_Ticketify_EventCreated_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_Ticketify_EventCreated_eventFilters>>
  }; 
  TicketPurchased: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_Ticketify_TicketPurchased_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_TicketPurchased_event,Types_handlerContext,loaderReturn>>,Types_Ticketify_TicketPurchased_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_TicketPurchased_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_Ticketify_TicketPurchased_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_Ticketify_TicketPurchased_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_Ticketify_TicketPurchased_eventFilters>>
  }; 
  PlatformFeesWithdrawn: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_Ticketify_PlatformFeesWithdrawn_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_PlatformFeesWithdrawn_event,Types_handlerContext,loaderReturn>>,Types_Ticketify_PlatformFeesWithdrawn_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_PlatformFeesWithdrawn_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_Ticketify_PlatformFeesWithdrawn_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_Ticketify_PlatformFeesWithdrawn_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_Ticketify_PlatformFeesWithdrawn_eventFilters>>
  }; 
  RevenueWithdrawn: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_Ticketify_RevenueWithdrawn_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_RevenueWithdrawn_event,Types_handlerContext,loaderReturn>>,Types_Ticketify_RevenueWithdrawn_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_Ticketify_RevenueWithdrawn_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_Ticketify_RevenueWithdrawn_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_Ticketify_RevenueWithdrawn_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_Ticketify_RevenueWithdrawn_eventFilters>>
  }
} = HandlersJS.Ticketify as any;
