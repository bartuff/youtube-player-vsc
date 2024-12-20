// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { YoutubePlayerViewProvider } from "./YoutubePlayerViewProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const provider = new YoutubePlayerViewProvider(
    context.extensionUri,
    context.globalState
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      YoutubePlayerViewProvider.viewType,
      provider
    )
  );

  // Registrar el comando para añadir video
  context.subscriptions.push(
    vscode.commands.registerCommand("youtubePlayer.addVideo", () => {
      provider.addVideo();
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
