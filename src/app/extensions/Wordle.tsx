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
  endpoint: 'https://your-lambda-url.amazonaws.com/getRandomWord',
  // Alternative endpoints for different platforms:
  // Vercel: 'https://your-app.vercel.app/api/getRandomWord'
  // Netlify: 'https://your-site.netlify.app/.netlify/functions/getRandomWord'
};

const Extension = ({ context, sendAlert }) => {
  
  // Function to get random word using hubspot.fetch() instead of runServerless
  const getRandomWord = async (difficulty = 'normal') => {
    try {
      console.log('Fetching random word from Lambda function...');
      
      // Use hubspot.fetch() to call your Lambda function
      const response = await hubspot.fetch(`${LAMBDA_CONFIG.endpoint}?difficulty=${difficulty}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      // Parse the JSON response
      const data = await response.json();
      
      // Validate the response has the expected structure
      if (!data.word) {
        throw new Error('Invalid response: missing word property');
      }

      console.log('Successfully fetched word:', data.word);
      return data;

    } catch (error) {
      console.error('Error fetching random word:', error);
      
      // Show user-friendly error message
      sendAlert({
        type: 'danger',
        message: `Failed to get random word: ${error.message}`
      });
      
      // Return fallback word or re-throw error
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
        getRandomWord={getRandomWord}
        sendAlert={sendAlert} 
        userContext={context}
      />
      <Text variant="microcopy">
        * HubSpot does not own the rights to the Wordle name, trademarks, or game.
      </Text>
    </Flex>
  );
};

// Define the extension to be run within the Hubspot CRM
// Notice: No longer need runServerlessFunction parameter
hubspot.extend(({ context, actions }) => (
  <Extension
    context={context}
    sendAlert={actions.addAlert}
  />
));