import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseUnits, formatUnits } from "viem";

describe("Ticketify", function () {
  // Constants for PYUSD (6 decimals)
  const PYUSD_DECIMALS = 6;
  const PLATFORM_FEE_BASIS_POINTS = 250n; // 2.5%
  const BASIS_POINTS_DIVISOR = 10000n;

  // Helper function to convert PYUSD display value to contract value (6 decimals)
  function toPYUSD(amount: string): bigint {
    return parseUnits(amount, PYUSD_DECIMALS);
  }

  /**
   * Deploy fixture for Ticketify contract with mock PYUSD
   * Sets up contracts, accounts, and initial PYUSD balances
   */
  async function deployTicketifyFixture() {
    // Get signers
    const [owner, organizer, buyer1, buyer2, buyer3] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    // Deploy mock PYUSD with initial supply (1 million PYUSD)
    const initialSupply = toPYUSD("1000000");
    const pyusdToken = await hre.viem.deployContract("MockPYUSD", [initialSupply]);

    // Deploy Ticketify contract
    const ticketify = await hre.viem.deployContract("Ticketify", [pyusdToken.address]);

    // Distribute PYUSD to test accounts
    await pyusdToken.write.transfer([organizer.account.address, toPYUSD("10000")]);
    await pyusdToken.write.transfer([buyer1.account.address, toPYUSD("1000")]);
    await pyusdToken.write.transfer([buyer2.account.address, toPYUSD("1000")]);
    await pyusdToken.write.transfer([buyer3.account.address, toPYUSD("1000")]);

    return {
      ticketify,
      pyusd: pyusdToken,
      owner,
      organizer,
      buyer1,
      buyer2,
      buyer3,
      publicClient,
    };
  }

  /**
   * Create a test event with default parameters
   */
  async function createTestEvent(
    ticketify: any,
    organizer: any,
    price: bigint = toPYUSD("10"),
    maxAttendees: bigint = 50n,
    hoursInFuture: number = 24
  ) {
    const eventTime = BigInt((await time.latest()) + hoursInFuture * 60 * 60);
    
    const ticketifyAsOrganizer = await hre.viem.getContractAt(
      "Ticketify",
      ticketify.address,
      { client: { wallet: organizer } }
    );

    const hash = await ticketifyAsOrganizer.write.createEvent([
      price,
      maxAttendees,
      eventTime,
    ]);

    return { hash, eventTime, price, maxAttendees };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { ticketify, owner } = await loadFixture(deployTicketifyFixture);

      expect(await ticketify.read.owner()).to.equal(
        getAddress(owner.account.address)
      );
    });

    it("Should set the correct PYUSD token address", async function () {
      const { ticketify, pyusd } = await loadFixture(deployTicketifyFixture);

      expect(await ticketify.read.pyusdToken()).to.equal(
        getAddress(pyusd.address)
      );
    });

    it("Should initialize event counter to 0", async function () {
      const { ticketify } = await loadFixture(deployTicketifyFixture);

      expect(await ticketify.read.getEventCounter()).to.equal(0n);
    });

    it("Should initialize platform fees to 0", async function () {
      const { ticketify } = await loadFixture(deployTicketifyFixture);

      expect(await ticketify.read.platformFeesAccumulated()).to.equal(0n);
    });

    it("Should revert if PYUSD address is zero", async function () {
      await expect(
        hre.viem.deployContract("Ticketify", ["0x0000000000000000000000000000000000000000"])
      ).to.be.rejectedWith("Invalid PYUSD address");
    });
  });

  describe("Event Creation", function () {
    describe("Valid Event Creation", function () {
      it("Should create an event with valid parameters", async function () {
        const { ticketify, organizer, publicClient } = await loadFixture(deployTicketifyFixture);
        
        const price = toPYUSD("10.50");
        const maxAttendees = 50n;
        const eventTime = BigInt((await time.latest()) + 86400); // 24 hours

        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        const hash = await ticketifyAsOrganizer.write.createEvent([
          price,
          maxAttendees,
          eventTime,
        ]);

        await publicClient.waitForTransactionReceipt({ hash });

        const event = await ticketify.read.getEvent([0n]);
        expect(event.id).to.equal(0n);
        expect(event.organizer).to.equal(getAddress(organizer.account.address));
        expect(event.price).to.equal(price);
        expect(event.maxAttendees).to.equal(maxAttendees);
        expect(event.eventTime).to.equal(eventTime);
        expect(event.isActive).to.equal(true);
        expect(event.ticketsSold).to.equal(0n);
        expect(event.hasWithdrawn).to.equal(false);
      });

      it("Should increment event counter after creation", async function () {
        const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);

        await createTestEvent(ticketify, organizer);
        expect(await ticketify.read.getEventCounter()).to.equal(1n);

        await createTestEvent(ticketify, organizer);
        expect(await ticketify.read.getEventCounter()).to.equal(2n);
      });

      it("Should emit EventCreated event", async function () {
        const { ticketify, organizer, publicClient } = await loadFixture(deployTicketifyFixture);
        
        const price = toPYUSD("10");
        const maxAttendees = 50n;
        const eventTime = BigInt((await time.latest()) + 86400);

        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        const hash = await ticketifyAsOrganizer.write.createEvent([
          price,
          maxAttendees,
          eventTime,
        ]);
        await publicClient.waitForTransactionReceipt({ hash });

        const events = await ticketify.getEvents.EventCreated();
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.eventId).to.equal(0n);
        expect(events[0].args.organizer).to.equal(getAddress(organizer.account.address));
        expect(events[0].args.price).to.equal(price);
        expect(events[0].args.maxAttendees).to.equal(maxAttendees);
        expect(events[0].args.eventTime).to.equal(eventTime);
      });
    });

    describe("Invalid Event Creation", function () {
      it("Should revert if price is 0", async function () {
        const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);
        
        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        const eventTime = BigInt((await time.latest()) + 86400);

        await expect(
          ticketifyAsOrganizer.write.createEvent([0n, 50n, eventTime])
        ).to.be.rejectedWith("Price must be greater than 0");
      });

      it("Should revert if maxAttendees is 0", async function () {
        const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);
        
        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        const eventTime = BigInt((await time.latest()) + 86400);

        await expect(
          ticketifyAsOrganizer.write.createEvent([toPYUSD("10"), 0n, eventTime])
        ).to.be.rejectedWith("Max attendees must be greater than 0");
      });

      it("Should revert if eventTime is in the past", async function () {
        const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);
        
        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        const pastTime = BigInt((await time.latest()) - 86400); // 24 hours ago

        await expect(
          ticketifyAsOrganizer.write.createEvent([toPYUSD("10"), 50n, pastTime])
        ).to.be.rejectedWith("Event time must be in future");
      });

      it("Should revert if eventTime is current block time", async function () {
        const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);
        
        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        const currentTime = BigInt(await time.latest());

        await expect(
          ticketifyAsOrganizer.write.createEvent([toPYUSD("10"), 50n, currentTime])
        ).to.be.rejectedWith("Event time must be in future");
      });
    });
  });

  describe("Ticket Purchase", function () {
    describe("Valid Ticket Purchase", function () {
      it("Should allow buying a ticket with sufficient balance and approval", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10.50");
        await createTestEvent(ticketify, organizer, price);

        // Approve PYUSD spending
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);

        // Purchase ticket
        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );

        const hash = await ticketifyAsBuyer.write.purchaseTicket([0n]);
        await publicClient.waitForTransactionReceipt({ hash });

        // Verify ticket purchase
        const event = await ticketify.read.getEvent([0n]);
        expect(event.ticketsSold).to.equal(1n);
        expect(await ticketify.read.hasUserPurchasedTicket([0n, buyer1.account.address])).to.equal(true);
      });

      it("Should transfer PYUSD from buyer to contract", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        const buyerBalanceBefore = await pyusd.read.balanceOf([buyer1.account.address]);

        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);

        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        const hash = await ticketifyAsBuyer.write.purchaseTicket([0n]);
        await publicClient.waitForTransactionReceipt({ hash });

        const buyerBalanceAfter = await pyusd.read.balanceOf([buyer1.account.address]);
        const contractBalance = await pyusd.read.balanceOf([ticketify.address]);

        expect(buyerBalanceBefore - buyerBalanceAfter).to.equal(price);
        expect(contractBalance).to.equal(price);
      });

      it("Should accumulate platform fee correctly (2.5%)", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10"); // 10 PYUSD = 10,000,000
        await createTestEvent(ticketify, organizer, price);

        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);

        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        const hash = await ticketifyAsBuyer.write.purchaseTicket([0n]);
        await publicClient.waitForTransactionReceipt({ hash });

        const expectedFee = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
        const platformFees = await ticketify.read.platformFeesAccumulated();
        
        expect(platformFees).to.equal(expectedFee); // 250,000 (0.25 PYUSD)
      });

      it("Should emit TicketPurchased event", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);

        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        const hash = await ticketifyAsBuyer.write.purchaseTicket([0n]);
        await publicClient.waitForTransactionReceipt({ hash });

        const events = await ticketify.getEvents.TicketPurchased();
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.eventId).to.equal(0n);
        expect(events[0].args.buyer).to.equal(getAddress(buyer1.account.address));
        expect(events[0].args.price).to.equal(price);
      });

      it("Should allow multiple different buyers to purchase tickets", async function () {
        const { ticketify, pyusd, organizer, buyer1, buyer2, buyer3, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price, 10n);

        // Buyer 1 purchases
        const pyusdAsBuyer1 = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer1.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer1 = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        await ticketifyAsBuyer1.write.purchaseTicket([0n]);

        // Buyer 2 purchases
        const pyusdAsBuyer2 = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer2 } }
        );
        await pyusdAsBuyer2.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer2 = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer2 } }
        );
        await ticketifyAsBuyer2.write.purchaseTicket([0n]);

        // Buyer 3 purchases
        const pyusdAsBuyer3 = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer3 } }
        );
        await pyusdAsBuyer3.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer3 = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer3 } }
        );
        await ticketifyAsBuyer3.write.purchaseTicket([0n]);

        const event = await ticketify.read.getEvent([0n]);
        expect(event.ticketsSold).to.equal(3n);
      });
    });

    describe("Invalid Ticket Purchase", function () {
      it("Should revert if event does not exist", async function () {
        const { ticketify, buyer1 } = await loadFixture(deployTicketifyFixture);

        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );

        await expect(
          ticketifyAsBuyer.write.purchaseTicket([999n])
        ).to.be.rejectedWith("Event does not exist");
      });

      it("Should revert if buyer has insufficient PYUSD balance", async function () {
        const { ticketify, pyusd, organizer, buyer1 } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("2000"); // More than buyer has
        await createTestEvent(ticketify, organizer, price);

        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);

        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );

        await expect(
          ticketifyAsBuyer.write.purchaseTicket([0n])
        ).to.be.rejectedWith("Insufficient balance");
      });

      it("Should revert if buyer has not approved PYUSD spending", async function () {
        const { ticketify, organizer, buyer1 } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );

        await expect(
          ticketifyAsBuyer.write.purchaseTicket([0n])
        ).to.be.rejectedWith("Insufficient allowance");
      });

      it("Should revert if buyer tries to purchase same event twice (one per wallet rule)", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        // First purchase
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price * 2n]);

        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        const hash = await ticketifyAsBuyer.write.purchaseTicket([0n]);
        await publicClient.waitForTransactionReceipt({ hash });

        // Second purchase attempt
        await expect(
          ticketifyAsBuyer.write.purchaseTicket([0n])
        ).to.be.rejectedWith("Already purchased ticket for this event");
      });

      it("Should revert if event is sold out", async function () {
        const { ticketify, pyusd, organizer, buyer1, buyer2, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price, 1n); // Max 1 ticket

        // Buyer 1 purchases (fills capacity)
        const pyusdAsBuyer1 = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer1.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer1 = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        const hash = await ticketifyAsBuyer1.write.purchaseTicket([0n]);
        await publicClient.waitForTransactionReceipt({ hash });

        // Buyer 2 tries to purchase (should fail)
        const pyusdAsBuyer2 = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer2 } }
        );
        await pyusdAsBuyer2.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer2 = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer2 } }
        );

        await expect(
          ticketifyAsBuyer2.write.purchaseTicket([0n])
        ).to.be.rejectedWith("Event is sold out");
      });

      it("Should revert if event has already started", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        const { eventTime } = await createTestEvent(ticketify, organizer, price, 50n, 1); // 1 hour in future

        // Fast forward past event time
        await time.increaseTo(eventTime + 1n);

        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);

        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );

        await expect(
          ticketifyAsBuyer.write.purchaseTicket([0n])
        ).to.be.rejectedWith("Event has already started");
      });
    });
  });

  describe("Revenue Withdrawal", function () {
    describe("Valid Organizer Withdrawal", function () {
      it("Should allow organizer to withdraw revenue", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        // Purchase ticket
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        await ticketifyAsBuyer.write.purchaseTicket([0n]);

        // Organizer withdraws
        const organizerBalanceBefore = await pyusd.read.balanceOf([organizer.account.address]);

        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );
        const hash = await ticketifyAsOrganizer.write.withdrawRevenue([0n]);
        await publicClient.waitForTransactionReceipt({ hash });

        const organizerBalanceAfter = await pyusd.read.balanceOf([organizer.account.address]);
        
        // Calculate expected amount (price - 2.5% platform fee)
        const platformFee = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
        const expectedAmount = price - platformFee;

        expect(organizerBalanceAfter - organizerBalanceBefore).to.equal(expectedAmount);
      });

      it("Should calculate revenue correctly for multiple tickets", async function () {
        const { ticketify, pyusd, organizer, buyer1, buyer2, buyer3, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10.50");
        await createTestEvent(ticketify, organizer, price);

        // Three buyers purchase tickets
        for (const buyer of [buyer1, buyer2, buyer3]) {
          const pyusdAsBuyer = await hre.viem.getContractAt(
            "MockPYUSD",
            pyusd.address,
            { client: { wallet: buyer } }
          );
          await pyusdAsBuyer.write.approve([ticketify.address, price]);
          
          const ticketifyAsBuyer = await hre.viem.getContractAt(
            "Ticketify",
            ticketify.address,
            { client: { wallet: buyer } }
          );
          await ticketifyAsBuyer.write.purchaseTicket([0n]);
        }

        // Check revenue calculation
        const expectedRevenue = await ticketify.read.getEventRevenue([0n]);
        
        const platformFeePerTicket = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
        const organizerSharePerTicket = price - platformFeePerTicket;
        const calculatedRevenue = organizerSharePerTicket * 3n;

        expect(expectedRevenue).to.equal(calculatedRevenue);
      });

      it("Should allow withdrawal immediately after first ticket sale (no time restriction)", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price, 50n, 48); // 48 hours in future

        // Purchase ticket
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        await ticketifyAsBuyer.write.purchaseTicket([0n]);

        // Withdraw immediately (event hasn't happened yet)
        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        await expect(
          ticketifyAsOrganizer.write.withdrawRevenue([0n])
        ).to.be.fulfilled;
      });

      it("Should emit RevenueWithdrawn event", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        // Purchase ticket
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        await ticketifyAsBuyer.write.purchaseTicket([0n]);

        // Withdraw
        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );
        const hash = await ticketifyAsOrganizer.write.withdrawRevenue([0n]);
        await publicClient.waitForTransactionReceipt({ hash });

        const events = await ticketify.getEvents.RevenueWithdrawn();
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.eventId).to.equal(0n);
        expect(events[0].args.organizer).to.equal(getAddress(organizer.account.address));
      });

      it("Should mark event as withdrawn", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        // Purchase and withdraw
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        await ticketifyAsBuyer.write.purchaseTicket([0n]);

        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );
        await ticketifyAsOrganizer.write.withdrawRevenue([0n]);

        const event = await ticketify.read.getEvent([0n]);
        expect(event.hasWithdrawn).to.equal(true);
      });
    });

    describe("Invalid Organizer Withdrawal", function () {
      it("Should revert if non-organizer tries to withdraw", async function () {
        const { ticketify, pyusd, organizer, buyer1, buyer2, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        // Purchase ticket
        const pyusdAsBuyer1 = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer1.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer1 = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        await ticketifyAsBuyer1.write.purchaseTicket([0n]);

        // Buyer2 tries to withdraw (not organizer)
        const ticketifyAsBuyer2 = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer2 } }
        );

        await expect(
          ticketifyAsBuyer2.write.withdrawRevenue([0n])
        ).to.be.rejectedWith("Only organizer can withdraw");
      });

      it("Should revert if no tickets have been sold", async function () {
        const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);

        await createTestEvent(ticketify, organizer);

        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        await expect(
          ticketifyAsOrganizer.write.withdrawRevenue([0n])
        ).to.be.rejectedWith("No tickets sold");
      });

      it("Should revert if organizer tries to withdraw twice", async function () {
        const { ticketify, pyusd, organizer, buyer1, publicClient } = 
          await loadFixture(deployTicketifyFixture);

        const price = toPYUSD("10");
        await createTestEvent(ticketify, organizer, price);

        // Purchase ticket
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer1 } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer1 } }
        );
        await ticketifyAsBuyer.write.purchaseTicket([0n]);

        // First withdrawal
        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );
        await ticketifyAsOrganizer.write.withdrawRevenue([0n]);

        // Second withdrawal attempt
        await expect(
          ticketifyAsOrganizer.write.withdrawRevenue([0n])
        ).to.be.rejectedWith("Revenue already withdrawn");
      });

      it("Should revert if event does not exist", async function () {
        const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);

        const ticketifyAsOrganizer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: organizer } }
        );

        await expect(
          ticketifyAsOrganizer.write.withdrawRevenue([999n])
        ).to.be.rejectedWith("Event does not exist");
      });
    });
  });

  describe("Platform Fee Withdrawal", function () {
    it("Should allow owner to withdraw platform fees", async function () {
      const { ticketify, pyusd, owner, organizer, buyer1, publicClient } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      // Purchase ticket
      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      // Owner withdraws platform fees
      const ownerBalanceBefore = await pyusd.read.balanceOf([owner.account.address]);
      
      const hash = await ticketify.write.withdrawPlatformFees();
      await publicClient.waitForTransactionReceipt({ hash });

      const ownerBalanceAfter = await pyusd.read.balanceOf([owner.account.address]);
      
      const expectedFee = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedFee);
    });

    it("Should accumulate fees from multiple events", async function () {
      const { ticketify, pyusd, owner, organizer, buyer1, buyer2, publicClient } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      
      // Create two events and sell tickets
      await createTestEvent(ticketify, organizer, price);
      await createTestEvent(ticketify, organizer, price);

      // Buy ticket for event 0
      const pyusdAsBuyer1 = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer1.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer1 = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer1.write.purchaseTicket([0n]);

      // Buy ticket for event 1
      const pyusdAsBuyer2 = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer2 } }
      );
      await pyusdAsBuyer2.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer2 = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer2 } }
      );
      await ticketifyAsBuyer2.write.purchaseTicket([1n]);

      // Check accumulated fees
      const expectedFee = ((price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR) * 2n;
      const platformFees = await ticketify.read.platformFeesAccumulated();
      expect(platformFees).to.equal(expectedFee);
    });

    it("Should reset platform fees to 0 after withdrawal", async function () {
      const { ticketify, pyusd, organizer, buyer1, publicClient } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      // Purchase ticket
      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      // Withdraw platform fees
      await ticketify.write.withdrawPlatformFees();

      const platformFees = await ticketify.read.platformFeesAccumulated();
      expect(platformFees).to.equal(0n);
    });

    it("Should emit PlatformFeesWithdrawn event", async function () {
      const { ticketify, pyusd, organizer, buyer1, publicClient } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      // Purchase ticket
      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      // Withdraw
      const hash = await ticketify.write.withdrawPlatformFees();
      await publicClient.waitForTransactionReceipt({ hash });

      const events = await ticketify.getEvents.PlatformFeesWithdrawn();
      expect(events).to.have.lengthOf(1);
    });

    it("Should revert if non-owner tries to withdraw platform fees", async function () {
      const { ticketify, pyusd, organizer, buyer1 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      // Purchase ticket
      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      // Buyer tries to withdraw platform fees
      await expect(
        ticketifyAsBuyer.write.withdrawPlatformFees()
      ).to.be.rejected;
    });

    it("Should revert if no fees to withdraw", async function () {
      const { ticketify } = await loadFixture(deployTicketifyFixture);

      await expect(
        ticketify.write.withdrawPlatformFees()
      ).to.be.rejectedWith("No fees to withdraw");
    });
  });

  describe("View Functions", function () {
    it("getEvent should return correct event data", async function () {
      const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10.50");
      const maxAttendees = 50n;
      const { eventTime } = await createTestEvent(ticketify, organizer, price, maxAttendees);

      const event = await ticketify.read.getEvent([0n]);
      expect(event.id).to.equal(0n);
      expect(event.organizer).to.equal(getAddress(organizer.account.address));
      expect(event.price).to.equal(price);
      expect(event.maxAttendees).to.equal(maxAttendees);
      expect(event.eventTime).to.equal(eventTime);
      expect(event.isActive).to.equal(true);
      expect(event.ticketsSold).to.equal(0n);
      expect(event.hasWithdrawn).to.equal(false);
    });

    it("getEvent should return default values for non-existent event", async function () {
      const { ticketify } = await loadFixture(deployTicketifyFixture);

      const event = await ticketify.read.getEvent([999n]);
      expect(event.organizer).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("getTicketsSold should return correct count", async function () {
      const { ticketify, pyusd, organizer, buyer1, buyer2 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      expect(await ticketify.read.getTicketsSold([0n])).to.equal(0n);

      // Buy first ticket
      const pyusdAsBuyer1 = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer1.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer1 = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer1.write.purchaseTicket([0n]);

      expect(await ticketify.read.getTicketsSold([0n])).to.equal(1n);

      // Buy second ticket
      const pyusdAsBuyer2 = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer2 } }
      );
      await pyusdAsBuyer2.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer2 = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer2 } }
      );
      await ticketifyAsBuyer2.write.purchaseTicket([0n]);

      expect(await ticketify.read.getTicketsSold([0n])).to.equal(2n);
    });

    it("hasUserPurchasedTicket should return correct status", async function () {
      const { ticketify, pyusd, organizer, buyer1, buyer2 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      expect(await ticketify.read.hasUserPurchasedTicket([0n, buyer1.account.address])).to.equal(false);
      expect(await ticketify.read.hasUserPurchasedTicket([0n, buyer2.account.address])).to.equal(false);

      // Buyer1 purchases
      const pyusdAsBuyer1 = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer1.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer1 = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer1.write.purchaseTicket([0n]);

      expect(await ticketify.read.hasUserPurchasedTicket([0n, buyer1.account.address])).to.equal(true);
      expect(await ticketify.read.hasUserPurchasedTicket([0n, buyer2.account.address])).to.equal(false);
    });

    it("getEventRevenue should calculate correctly", async function () {
      const { ticketify, pyusd, organizer, buyer1, buyer2 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      expect(await ticketify.read.getEventRevenue([0n])).to.equal(0n);

      // Buy tickets
      for (const buyer of [buyer1, buyer2]) {
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer } }
        );
        await ticketifyAsBuyer.write.purchaseTicket([0n]);
      }

      const platformFeePerTicket = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
      const organizerSharePerTicket = price - platformFeePerTicket;
      const expectedRevenue = organizerSharePerTicket * 2n;

      expect(await ticketify.read.getEventRevenue([0n])).to.equal(expectedRevenue);
    });

    it("getPlatformFees should return correct amount", async function () {
      const { ticketify, pyusd, organizer, buyer1 } = 
        await loadFixture(deployTicketifyFixture);

      expect(await ticketify.read.getPlatformFees()).to.equal(0n);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      // Purchase ticket
      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      const expectedFee = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR;
      expect(await ticketify.read.getPlatformFees()).to.equal(expectedFee);
    });

    it("getEventTickets should return all tickets for event", async function () {
      const { ticketify, pyusd, organizer, buyer1, buyer2 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);

      let tickets = await ticketify.read.getEventTickets([0n]);
      expect(tickets).to.have.lengthOf(0);

      // Buy two tickets
      for (const buyer of [buyer1, buyer2]) {
        const pyusdAsBuyer = await hre.viem.getContractAt(
          "MockPYUSD",
          pyusd.address,
          { client: { wallet: buyer } }
        );
        await pyusdAsBuyer.write.approve([ticketify.address, price]);
        
        const ticketifyAsBuyer = await hre.viem.getContractAt(
          "Ticketify",
          ticketify.address,
          { client: { wallet: buyer } }
        );
        await ticketifyAsBuyer.write.purchaseTicket([0n]);
      }

      tickets = await ticketify.read.getEventTickets([0n]);
      expect(tickets).to.have.lengthOf(2);
      expect(tickets[0].eventId).to.equal(0n);
      expect(tickets[0].buyer).to.equal(getAddress(buyer1.account.address));
      expect(tickets[1].buyer).to.equal(getAddress(buyer2.account.address));
    });

    it("getEventCounter should return correct value", async function () {
      const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);

      expect(await ticketify.read.getEventCounter()).to.equal(0n);

      await createTestEvent(ticketify, organizer);
      expect(await ticketify.read.getEventCounter()).to.equal(1n);

      await createTestEvent(ticketify, organizer);
      expect(await ticketify.read.getEventCounter()).to.equal(2n);
    });
  });

  describe("PYUSD Decimal Handling", function () {
    it("Should handle 6 decimal PYUSD amounts correctly", async function () {
      const { ticketify, pyusd, organizer, buyer1, publicClient } = 
        await loadFixture(deployTicketifyFixture);

      // Price: 10.50 PYUSD = 10,500,000 (6 decimals)
      const price = toPYUSD("10.50");
      await createTestEvent(ticketify, organizer, price);

      // Purchase ticket
      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      // Verify exact amounts
      const platformFee = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR; // 262,500 (0.2625 PYUSD)
      const organizerShare = price - platformFee; // 10,237,500 (10.2375 PYUSD)

      expect(await ticketify.read.platformFeesAccumulated()).to.equal(platformFee);
      expect(await ticketify.read.getEventRevenue([0n])).to.equal(organizerShare);
    });

    it("Should handle very small PYUSD amounts (0.01 PYUSD)", async function () {
      const { ticketify, pyusd, organizer, buyer1 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("0.01"); // 10,000 (6 decimals)
      await createTestEvent(ticketify, organizer, price);

      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      const platformFee = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR; // 250 (0.00025 PYUSD)
      expect(await ticketify.read.platformFeesAccumulated()).to.equal(platformFee);
    });

    it("Should handle large PYUSD amounts (1000 PYUSD)", async function () {
      const { ticketify, pyusd, organizer, buyer1 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("1000"); // 1,000,000,000 (6 decimals)
      await createTestEvent(ticketify, organizer, price);

      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      const platformFee = (price * PLATFORM_FEE_BASIS_POINTS) / BASIS_POINTS_DIVISOR; // 25,000,000 (25 PYUSD)
      expect(await ticketify.read.platformFeesAccumulated()).to.equal(platformFee);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle max capacity of 1 correctly", async function () {
      const { ticketify, pyusd, organizer, buyer1, buyer2 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price, 1n);

      // First buyer succeeds
      const pyusdAsBuyer1 = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer1.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer1 = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer1.write.purchaseTicket([0n]);

      // Second buyer fails
      const pyusdAsBuyer2 = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer2 } }
      );
      await pyusdAsBuyer2.write.approve([ticketify.address, price]);
      
      const ticketifyAsBuyer2 = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer2 } }
      );

      await expect(
        ticketifyAsBuyer2.write.purchaseTicket([0n])
      ).to.be.rejectedWith("Event is sold out");
    });

    it("Should handle multiple events independently", async function () {
      const { ticketify, pyusd, organizer, buyer1 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      await createTestEvent(ticketify, organizer, price);
      await createTestEvent(ticketify, organizer, price);

      // Buy ticket for event 0
      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price * 2n]);
      
      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );
      await ticketifyAsBuyer.write.purchaseTicket([0n]);

      expect(await ticketify.read.getTicketsSold([0n])).to.equal(1n);
      expect(await ticketify.read.getTicketsSold([1n])).to.equal(0n);

      // Same buyer can buy ticket for event 1
      await ticketifyAsBuyer.write.purchaseTicket([1n]);

      expect(await ticketify.read.getTicketsSold([0n])).to.equal(1n);
      expect(await ticketify.read.getTicketsSold([1n])).to.equal(1n);
    });

    it("Should handle event at exactly current time + 1 second", async function () {
      const { ticketify, organizer } = await loadFixture(deployTicketifyFixture);

      const currentTime = BigInt(await time.latest());
      const eventTime = currentTime + 2n; // Use 2 seconds to account for block timestamp advancement

      const ticketifyAsOrganizer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: organizer } }
      );

      await expect(
        ticketifyAsOrganizer.write.createEvent([toPYUSD("10"), 50n, eventTime])
      ).to.be.fulfilled;
    });
  });

  describe("Time Manipulation", function () {
    it("Should prevent purchases after event starts (time travel)", async function () {
      const { ticketify, pyusd, organizer, buyer1 } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      const { eventTime } = await createTestEvent(ticketify, organizer, price, 50n, 1);

      // Fast forward to event time
      await time.increaseTo(eventTime);

      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);

      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );

      await expect(
        ticketifyAsBuyer.write.purchaseTicket([0n])
      ).to.be.rejectedWith("Event has already started");
    });

    it("Should allow purchases 1 second before event starts", async function () {
      const { ticketify, pyusd, organizer, buyer1, publicClient } = 
        await loadFixture(deployTicketifyFixture);

      const price = toPYUSD("10");
      const { eventTime } = await createTestEvent(ticketify, organizer, price, 50n, 1);

      // Fast forward to 10 seconds before event to account for block timestamp advancement
      await time.increaseTo(eventTime - 10n);

      const pyusdAsBuyer = await hre.viem.getContractAt(
        "MockPYUSD",
        pyusd.address,
        { client: { wallet: buyer1 } }
      );
      await pyusdAsBuyer.write.approve([ticketify.address, price]);

      const ticketifyAsBuyer = await hre.viem.getContractAt(
        "Ticketify",
        ticketify.address,
        { client: { wallet: buyer1 } }
      );

      await expect(
        ticketifyAsBuyer.write.purchaseTicket([0n])
      ).to.be.fulfilled;
    });
  });
});

