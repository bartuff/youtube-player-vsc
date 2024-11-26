import * as vscode from "vscode";

export class YoutubePlayerViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "youtubePlayerView";

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>YouTube Player</title>
            </head>
            <body>
                <div id="player">
                    <iframe
                        width="100%"
                        height="200"
                        src="https://www.youtube.com/embed/VIDEO_ID"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                </div>
                <input type="text" id="videoUrl" placeholder="Ingresa URL de YouTube">
                <button onclick="changeVideo()">Cargar Video</button>
                <script>
                    function changeVideo() {
                        const input = document.getElementById('videoUrl');
                        const url = input.value;
                        const videoId = extractVideoId(url);
                        if (videoId) {
                            const iframe = document.querySelector('iframe');
                            iframe.src = 'https://www.youtube.com/embed/' + videoId;
                        }
                    }

                    function extractVideoId(url) {
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                        const match = url.match(regExp);
                        return (match && match[2].length === 11) ? match[2] : null;
                    }
                </script>
            </body>
            </html>
        `;
  }
}
