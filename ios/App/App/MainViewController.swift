import UIKit
import Capacitor
import WebKit

/// Capacitor の Bridge VC を継承して WKUIDelegate を実装。
/// MusicKit JS が `window.open()` で popup を開こうとすると iOS WKWebView は
/// デフォルトで Safari に flip させてしまうため、popup を main WebView 内
/// navigation に書き換えて同一 WebView コンテキストで完結させる。
class MainViewController: CAPBridgeViewController, WKUIDelegate {

    override func viewDidLoad() {
        super.viewDidLoad()
        bridge?.webView?.uiDelegate = self
    }

    // MusicKit / OAuth が `window.open()` で popup を要求した時に呼ばれる。
    // 新しい WebView を返さず、現在の WebView で同 URL を load することで
    // popup を回避し、auth 完了後の postMessage / token sync が同 window context で動作する。
    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            webView.load(URLRequest(url: url))
        }
        return nil
    }
}
