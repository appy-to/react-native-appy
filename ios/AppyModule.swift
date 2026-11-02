import AppySDK
import ExpoModulesCore

final class MissingPublishableKeyException: Exception {
    override var reason: String {
        "Appy.configure needs a publishableKey"
    }
}

public final class AppyModule: Module {
    public func definition() -> ModuleDefinition {
        Name("Appy")

        Events("onDeepLink", "onAttribution")

        Constant("nativeSdkVersion") {
            Appy.sdkVersion
        }

        OnStartObserving("onDeepLink") { [weak self] in
            Appy.shared.onDeepLink = { result in
                self?.sendEvent("onDeepLink", AppyMapping.result(result))
            }
        }

        OnStopObserving("onDeepLink") {
            Appy.shared.onDeepLink = nil
        }

        OnStartObserving("onAttribution") { [weak self] in
            Appy.shared.onAttribution = { attribution in
                self?.sendEvent("onAttribution", AppyMapping.attribution(attribution))
            }
        }

        OnStopObserving("onAttribution") {
            Appy.shared.onAttribution = nil
        }

        Function("configure") { (options: [String: Any]) in
            guard let configuration = AppyMapping.configuration(options) else {
                throw MissingPublishableKeyException()
            }
            AppyLaunch.configure(configuration)
        }

        AsyncFunction("handleUrl") { (url: String) -> Bool in
            guard let url = URL(string: url) else {
                return false
            }
            return Appy.shared.handle(url: url)
        }

        Function("track") { (name: String, options: [String: Any]) in
            Appy.shared.track(
                name,
                properties: AppyMapping.properties(options["properties"]),
                revenue: AppyMapping.revenue(options["revenue"]),
                currency: options["currency"] as? String,
                deduplicationId: options["deduplicationId"] as? String
            )
        }

        Function("setUserId") { (userId: String?) in
            Appy.shared.setUserId(userId)
        }

        Function("setTrackingEnabled") { (enabled: Bool) in
            Appy.shared.isTrackingEnabled = enabled
        }

        AsyncFunction("isTrackingEnabled") { () -> Bool in
            Appy.shared.isTrackingEnabled
        }

        AsyncFunction("buildLink") { (slug: String, parameters: [String: String]) -> String? in
            Appy.shared.link(slug: slug, parameters: parameters)?.absoluteString
        }

        Function("flush") {
            Appy.shared.flush()
        }

        AsyncFunction("getAttribution") { () -> [String: Any]? in
            Appy.shared.attribution.map(AppyMapping.attribution)
        }

        AsyncFunction("getLatestDeepLink") { () -> [String: Any]? in
            Appy.shared.latestDeepLink.map(AppyMapping.link)
        }
    }
}
