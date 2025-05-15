// Test script to check the card sorting in the Prismatic Evolutions set
const { default: fetch } = require('node-fetch');

// API configuration
const API_BASE_URL = 'https://maber-apim-test.azure-api.net/pokedata-api';
const API_KEY = '1c3e73f4352b415c98eb89f91541c4e4';
const SET_CODE = 'PRE'; // Prismatic Evolutions set code

// Headers
const headers = {
  'Ocp-Apim-Subscription-Key': API_KEY,
  'Content-Type': 'application/json'
};

async function testSetCards() {
  console.log('Testing card sorting for Prismatic Evolutions set...\n');
  
  try {
    // Fetch cards for the set
    const url = `${API_BASE_URL}/sets/${SET_CODE}/cards`;
    console.log(`Fetching cards from: ${url}`);
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.log(`❌ ERROR: Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Error details: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      return;
    }
    
    const data = await response.json();
    
    // Extract cards from response
    let cards = [];
    if (data && data.data && data.data.items) {
      // API Management response format (with pagination)
      cards = data.data.items;
    } else if (Array.isArray(data)) {
      // Direct array response
      cards = data;
    } else if (data && data.cards && Array.isArray(data.cards)) {
      // Cards wrapper format
      cards = data.cards;
    }
    
    console.log(`\nSuccessfully received ${cards.length} cards from API`);
    
    // Apply sorting like in the application
    const sortedCards = [...cards].sort((a, b) => {
      // Extract numeric part from card numbers (e.g. "001" → 1)
      const cardNumA = a.cardNumber || a.num || '';
      const cardNumB = b.cardNumber || b.num || '';
      
      const numA = cardNumA ? parseInt(cardNumA.replace(/\D/g, '')) : 0;
      const numB = cardNumB ? parseInt(cardNumB.replace(/\D/g, '')) : 0;
      
      return numA - numB;
    });
    
    // Print first 10 cards before and after sorting
    console.log('\nFirst 10 cards BEFORE sorting:');
    cards.slice(0, 10).forEach(card => {
      console.log(`Card #${card.cardNumber || card.num || 'unknown'}: ${card.cardName || card.name || 'Unknown Card'}`);
    });
    
    console.log('\nFirst 10 cards AFTER sorting:');
    sortedCards.slice(0, 10).forEach(card => {
      console.log(`Card #${card.cardNumber || card.num || 'unknown'}: ${card.cardName || card.name || 'Unknown Card'}`);
    });
    
    // Check for special or promo cards that might be causing issues
    const specialCards = cards.filter(card => {
      const cardNum = card.cardNumber || card.num || '';
      return /[a-zA-Z]/.test(cardNum) || parseInt(cardNum) > 150;
    });
    
    if (specialCards.length > 0) {
      console.log('\nSpecial or high-numbered cards that might affect sorting:');
      specialCards.forEach(card => {
        console.log(`Card #${card.cardNumber || card.num || 'unknown'}: ${card.cardName || card.name || 'Unknown Card'}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ NETWORK ERROR: ${error.message}`);
  }
}

// Run the test
testSetCards();
