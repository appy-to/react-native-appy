import AppySDK
import ExpoModulesCore

enum AppyLaunch {
    private static let lock = NSLock()
    private static var isConfigured = false

    static func configure(_ configuration: AppyConfiguration) {
        lock.lock()
        defer { lock.unlock() }
        guard !isConfigured else {
            return
        }
        isConfigured = true
        Appy.configure(configuration)
    }
}

public final class AppyAppDelegateSubscriber: ExpoAppDelegateSubscriber {
    public func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        Appy.shared.handle(url: url)
        return false
    }

    public func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {
        Appy.shared.handle(userActivity: userActivity)
        restorationHandler(nil)
        return false
    }
}
