/**
 * Main entry point for the Wordle clone UI Extension.
 *
 * This file sets up the root component and registers it with HubSpot's
 * extension framework. It serves as the container for the game components
 * and handles the core extension setup including user context and
 * platform functionality.
 * 
 * UPDATED: Now uses hubspot.fetch() instead of runServerless to call
 * external Lambda function for getting random words.
 */

import React from "react";
import {
  Divider,
  Flex,
  Heading,
  Text,
  hubspot,
} from "@hubspot/ui-extensions";
import { GameInstructions } from "./components/GameInstructions";
import { GameBoard } from "./components/GameBoard";

// Configuration for your Lambda function endpoint
const LAMBDA_CONFIG = {
  // Replace this with your actual Lambda function URL
  endpoint: 'https://us6c1013ue.execute-api.us-east-1.amazonaws.com/PROD/getRandomWord',
  // Alternative endpoints for different platforms:
  // Vercel: 'https://your-app.vercel.app/api/getRandomWord'
  // Netlify: 'https://your-site.netlify.app/.netlify/functions/getRandomWord'
};

const Extension = ({ context, sendAlert }) => {
  
  // Function to get random word using hubspot.fetch() instead of runServerless
  const getRandomWord = async (difficulty = 'normal') => {
    try {
      console.log('Fetching random word from Lambda function...');
      console.log('Endpoint:', LAMBDA_CONFIG.endpoint);
      
      // Use hubspot.fetch() to call your Lambda function
      // Try without difficulty parameter first since API works without it
      const response = await hubspot.fetch(LAMBDA_CONFIG.endpoint, {
        method: 'GET'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      console.log('Response headers:', response.headers);

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      // Parse the JSON response
      const data = await response.json();
      console.log('Response data:', data);
      
      // Validate the response has the expected structure
      if (!data.word) {
        throw new Error('Invalid response: missing word property');
      }

      console.log('Successfully fetched word:', data.word);
      return data;

    } catch (error) {
      console.error('Error fetching random word:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Check if it's a network/CORS error
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.log('This appears to be a CORS or network issue with HubSpot fetch');
      }
      
      // Don't show error alert here - let the GameBoard handle it
      // This prevents double error messages
      throw error;
    }
  };

  return (
    <Flex direction="column" gap="md">
      <Heading>Hey, {context.user.firstName}! Take a Wordle break!</Heading>
      <Divider />
      <GameInstructions />
      <Divider />
      <GameBoard 
        sendAlert={sendAlert}
        getRandomWord={getRandomWord}
      />
      <Text variant="microcopy">
        * HubSpot does not own the rights to the Wordle name, trademarks, or game.
      </Text>
    </Flex>
  );
};

// Define the extension to be run within the Hubspot CRM
// Notice: No longer need runServerlessFunction parameter
hubspot.extend(({ context, actions }) => {
  const { addAlert } = actions as any;
  return (
    <Extension
      context={context}
      sendAlert={addAlert}
    />
  );
});