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
import { Box, Button, Flex, Input } from "@hubspot/ui-extensions";
import { GuessRow } from "./GuessRow";

// Word fetching is now provided via prop from parent

// Notice: Removed runServerless from props - no longer needed!
export const GameBoard = ({ sendAlert, getRandomWord }) => {
  const [currentGuess, setCurrentGuess] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [targetWord, setTargetWord] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const gameEnded = isGameOver || guesses.length >= 5;
  const gameReady = targetWord && !isLoading;

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
    if (!targetWord) {
      sendAlert({ title: "Game Not Ready", message: "Please wait for the word to load.", variant: "warning" });
      return;
    }
    if (currentGuess.length !== 5) {
      sendAlert({ title: "Invalid Guess", message: "Guess must be 5 letters!", variant: "danger" });
      return;
    }
    if (guesses.length >= 5) {
      sendAlert({ title: "Game Over", message: "You've used all 5 guesses.", variant: "danger" });
      return;
    }

    const upperGuess = currentGuess.toUpperCase();
    setGuesses([...guesses, upperGuess]);
    setCurrentGuess("");

    if (upperGuess === targetWord) {
      sendAlert({ title: "Congratulations!", message: "You've won! 🎉", variant: "success" });
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
        title: "Error",
        message: "Failed to fetch new word.",
        variant: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };
  */

  // Uses getRandomWord provided by parent component
  const fetchNewWord = async () => {
    try {
      setIsLoading(true);
      const data = await getRandomWord?.('normal');
      const word = data?.word;
      if (!word) {
        throw new Error("No word received from server");
      }
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
        title: "Error",
        message: userMessage,
        variant: "error"
      });
      
      // Don't set a fallback word - let the user retry
      console.log("Word fetching failed, game cannot start");
      
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
            placeholder={gameReady ? "Enter 5-letter word" : "Loading word..."}
            readOnly={gameEnded || !gameReady}
          />
        </Box>

        <Box flex={1}>
          {gameEnded ? (
            <Button onClick={resetGame} disabled={isLoading}>
              {isLoading ? "Loading..." : "Reset Game"}
            </Button>
          ) : (
            <Button onClick={handleSubmitGuess} disabled={!gameReady || isLoading}>
              {isLoading ? "Loading..." : "Guess"}
            </Button>
          )}
        </Box>
      </Flex>

      {/* Game board display showing previous guesses */}
      {targetWord && (
        <Flex direction="column" gap="md">
          {guesses.map((guess, index) => (
            <GuessRow key={index} guess={guess} targetWord={targetWord} />
          ))}
        </Flex>
      )}
    </>
  );
};