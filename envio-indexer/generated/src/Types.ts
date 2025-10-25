// This file is to dynamically generate TS types
// which we can't get using GenType
// Use @genType.import to link the types back to ReScript code

import type { Logger, EffectCaller } from "envio";
import type * as Entities from "./db/Entities.gen.ts";

export type LoaderContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * True when the handlers run in preload mode - in parallel for the whole batch.
   * Handlers run twice per batch of events, and the first time is the "preload" run
   * During preload entities aren't set, logs are ignored and exceptions are silently swallowed.
   * Preload mode is the best time to populate data to in-memory cache.
   * After preload the handler will run for the second time in sequential order of events.
   */
  readonly isPreload: boolean;
  /**
   * Per-chain state information accessible in event handlers and block handlers.
   * Each chain ID maps to an object containing chain-specific state:
   * - isReady: true when the chain has completed initial sync and is processing live events,
   *            false during historical synchronization
   */
  readonly chains: {
    [chainId: string]: {
      readonly isReady: boolean;
    };
  };
  readonly Event: {
    /**
     * Load the entity Event from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Event_t | undefined>,
    /**
     * Load the entity Event from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Event_t>,
    readonly getWhere: Entities.Event_indexedFieldOperations,
    /**
     * Returns the entity Event from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Event_t) => Promise<Entities.Event_t>,
    /**
     * Set the entity Event in the storage.
     */
    readonly set: (entity: Entities.Event_t) => void,
    /**
     * Delete the entity Event from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly PlatformFeeWithdrawal: {
    /**
     * Load the entity PlatformFeeWithdrawal from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.PlatformFeeWithdrawal_t | undefined>,
    /**
     * Load the entity PlatformFeeWithdrawal from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.PlatformFeeWithdrawal_t>,
    readonly getWhere: Entities.PlatformFeeWithdrawal_indexedFieldOperations,
    /**
     * Returns the entity PlatformFeeWithdrawal from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.PlatformFeeWithdrawal_t) => Promise<Entities.PlatformFeeWithdrawal_t>,
    /**
     * Set the entity PlatformFeeWithdrawal in the storage.
     */
    readonly set: (entity: Entities.PlatformFeeWithdrawal_t) => void,
    /**
     * Delete the entity PlatformFeeWithdrawal from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly RevenueWithdrawal: {
    /**
     * Load the entity RevenueWithdrawal from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.RevenueWithdrawal_t | undefined>,
    /**
     * Load the entity RevenueWithdrawal from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.RevenueWithdrawal_t>,
    readonly getWhere: Entities.RevenueWithdrawal_indexedFieldOperations,
    /**
     * Returns the entity RevenueWithdrawal from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.RevenueWithdrawal_t) => Promise<Entities.RevenueWithdrawal_t>,
    /**
     * Set the entity RevenueWithdrawal in the storage.
     */
    readonly set: (entity: Entities.RevenueWithdrawal_t) => void,
    /**
     * Delete the entity RevenueWithdrawal from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly TicketPurchase: {
    /**
     * Load the entity TicketPurchase from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.TicketPurchase_t | undefined>,
    /**
     * Load the entity TicketPurchase from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.TicketPurchase_t>,
    readonly getWhere: Entities.TicketPurchase_indexedFieldOperations,
    /**
     * Returns the entity TicketPurchase from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.TicketPurchase_t) => Promise<Entities.TicketPurchase_t>,
    /**
     * Set the entity TicketPurchase in the storage.
     */
    readonly set: (entity: Entities.TicketPurchase_t) => void,
    /**
     * Delete the entity TicketPurchase from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};

export type HandlerContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * Per-chain state information accessible in event handlers and block handlers.
   * Each chain ID maps to an object containing chain-specific state:
   * - isReady: true when the chain has completed initial sync and is processing live events,
   *            false during historical synchronization
   */
  readonly chains: {
    [chainId: string]: {
      readonly isReady: boolean;
    };
  };
  readonly Event: {
    /**
     * Load the entity Event from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Event_t | undefined>,
    /**
     * Load the entity Event from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Event_t>,
    /**
     * Returns the entity Event from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Event_t) => Promise<Entities.Event_t>,
    /**
     * Set the entity Event in the storage.
     */
    readonly set: (entity: Entities.Event_t) => void,
    /**
     * Delete the entity Event from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly PlatformFeeWithdrawal: {
    /**
     * Load the entity PlatformFeeWithdrawal from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.PlatformFeeWithdrawal_t | undefined>,
    /**
     * Load the entity PlatformFeeWithdrawal from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.PlatformFeeWithdrawal_t>,
    /**
     * Returns the entity PlatformFeeWithdrawal from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.PlatformFeeWithdrawal_t) => Promise<Entities.PlatformFeeWithdrawal_t>,
    /**
     * Set the entity PlatformFeeWithdrawal in the storage.
     */
    readonly set: (entity: Entities.PlatformFeeWithdrawal_t) => void,
    /**
     * Delete the entity PlatformFeeWithdrawal from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly RevenueWithdrawal: {
    /**
     * Load the entity RevenueWithdrawal from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.RevenueWithdrawal_t | undefined>,
    /**
     * Load the entity RevenueWithdrawal from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.RevenueWithdrawal_t>,
    /**
     * Returns the entity RevenueWithdrawal from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.RevenueWithdrawal_t) => Promise<Entities.RevenueWithdrawal_t>,
    /**
     * Set the entity RevenueWithdrawal in the storage.
     */
    readonly set: (entity: Entities.RevenueWithdrawal_t) => void,
    /**
     * Delete the entity RevenueWithdrawal from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly TicketPurchase: {
    /**
     * Load the entity TicketPurchase from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.TicketPurchase_t | undefined>,
    /**
     * Load the entity TicketPurchase from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.TicketPurchase_t>,
    /**
     * Returns the entity TicketPurchase from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.TicketPurchase_t) => Promise<Entities.TicketPurchase_t>,
    /**
     * Set the entity TicketPurchase in the storage.
     */
    readonly set: (entity: Entities.TicketPurchase_t) => void,
    /**
     * Delete the entity TicketPurchase from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};
