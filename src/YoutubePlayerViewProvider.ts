import * as vscode from "vscode";

export class YoutubePlayerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "youtubePlayerView";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Manejar mensajes desde el webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "loadVideo":
          this._loadVideo(message.videoId);
          break;
      }
    });
  }

  public async addVideo() {
    if (!this._view) {
      return;
    }

    const url = await vscode.window.showInputBox({
      prompt: "Enter YouTube URL",
      placeHolder: "https://www.youtube.com/watch?v=...",
    });

    if (url) {
      const videoId = this._extractVideoId(url);
      if (videoId) {
        this._loadVideo(videoId);
      } else {
        vscode.window.showErrorMessage("Invalid YouTube URL");
      }
    }
  }

  private _loadVideo(videoId: string) {
    if (this._view) {
      this._view.webview.postMessage({ command: "loadVideo", videoId });
    }
  }

  private _extractVideoId(url: string): string | null {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>YouTube Player</title>
            <style>
                body {
                    padding: 0;
                    margin: 0;
                    width: 100%;
                    height: 100vh;
                    overflow: hidden;
                }

                #player {
                    width: 100%;
                    height: 100vh;
                    position: relative;
                }

                #player iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: none;
                }
            </style>
        </head>
        <body>
            <div id="player">
                <iframe
                    src="https://www.youtube.com/embed/"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>
            <script>
                const vscode = acquireVsCodeApi();

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'loadVideo':
                            const iframe = document.querySelector('iframe');
                            iframe.src = 'https://www.youtube.com/embed/' + message.videoId;
                            break;
                    }
                });

                // Manejar cambios de tamaño
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        const width = entry.contentRect.width;
                        const height = entry.contentRect.height;
                        document.querySelector('#player').style.height = height + 'px';
                    }
                });

                resizeObserver.observe(document.body);
            </script>
        </body>
        </html>
    `;
  }
}
