import AppySDK
import Foundation

enum AppyMapping {
    static func configuration(_ options: [String: Any]) -> AppyConfiguration? {
        guard let publishableKey = options["publishableKey"] as? String else {
            return nil
        }
        var configuration = AppyConfiguration(
            publishableKey: publishableKey,
            linkDomains: options["linkDomains"] as? [String] ?? []
        )
        configuration.emailLinkDomains = options["emailLinkDomains"] as? [String] ?? []
        configuration.logLevel = logLevel(options["logLevel"] as? String)
        configuration.openDeferredDeepLinks = options["openDeferredDeepLinks"] as? Bool ?? false
        if let millis = options["deferredDeepLinkTimeoutMillis"] as? Double {
            configuration.deferredDeepLinkTimeout = millis / 1000
        }
        if let millis = options["launchLinkWaitMillis"] as? Double {
            configuration.launchLinkWaitInterval = millis / 1000
        }
        if let millis = options["requestTimeoutMillis"] as? Double {
            configuration.requestTimeout = millis / 1000
        }
        if let apiBaseURL = (options["apiBaseUrl"] as? String).flatMap(URL.init(string:)) {
            configuration.apiBaseURL = apiBaseURL
        }
        return configuration
    }

    static func logLevel(_ name: String?) -> AppyLogLevel {
        switch name {
        case "none": return .none
        case "warning": return .warning
        case "info": return .info
        case "debug": return .debug
        default: return .error
        }
    }

    static func result(_ result: AppyDeepLinkResult) -> [String: Any] {
        switch result {
        case .found(let link):
            return ["status": "found", "link": self.link(link)]
        case .notFound:
            return ["status": "notFound"]
        case .failed(.timeout):
            return ["status": "failed", "error": "timeout"]
        case .failed(.network):
            return ["status": "failed", "error": "network"]
        case .failed(.invalidResponse):
            return ["status": "failed", "error": "invalidResponse"]
        }
    }

    static func link(_ link: AppyDeepLink) -> [String: Any] {
        compact([
            "url": link.url?.absoluteString,
            "deeplinkUrl": link.deeplinkURL?.absoluteString,
            "slug": link.slug,
            "parameters": link.parameters,
            "isDeferred": link.isDeferred,
            "clickedAtMillis": millis(link.clickedAt),
        ])
    }

    static func attribution(_ attribution: AppyAttribution) -> [String: Any] {
        compact([
            "isOrganic": attribution.isOrganic,
            "linkSlug": attribution.linkSlug,
            "linkTitle": attribution.linkTitle,
            "source": attribution.source,
            "medium": attribution.medium,
            "campaign": attribution.campaign,
            "clickedAtMillis": millis(attribution.clickedAt),
            "network": attribution.network.map(network),
        ])
    }

    static func revenue(_ value: Any?) -> Decimal? {
        guard let number = value as? Double, number.isFinite else {
            return nil
        }
        return Decimal(string: "\(number)")
    }

    static func properties(_ value: Any?) -> [String: Any] {
        guard let properties = value as? [String: Any] else {
            return [:]
        }
        return properties.filter { $0.value is String || $0.value is Bool || $0.value is NSNumber }
    }

    private static func network(_ network: AppyAdNetwork) -> [String: Any] {
        compact([
            "name": network.name,
            "campaignId": network.campaignId,
            "campaignName": network.campaignName,
            "adGroupId": network.adGroupId,
            "adGroupName": network.adGroupName,
            "adId": network.adId,
            "clickId": network.clickId,
            "touch": network.touch,
        ])
    }

    private static func millis(_ date: Date?) -> Double? {
        date.map { ($0.timeIntervalSince1970 * 1000).rounded() }
    }

    private static func compact(_ values: [String: Any?]) -> [String: Any] {
        values.compactMapValues { $0 }
    }
}
