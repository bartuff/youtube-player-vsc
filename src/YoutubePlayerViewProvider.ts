import * as vscode from "vscode";

export class YoutubePlayerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "youtubePlayerView";
  private _view?: vscode.WebviewView;
  private _currentVideoId: string = "";

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _storage: vscode.Memento
  ) {
    // Recuperar el último video reproducido
    this._currentVideoId = this._storage.get("lastVideoId", "");
  }

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

    webviewView.description = "YouTube Player";
    webviewView.title = "YouTube Player";
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    if (this._currentVideoId) {
      setTimeout(() => {
        this._loadVideo(this._currentVideoId);
      }, 1000);
    }

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
      this._currentVideoId = videoId;
      this._storage.update("lastVideoId", videoId);
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
            </style>
            <script src="https://www.youtube.com/iframe_api"></script>
        </head>
        <body>
            <div id="player"></div>
            <script>
                const vscode = acquireVsCodeApi();
                let player;
                let currentVideoId = '${this._currentVideoId}';
                let currentTime = 0;
                let isPlaying = false;

                // Inicializar el reproductor de YouTube
                function onYouTubeIframeAPIReady() {
                    player = new YT.Player('player', {
                        height: '100%',
                        width: '100%',
                        videoId: currentVideoId,
                        playerVars: {
                            'autoplay': 1,
                            'enablejsapi': 1,
                            'modestbranding': 1,
                            'playsinline': 1,
                            'rel': 0
                        },
                        events: {
                            'onReady': onPlayerReady,
                            'onStateChange': onPlayerStateChange
                        }
                    });
                }

                function onPlayerReady(event) {
                    // Restaurar estado previo
                    const previousState = vscode.getState();
                    if (previousState) {
                        if (previousState.videoId) {
                            currentVideoId = previousState.videoId;
                            if (previousState.currentTime) {
                                currentTime = previousState.currentTime;
                                event.target.seekTo(currentTime);
                            }
                            if (previousState.isPlaying) {
                                event.target.playVideo();
                            }
                        }
                    }
                }

                function onPlayerStateChange(event) {
                    isPlaying = event.data === YT.PlayerState.PLAYING;
                    if (player && player.getCurrentTime) {
                        currentTime = player.getCurrentTime();
                    }
                    // Guardar estado
                    vscode.setState({
                        videoId: currentVideoId,
                        currentTime: currentTime,
                        isPlaying: isPlaying
                    });
                }

                // Guardar estado periódicamente
                setInterval(() => {
                    if (player && player.getCurrentTime) {
                        currentTime = player.getCurrentTime();
                        vscode.setState({
                            videoId: currentVideoId,
                            currentTime: currentTime,
                            isPlaying: isPlaying
                        });
                    }
                }, 1000);

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'loadVideo':
                            currentVideoId = message.videoId;
                            if (player && player.loadVideoById) {
                                player.loadVideoById(currentVideoId);
                            }
                            vscode.setState({
                                videoId: currentVideoId,
                                currentTime: 0,
                                isPlaying: true
                            });
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
