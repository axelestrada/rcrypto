#!/usr/bin/env node

import { input, select, password } from "@inquirer/prompts";
import { decrypt, encrypt } from "./cipher.js";
import clipboard from "clipboardy";

const HELP = `Uso:
  rcrypto encrypt <texto> <clave>
  rcrypto decrypt <texto-cifrado> <clave>
  rcrypto -h | --help

Sin argumentos, se abre el menú interactivo.
Usa comillas para argumentos con espacios o caracteres especiales.
La clave se pasa como argumento y puede quedar en el historial de la terminal.`;

const args = process.argv.slice(2);

if (args.length === 0) {
  await runInteractive();
} else if (args[0] === "-h" || args[0] === "--help") {
  console.log(HELP);
} else {
  try {
    await runCommand(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}

async function runCommand(commandArgs: string[]): Promise<void> {
  const [command, ...values] = commandArgs;
  if (command !== "encrypt" && command !== "decrypt") {
    throw new Error(`Comando desconocido: ${command}. Usa "rcrypto -h" para ver la ayuda.`);
  }

  if (values.length < 2) {
    throw new Error(`Faltan argumentos. Uso: rcrypto ${command} <texto> <clave>`);
  }

  const password = values[values.length - 1];
  const text = values.slice(0, -1).join(" ");

  if (!text || !password) {
    throw new Error("El texto y la clave no pueden estar vacíos.");
  }

  if (command === "encrypt" && password.length < 6) {
    throw new Error("La clave debe tener al menos 6 caracteres.");
  }

  const result =
    command === "encrypt" ? encrypt(text, password) : decrypt(text, password);

  await clipboard.write(result);
  console.log(result);
}

async function runInteractive(): Promise<void> {
  let running = true;

  while (running) {
    try {
      const answer = await select({
        message: "¿Qué quieres hacer?",
        choices: ["Cifrar", "Descifrar", "Salir"],
      });

      if (answer === "Salir") {
        console.log("Hasta la próxima.");
        running = false;
        break;
      }

      if (answer === "Cifrar") {
        try {
          const textToEncrypt = await input({
            message: "Texto para cifrar:",
            required: true,
          });

          const userPassword = await password({
            message: "Clave:",
            mask: "*",
            validate: (value) => {
              if (value.length < 6) {
                return "La clave debe tener al menos 6 caracteres.";
              }

              return true;
            },
          });

          const encryptedText = encrypt(textToEncrypt, userPassword);

          await clipboard.write(encryptedText);
          console.log("Texto cifrado:", encryptedText);
          console.log("Copiado al portapapeles.");
          await input({
            message: "Pulsa una tecla para continuar...",
          });
        } catch (error) {
          if (error instanceof Error && error.name === "ExitPromptError") {
            console.log("Volviendo al menú...");
          } else {
            throw error;
          }
        }
      } else if (answer === "Descifrar") {
        let decryptSuccess = false;

        while (!decryptSuccess) {
          try {
            const textToDecrypt = await input({
              message: "Texto para descifrar:",
            });

            const userPassword = await password({
              message: "Clave:",
              mask: "*",
            });

            try {
              const decryptedText = decrypt(textToDecrypt, userPassword);
              console.log("Texto descifrado:", decryptedText);
              await input({
                message: "Pulsa una tecla para continuar...",
              });
              decryptSuccess = true;
            } catch {
              console.error(
                "No se pudo descifrar. Revisa la clave y el texto cifrado."
              );
              const retry = await select({
                message: "¿Qué quieres hacer?",
                choices: ["Intentar de nuevo", "Volver al menú"],
              });

              if (retry === "Volver al menú") {
                decryptSuccess = true;
              }
            }
          } catch (error) {
            if (error instanceof Error && error.name === "ExitPromptError") {
              console.log("Volviendo al menú...");
              decryptSuccess = true;
            } else {
              throw error;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "ExitPromptError") {
        console.log("Hasta la próxima.");
        running = false;
      } else {
        throw error;
      }
    }
  }
}
