package to.appy.sdk.reactnative

import to.appy.sdk.AppyAdNetwork
import to.appy.sdk.AppyAttribution
import to.appy.sdk.AppyConfig
import to.appy.sdk.AppyDeepLink
import to.appy.sdk.AppyDeepLinkResult
import to.appy.sdk.AppyError
import to.appy.sdk.AppyLogLevel

internal object AppyMapping {
  fun config(options: Map<String, Any?>): AppyConfig {
    val publishableKey = options["publishableKey"] as? String
      ?: throw IllegalArgumentException("Appy.configure needs a publishableKey")
    val linkDomains = (options["linkDomains"] as? List<*>).orEmpty().filterIsInstance<String>()
    val android = options["android"] as? Map<*, *>
    return AppyConfig(publishableKey, linkDomains).apply {
      emailLinkDomains = (options["emailLinkDomains"] as? List<*>).orEmpty().filterIsInstance<String>()
      logLevel = logLevel(options["logLevel"] as? String)
      openDeferredDeepLinks = options["openDeferredDeepLinks"] as? Boolean ?: false
      (options["deferredDeepLinkTimeoutMillis"] as? Number)?.let { deferredDeepLinkTimeoutMillis = it.toLong() }
      (options["launchLinkWaitMillis"] as? Number)?.let { launchLinkWaitMillis = it.toLong() }
      (options["requestTimeoutMillis"] as? Number)?.let { requestTimeoutMillis = it.toInt() }
      (options["apiBaseUrl"] as? String)?.let { apiBaseUrl = it }
      (android?.get("collectInstallReferrer") as? Boolean)?.let { collectInstallReferrer = it }
      metaAppId = android?.get("metaAppId") as? String
    }
  }

  fun logLevel(name: String?): AppyLogLevel = when (name) {
    "none" -> AppyLogLevel.NONE
    "warning" -> AppyLogLevel.WARNING
    "info" -> AppyLogLevel.INFO
    "debug" -> AppyLogLevel.DEBUG
    else -> AppyLogLevel.ERROR
  }

  fun result(result: AppyDeepLinkResult): Map<String, Any?> = when (result) {
    is AppyDeepLinkResult.Found -> mapOf("status" to "found", "link" to link(result.link))
    AppyDeepLinkResult.NotFound -> mapOf("status" to "notFound")
    is AppyDeepLinkResult.Failed -> mapOf("status" to "failed", "error" to error(result.error))
  }

  fun error(error: AppyError): String = when (error) {
    AppyError.TIMEOUT -> "timeout"
    AppyError.NETWORK -> "network"
    AppyError.INVALID_RESPONSE -> "invalidResponse"
  }

  fun link(link: AppyDeepLink): Map<String, Any?> = mapOf(
    "url" to link.url?.toString(),
    "deeplinkUrl" to link.deeplinkUri?.toString(),
    "slug" to link.slug,
    "parameters" to link.parameters,
    "isDeferred" to link.isDeferred,
    "clickedAtMillis" to link.clickedAt?.toDouble(),
  )

  fun attribution(attribution: AppyAttribution): Map<String, Any?> = mapOf(
    "isOrganic" to attribution.isOrganic,
    "linkSlug" to attribution.linkSlug,
    "linkTitle" to attribution.linkTitle,
    "source" to attribution.source,
    "medium" to attribution.medium,
    "campaign" to attribution.campaign,
    "clickedAtMillis" to attribution.clickedAt?.toDouble(),
    "network" to attribution.network?.let(::network),
  )

  fun properties(raw: Any?): Map<String, Any?> =
    (raw as? Map<*, *>).orEmpty().entries
      .filter { it.key is String && (it.value is String || it.value is Boolean || it.value is Number) }
      .associate { it.key as String to it.value }

  fun revenue(raw: Any?): Double? = (raw as? Number)?.toDouble()?.takeIf { it.isFinite() }

  private fun network(network: AppyAdNetwork): Map<String, Any?> = mapOf(
    "name" to network.name,
    "campaignId" to network.campaignId,
    "campaignName" to network.campaignName,
    "adGroupId" to network.adGroupId,
    "adGroupName" to network.adGroupName,
    "adId" to network.adId,
    "clickId" to network.clickId,
    "touch" to network.touch,
  )
}
