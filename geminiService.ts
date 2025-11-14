

import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
let initializationError: string | null = null;

// This self-executing function initializes the AI client safely during module load.
// It catches any errors to prevent the entire app from crashing.
(() => {
  try {
    // Safely check for the API key to avoid ReferenceError in environments where 'process' is not defined.
    // FIX: Replaced `process.env.API_KEY` access with a null check to handle environments where `process` is not defined, preventing runtime errors. Ensured `GoogleGenAI` is initialized with the API key as a named parameter as required by the latest SDK guidelines.
    const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : null;

    if (API_KEY) {
      // FIX: Ensure API key is passed as a named parameter.
      ai = new GoogleGenAI({ apiKey: API_KEY });
    } else {
      initializationError = "API key is not configured. AI assistant is disabled.";
      console.warn(initializationError);
    }
  } catch (error) {
    initializationError = "Could not initialize the AI Assistant. This can happen if the environment is not configured correctly.";
    console.error(`${initializationError} Details:`, error);
    ai = null; // Ensure ai is null on any error
  }
})();

export const askAI = async (lectureTitle: string, lectureSummary: string, question: string): Promise<string> => {
  if (!ai) {
    const defaultMessage = "I'm sorry, but the AI assistant is not configured. Please ensure the API key is set up correctly by an administrator.";
    return initializationError ? `I'm sorry, but the AI assistant is unavailable. ${initializationError}` : defaultMessage;
  }

  try {
    const systemInstruction = `You are an expert AI study assistant named Edusim. Your goal is to help a student understand their course material better.
The student is currently in a lecture titled "${lectureTitle}".
Here is a brief summary of the lecture: "${lectureSummary}".
Based on this context, answer the student's question clearly, concisely, and in a friendly, encouraging tone.
If the question is outside the scope of the lecture, gently guide them back to the topic or answer it generally.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, but I'm having trouble connecting right now. Please try again in a moment.";
  }
};

export const getCourseRecommendation = async (query: string, categories: string[]): Promise<string> => {
  if (!ai) {
    // A sensible fallback if the AI client isn't available.
    console.warn("AI client not initialized. Falling back to default category.");
    return 'All'; 
  }

  try {
    const systemInstruction = `You are an expert academic advisor for an online learning platform called Edusimulate. Your job is to recommend the best course category for a student based on their learning goal.
The available categories are: ${categories.join(', ')}.
Analyze the user's query and respond with ONLY the name of the most relevant category from the list. Do not add any other text, explanation, or punctuation.
For example, if the user says "I want to become a doctor", you should respond with "NEET". If they say "help with 10th grade physics", you should respond with "School Preparation". If the query is ambiguous or doesn't fit, choose the most likely category.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.1, // Low temperature for more deterministic classification
        }
    });

    const recommendedCategory = response.text.trim().replace(/[."]/g, ''); // Remove trailing periods or quotes

    // Validate the response against the provided list of categories, case-insensitively.
    const validCategory = categories.find(c => c.toLowerCase() === recommendedCategory.toLowerCase());

    if (validCategory) {
        return validCategory; // Return with original casing
    } else {
        // If Gemini hallucinates a category or provides an unexpected format, log it and return a safe default.
        console.warn(`Gemini recommended an invalid category: "${recommendedCategory}". Returning "All".`);
        return 'All';
    }

  } catch (error) {
    console.error("Error getting course recommendation from Gemini API:", error);
    // Fallback to a default category in case of an API error.
    return 'All';
  }
};
