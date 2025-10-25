  @genType
module Ticketify = {
  module EventCreated = Types.MakeRegister(Types.Ticketify.EventCreated)
  module TicketPurchased = Types.MakeRegister(Types.Ticketify.TicketPurchased)
  module RevenueWithdrawn = Types.MakeRegister(Types.Ticketify.RevenueWithdrawn)
  module PlatformFeesWithdrawn = Types.MakeRegister(Types.Ticketify.PlatformFeesWithdrawn)
}

@genType /** Register a Block Handler. It'll be called for every block by default. */
let onBlock: (
  Envio.onBlockOptions<Types.chain>,
  Envio.onBlockArgs<Types.handlerContext> => promise<unit>,
) => unit = (
  EventRegister.onBlock: (unknown, Internal.onBlockArgs => promise<unit>) => unit
)->Utils.magic
