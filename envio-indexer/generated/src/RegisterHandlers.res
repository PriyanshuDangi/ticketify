@val external require: string => unit = "require"

let registerContractHandlers = (
  ~contractName,
  ~handlerPathRelativeToRoot,
  ~handlerPathRelativeToConfig,
) => {
  try {
    require(`../${Path.relativePathToRootFromGenerated}/${handlerPathRelativeToRoot}`)
  } catch {
  | exn =>
    let params = {
      "Contract Name": contractName,
      "Expected Handler Path": handlerPathRelativeToConfig,
      "Code": "EE500",
    }
    let logger = Logging.createChild(~params)

    let errHandler = exn->ErrorHandling.make(~msg="Failed to import handler file", ~logger)
    errHandler->ErrorHandling.log
    errHandler->ErrorHandling.raiseExn
  }
}

let makeGeneratedConfig = () => {
  let chains = [
    {
      let contracts = [
        {
          InternalConfig.name: "Ticketify",
          abi: Types.Ticketify.abi,
          addresses: [
            "0x1Cc7FA86240F105aa1F1fa9F795f9530c881b12E"->Address.Evm.fromStringOrThrow
,
          ],
          events: [
            (Types.Ticketify.EventCreated.register() :> Internal.eventConfig),
            (Types.Ticketify.TicketPurchased.register() :> Internal.eventConfig),
            (Types.Ticketify.RevenueWithdrawn.register() :> Internal.eventConfig),
            (Types.Ticketify.PlatformFeesWithdrawn.register() :> Internal.eventConfig),
          ],
          startBlock: None,
        },
      ]
      let chain = ChainMap.Chain.makeUnsafe(~chainId=11155111)
      {
        InternalConfig.maxReorgDepth: 200,
        startBlock: 9465205,
        id: 11155111,
        contracts,
        sources: NetworkSources.evm(~chain, ~contracts=[{name: "Ticketify",events: [Types.Ticketify.EventCreated.register(), Types.Ticketify.TicketPurchased.register(), Types.Ticketify.RevenueWithdrawn.register(), Types.Ticketify.PlatformFeesWithdrawn.register()],abi: Types.Ticketify.abi}], ~hyperSync=Some("https://11155111.hypersync.xyz"), ~allEventSignatures=[Types.Ticketify.eventSignatures]->Belt.Array.concatMany, ~shouldUseHypersyncClientDecoder=true, ~rpcs=[], ~lowercaseAddresses=false)
      }
    },
  ]

  Config.make(
    ~shouldRollbackOnReorg=true,
    ~shouldSaveFullHistory=false,
    ~isUnorderedMultichainMode=false,
    ~chains,
    ~enableRawEvents=false,
    ~batchSize=?Env.batchSize,
    ~preloadHandlers=false,
    ~lowercaseAddresses=false,
    ~shouldUseHypersyncClientDecoder=true,
  )
}

%%private(
  let config: ref<option<Config.t>> = ref(None)
)

let registerAllHandlers = () => {
  let configWithoutRegistrations = makeGeneratedConfig()
  EventRegister.startRegistration(
    ~ecosystem=configWithoutRegistrations.ecosystem,
    ~multichain=configWithoutRegistrations.multichain,
    ~preloadHandlers=configWithoutRegistrations.preloadHandlers,
  )

  registerContractHandlers(
    ~contractName="Ticketify",
    ~handlerPathRelativeToRoot="src/EventHandlers.ts",
    ~handlerPathRelativeToConfig="src/EventHandlers.ts",
  )

  let generatedConfig = {
    // Need to recreate initial config one more time,
    // since configWithoutRegistrations called register for event
    // before they were ready
    ...makeGeneratedConfig(),
    registrations: Some(EventRegister.finishRegistration()),
  }
  config := Some(generatedConfig)
  generatedConfig
}

let getConfig = () => {
  switch config.contents {
  | Some(config) => config
  | None => registerAllHandlers()
  }
}

let getConfigWithoutRegistrations = makeGeneratedConfig
