// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import "./Ticketify.sol";
import "./MockPYUSD.sol";

/**
 * @title TicketifyTest
 * @dev Basic Solidity tests for Ticketify contract using Hardhat 3
 * @notice Uses forge-std Test utilities for assertions
 */
contract TicketifyTest is Test {
    Ticketify public ticketify;
    MockPYUSD public pyusd;
    
    address public owner = address(this);
    address public organizer = address(0x1);
    address public buyer1 = address(0x2);
    address public buyer2 = address(0x3);
    
    uint256 constant INITIAL_SUPPLY = 1_000_000 * 1e6; // 1M PYUSD (6 decimals)
    uint256 constant TICKET_PRICE = 10 * 1e6; // 10 PYUSD
    uint256 constant MAX_ATTENDEES = 100;
    
    function setUp() public {
        // Deploy MockPYUSD
        pyusd = new MockPYUSD(INITIAL_SUPPLY);
        
        // Deploy Ticketify
        ticketify = new Ticketify(address(pyusd));
        
        // Give PYUSD to test accounts
        pyusd.mint(buyer1, 1000 * 1e6); // 1000 PYUSD
        pyusd.mint(buyer2, 1000 * 1e6); // 1000 PYUSD
    }
    
    // ============ Event Creation Tests ============
    
    function testCreateEvent() public {
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        assertEq(eventId, 0, "First event should have ID 0");
        
        Ticketify.Event memory eventData = ticketify.getEvent(eventId);
        assertEq(eventData.organizer, organizer, "Organizer should match");
        assertEq(eventData.price, TICKET_PRICE, "Price should match");
        assertEq(eventData.maxAttendees, MAX_ATTENDEES, "Max attendees should match");
        assertEq(eventData.eventTime, eventTime, "Event time should match");
        assertTrue(eventData.isActive, "Event should be active");
        assertEq(eventData.ticketsSold, 0, "Tickets sold should be 0");
    }
    
    function testCreateEventWithPastTime() public {
        vm.prank(organizer);
        uint256 pastTime = 1; // Timestamp in the past
        
        vm.expectRevert("Event time must be in future");
        ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, pastTime);
    }
    
    function testCreateEventWithZeroPrice() public {
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        
        vm.expectRevert("Price must be greater than 0");
        ticketify.createEvent(0, MAX_ATTENDEES, eventTime);
    }
    
    function testCreateEventWithZeroAttendees() public {
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        
        vm.expectRevert("Max attendees must be greater than 0");
        ticketify.createEvent(TICKET_PRICE, 0, eventTime);
    }
    
    // ============ Ticket Purchase Tests ============
    
    function testPurchaseTicket() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Approve PYUSD spending
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        
        // Purchase ticket
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        // Verify purchase
        assertTrue(ticketify.hasUserPurchasedTicket(eventId, buyer1), "Should have purchased ticket");
        assertEq(ticketify.getTicketsSold(eventId), 1, "Tickets sold should be 1");
    }
    
    function testCannotPurchaseSameTicketTwice() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // First purchase
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE * 2);
        
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        // Try to purchase again
        vm.prank(buyer1);
        vm.expectRevert("Already purchased ticket for this event");
        ticketify.purchaseTicket(eventId);
    }
    
    function testMultipleBuyersCanPurchase() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Buyer 1 purchases
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        // Buyer 2 purchases
        vm.prank(buyer2);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer2);
        ticketify.purchaseTicket(eventId);
        
        // Verify both purchases
        assertTrue(ticketify.hasUserPurchasedTicket(eventId, buyer1), "Buyer1 should have ticket");
        assertTrue(ticketify.hasUserPurchasedTicket(eventId, buyer2), "Buyer2 should have ticket");
        assertEq(ticketify.getTicketsSold(eventId), 2, "Should have 2 tickets sold");
    }
    
    // ============ Revenue Withdrawal Tests ============
    
    function testOrganizerWithdrawRevenue() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Purchase ticket
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        // Calculate expected revenue (ticket price - 2.5% platform fee)
        uint256 platformFee = (TICKET_PRICE * 250) / 10000;
        uint256 expectedRevenue = TICKET_PRICE - platformFee;
        
        // Withdraw revenue
        uint256 balanceBefore = pyusd.balanceOf(organizer);
        vm.prank(organizer);
        ticketify.withdrawRevenue(eventId);
        uint256 balanceAfter = pyusd.balanceOf(organizer);
        
        assertEq(balanceAfter - balanceBefore, expectedRevenue, "Should receive correct revenue");
    }
    
    function testNonOrganizerCannotWithdraw() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Purchase ticket
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        // Try to withdraw as non-organizer
        vm.prank(buyer1);
        vm.expectRevert("Only organizer can withdraw");
        ticketify.withdrawRevenue(eventId);
    }
    
    function testCannotWithdrawTwice() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Purchase ticket
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        // First withdrawal
        vm.prank(organizer);
        ticketify.withdrawRevenue(eventId);
        
        // Try second withdrawal
        vm.prank(organizer);
        vm.expectRevert("Revenue already withdrawn");
        ticketify.withdrawRevenue(eventId);
    }
    
    // ============ Platform Fee Tests ============
    
    function testPlatformFeesAccumulate() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Purchase ticket
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        // Calculate expected platform fee (2.5%)
        uint256 expectedFee = (TICKET_PRICE * 250) / 10000;
        
        assertEq(ticketify.platformFeesAccumulated(), expectedFee, "Platform fees should match");
    }
    
    function testOwnerCanWithdrawPlatformFees() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Purchase ticket
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        uint256 expectedFee = (TICKET_PRICE * 250) / 10000;
        
        // Withdraw platform fees as owner
        uint256 balanceBefore = pyusd.balanceOf(owner);
        ticketify.withdrawPlatformFees();
        uint256 balanceAfter = pyusd.balanceOf(owner);
        
        assertEq(balanceAfter - balanceBefore, expectedFee, "Should receive platform fees");
        assertEq(ticketify.platformFeesAccumulated(), 0, "Platform fees should be reset to 0");
    }
    
    function testNonOwnerCannotWithdrawPlatformFees() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Purchase ticket
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        // Try to withdraw as non-owner
        vm.prank(buyer1);
        vm.expectRevert();
        ticketify.withdrawPlatformFees();
    }
    
    // ============ View Function Tests ============
    
    function testGetEventRevenue() public {
        // Create event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        uint256 eventId = ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        // Purchase 2 tickets
        vm.prank(buyer1);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer1);
        ticketify.purchaseTicket(eventId);
        
        vm.prank(buyer2);
        pyusd.approve(address(ticketify), TICKET_PRICE);
        vm.prank(buyer2);
        ticketify.purchaseTicket(eventId);
        
        // Calculate expected revenue
        uint256 platformFeePerTicket = (TICKET_PRICE * 250) / 10000;
        uint256 organizerSharePerTicket = TICKET_PRICE - platformFeePerTicket;
        uint256 expectedRevenue = organizerSharePerTicket * 2;
        
        assertEq(ticketify.getEventRevenue(eventId), expectedRevenue, "Revenue should match");
    }
    
    function testGetEventCounter() public {
        assertEq(ticketify.getEventCounter(), 0, "Initial counter should be 0");
        
        // Create first event
        vm.prank(organizer);
        uint256 eventTime = block.timestamp + 1 days;
        ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        assertEq(ticketify.getEventCounter(), 1, "Counter should be 1 after first event");
        
        // Create second event
        vm.prank(organizer);
        ticketify.createEvent(TICKET_PRICE, MAX_ATTENDEES, eventTime);
        
        assertEq(ticketify.getEventCounter(), 2, "Counter should be 2 after second event");
    }
}

