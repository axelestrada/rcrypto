#!/usr/bin/env node

import { input, select, password } from "@inquirer/prompts";
import { decrypt, encrypt } from "./cipher.js";
import clipboard from "clipboardy";

let running = true;

while (running) {
  try {
    const answer = await select({
      message: "What do you want to do?",
      choices: ["🔒 Encrypt", "🔓 Decrypt", "🚪 Exit"],
    });

    if (answer === "🚪 Exit") {
      console.log("👋 until next time!");
      running = false;
      break;
    }

    if (answer === "🔒 Encrypt") {
      try {
        const textToEncrypt = await input({
          message: "Enter the text you want to encrypt:",
          required: true,
        });

        const userPassword = await password({
          message: "Enter the password:",
          mask: "*",
          validate: (value) => {
            if (value.length < 6) {
              return "Password must be at least 6 characters long.";
            }

            return true;
          },
        });

        const encryptedText = encrypt(textToEncrypt, userPassword);

        await clipboard.write(encryptedText);
        console.log("Encrypted text:", encryptedText);
        console.log("✅ Copied to clipboard!");
        await input({
          message: "Press any key to continue...",
        });
      } catch (error) {
        if (error instanceof Error && error.name === "ExitPromptError") {
          console.log("Back to main menu...");
        } else {
          throw error;
        }
      }
    } else if (answer === "🔓 Decrypt") {
      let decryptSuccess = false;

      while (!decryptSuccess) {
        try {
          const textToDecrypt = await input({
            message: "Enter the text you want to decrypt:",
          });

          const userPassword = await password({
            message: "Enter the password:",
            mask: "*",
          });

          try {
            const decryptedText = decrypt(textToDecrypt, userPassword);
            console.log("Decrypted text:", decryptedText);
            await input({
              message: "Press any key to continue...",
            });
            decryptSuccess = true;
          } catch (decryptError) {
            console.error(
              "❌ Failed to decrypt. Please check the password and the encrypted text."
            );
            const retry = await select({
              message: "What do you want to do?",
              choices: ["🔄 Try again", "⏪ Back to menu"],
            });

            if (retry === "⏪ Back to menu") {
              decryptSuccess = true;
            }
          }
        } catch (error) {
          if (error instanceof Error && error.name === "ExitPromptError") {
            console.log("Back to main menu...");
            decryptSuccess = true;
          } else {
            throw error;
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === "ExitPromptError") {
      console.log("👋 until next time!");
      running = false;
    } else {
      throw error;
    }
  }
}
