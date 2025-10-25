import {
  Ticketify,
  Event,
  TicketPurchase,
  RevenueWithdrawal,
  PlatformFeeWithdrawal,
} from "../generated";

// Backend webhook URL (configure via environment variable)
// const BACKEND_URL = process.env.BACKEND_WEBHOOK_URL || 'http://localhost:5001';
const BACKEND_URL = 'https://ticketify-xq4o.onrender.com';

/**
 * Helper function to call backend webhook
 */
async function callWebhook(endpoint: string, data: any) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/webhooks/envio/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Webhook failed: ${response.status} - ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling webhook ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Handler for EventCreated
 * Logs event creation on blockchain
 */
Ticketify.EventCreated.handler(async ({ event, context }) => {
  const entity: Event = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    contractEventId: event.params.eventId.toString(),
    organizer: event.params.organizer.toLowerCase(),
    price: event.params.price,
    maxAttendees: event.params.maxAttendees,
    eventTime: event.params.eventTime,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash.toLowerCase(),
  };

  context.Event.set(entity);
  
  context.log.info(
    `📅 EventCreated: Event ID ${entity.contractEventId} by ${entity.organizer}, Tx ${entity.transactionHash}`
  );

  // Call backend webhook for logging
  try {
    await callWebhook('event-created', {
      eventId: entity.contractEventId,
      organizer: entity.organizer,
      price: entity.price.toString(),
      maxAttendees: entity.maxAttendees.toString(),
      eventTime: entity.eventTime.toString(),
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      transactionHash: entity.transactionHash,
    });
    context.log.info(`✅ Webhook called for EventCreated`);
  } catch (error) {
    context.log.error(`❌ Webhook failed for EventCreated: ${error}`);
    // Don't throw - indexing should continue even if webhook fails
  }
});

/**
 * Handler for TicketPurchased
 * THIS IS THE CRITICAL HANDLER - processes ticket and adds to calendar via webhook
 */
Ticketify.TicketPurchased.handler(async ({ event, context }) => {
  const entity: TicketPurchase = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    eventId: event.params.eventId.toString(),
    buyer: event.params.buyer.toLowerCase(),
    price: event.params.price,
    timestamp: event.params.timestamp,
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash.toLowerCase(),
  };

  context.TicketPurchase.set(entity);
  
  context.log.info(
    `🎫 TicketPurchased: Event ${entity.eventId}, Buyer ${entity.buyer}, Tx ${entity.transactionHash}`
  );

  // Call backend webhook to process ticket (update DB + add to Google Calendar)
  try {
    const result = await callWebhook('ticket-purchased', {
      eventId: entity.eventId,
      buyer: entity.buyer,
      transactionHash: entity.transactionHash,
      price: entity.price.toString(),
      timestamp: entity.timestamp.toString(),
      blockNumber: event.block.number,
    });
    
    context.log.info(`✅ Webhook processed: ${result.message}`);
  } catch (error) {
    context.log.error(`❌ Webhook failed for TicketPurchased: ${error}`);
    // Don't throw - indexing should continue even if webhook fails
  }
});

/**
 * Handler for RevenueWithdrawn
 * Logs revenue withdrawal events
 */
Ticketify.RevenueWithdrawn.handler(async ({ event, context }) => {
  const entity: RevenueWithdrawal = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    eventId: event.params.eventId.toString(),
    organizer: event.params.organizer.toLowerCase(),
    amount: event.params.amount,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash.toLowerCase(),
  };

  context.RevenueWithdrawal.set(entity);
  
  context.log.info(
    `💰 RevenueWithdrawn: Event ${entity.eventId}, Amount ${entity.amount}, Tx ${entity.transactionHash}`
  );

  // Call backend webhook for logging
  try {
    await callWebhook('revenue-withdrawn', {
      eventId: entity.eventId,
      organizer: entity.organizer,
      amount: entity.amount.toString(),
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      transactionHash: entity.transactionHash,
    });
    context.log.info(`✅ Webhook called for RevenueWithdrawn`);
  } catch (error) {
    context.log.error(`❌ Webhook failed for RevenueWithdrawn: ${error}`);
  }
});

/**
 * Handler for PlatformFeesWithdrawn
 * Logs platform fee withdrawal events
 */
Ticketify.PlatformFeesWithdrawn.handler(async ({ event, context }) => {
  const entity: PlatformFeeWithdrawal = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    owner: event.params.owner.toLowerCase(),
    amount: event.params.amount,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash.toLowerCase(),
  };

  context.PlatformFeeWithdrawal.set(entity);
  
  context.log.info(
    `💵 PlatformFeesWithdrawn: Owner ${entity.owner}, Amount ${entity.amount}, Tx ${entity.transactionHash}`
  );

  // Call backend webhook for logging
  try {
    await callWebhook('platform-fees-withdrawn', {
      owner: entity.owner,
      amount: entity.amount.toString(),
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      transactionHash: entity.transactionHash,
    });
    context.log.info(`✅ Webhook called for PlatformFeesWithdrawn`);
  } catch (error) {
    context.log.error(`❌ Webhook failed for PlatformFeesWithdrawn: ${error}`);
  }
});

