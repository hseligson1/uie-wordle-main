/**
 * Main game logic component for the Wordle clone.
 *
 * Handles core game functionality including:
 * - Managing game state (guesses, current word, game status)
 * - Processing user input and guess validation
 * - Fetching random words from the Lambda function backend
 * - Displaying game UI and coordinating with GuessRow components
 */

import React, { useState, useEffect } from "react";
import { Box, Button, Flex, Input, hubspot } from "@hubspot/ui-extensions";
import { GuessRow } from "./GuessRow";

// IMPORTANT: Replace this with your actual Lambda function URL
const LAMBDA_ENDPOINT = "https://your-lambda-url.amazonaws.com/getRandomWord";
// Alternative examples:
// const LAMBDA_ENDPOINT = "https://your-app.vercel.app/api/getRandomWord";
// const LAMBDA_ENDPOINT = "https://your-site.netlify.app/.netlify/functions/getRandomWord";

// Notice: Removed runServerless from props - no longer needed!
export const GameBoard = ({ sendAlert }) => {
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [targetWord, setTargetWord] = useState("REACT");
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const gameEnded = isGameOver || guesses.length >= 5;

  useEffect(() => {
    fetchNewWord();
  }, []);

  const resetGame = () => {
    setGuesses([]);
    setCurrentGuess("");
    setIsGameOver(false);
    fetchNewWord();
  };

  const handleSubmitGuess = () => {
    if (currentGuess.length !== 5) {
      sendAlert({ message: "Guess must be 5 letters!", type: "danger" });
      return;
    }
    if (guesses.length >= 5) {
      sendAlert({ message: "Game over! You've used all 5 guesses.", type: "danger" });
      return;
    }

    const upperGuess = currentGuess.toUpperCase();
    setGuesses([...guesses, upperGuess]);
    setCurrentGuess("");

    if (upperGuess === targetWord) {
      sendAlert({ message: "Congratulations! You've won! 🎉", type: "success" });
      setIsGameOver(true);
    }
  };

  // OLD VERSION - This is what you had before:
  /*
  const fetchNewWord = async () => {
    try {
      setIsLoading(true);
      const response = await runServerless({
        name: 'getRandomWord'
      });
      console.log(`👀 Are you peeking? Ok, well the word is ${response.response.body.word}!`);
      setTargetWord(response.response.body.word);
    } catch (error) {
      console.error('Error:', error);
      sendAlert({
        message: "Failed to fetch new word.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };
  */

  // NEW VERSION - Using hubspot.fetch() to call your Lambda function
  const fetchNewWord = async () => {
    try {
      setIsLoading(true);
      
      // Make HTTP request to your Lambda function
      const response = await hubspot.fetch(LAMBDA_ENDPOINT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Check if the HTTP request was successful
      if (!response.ok) {
        // Try to get error details from the response
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use the status
        }
        throw new Error(errorMessage);
      }
      
      // Parse the JSON response from your Lambda function
      const data = await response.json();
      
      // Extract the word from the response
      // The exact property name depends on how your Lambda function returns data
      const word = data.word; // Adjust this based on your Lambda function's response format
      
      if (!word) {
        throw new Error("No word received from server");
      }
      
      // Convert to uppercase for consistency with Wordle
      const upperWord = word.toUpperCase();
      
      console.log(`👀 Are you peeking? Ok, well the word is ${upperWord}!`);
      setTargetWord(upperWord);
      
    } catch (error) {
      console.error('Error fetching word:', error);
      
      // More specific error messages based on the type of error
      let userMessage = "Failed to fetch new word.";
      
      if (error.message.includes("404")) {
        userMessage = "Word service not found. Please contact support.";
      } else if (error.message.includes("500")) {
        userMessage = "Word service is temporarily down. Please try again.";
      } else if (error.message.includes("Failed to fetch")) {
        userMessage = "Network error. Please check your connection.";
      } else if (error.message.includes("No word received")) {
        userMessage = "Invalid response from word service.";
      }
      
      sendAlert({
        message: userMessage,
        type: "error"
      });
      
      // Keep the default word so the game can still be played
      console.log("Using fallback word: REACT");
      setTargetWord("REACT");
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Input and control buttons section */}
      <Flex direction="row" justify="between" align="end" gap="md" >
        <Box flex={4}>
          <Input
            label='Guess'
            name="currentGuess"
            value={currentGuess}
            onChange={setCurrentGuess}
            placeholder="Enter 5-letter word"
            readOnly={gameEnded}
          />
        </Box>

        <Box flex={1}>
          {gameEnded ? (
            <Button onClick={resetGame} disabled={isLoading}>
              {isLoading ? "Loading..." : "Reset Game"}
            </Button>
          ) : (
            <Button onClick={handleSubmitGuess}>
              Guess
            </Button>
          )}
        </Box>
      </Flex>

      {/* Game board display showing previous guesses */}
      <Flex direction="column" gap="md">
        {guesses.map((guess, index) => (
          <GuessRow key={index} guess={guess} targetWord={targetWord} />
        ))}
      </Flex>
    </>
  );
};