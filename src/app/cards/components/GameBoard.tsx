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

// Fallback word list for when API fails
const FALLBACK_WORDS = [
  'REACT', 'WORLD', 'GAMES', 'HAPPY', 'LEARN', 'BUILD', 'SHARE', 'DREAM',
  'PEACE', 'LOVE', 'HOPE', 'JOY', 'FUN', 'TEAM', 'CODE', 'TECH'
];

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
      console.log('Attempting to fetch word from API...');
      
      const data = await getRandomWord?.('normal');
      const word = data?.word;
      if (!word) {
        throw new Error("No word received from server");
      }
      const upperWord = word.toUpperCase();
      console.log(`👀 Are you peeking? Ok, well the word is ${upperWord}!`);
      setTargetWord(upperWord);
      
    } catch (error) {
      console.error('Error fetching word from API:', error);
      
      // Use a random fallback word so the game can still be played
      const randomFallback = FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
      console.log(`Using fallback word: ${randomFallback}`);
      setTargetWord(randomFallback);
      
      // Show a warning but don't block the game
      sendAlert({
        title: "Using Offline Mode",
        message: `Couldn't fetch a random word from the API (${error.message}), using "${randomFallback}" instead. Check console for details.`,
        variant: "warning"
      });
      
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