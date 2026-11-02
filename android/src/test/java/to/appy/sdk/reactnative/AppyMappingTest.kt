package to.appy.sdk.reactnative

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import to.appy.sdk.AppyAdNetwork
import to.appy.sdk.AppyAttribution
import to.appy.sdk.AppyDeepLink
import to.appy.sdk.AppyDeepLinkResult
import to.appy.sdk.AppyError
import to.appy.sdk.AppyLogLevel

class AppyMappingTest {
  @Test
  fun configMapsTheJavaScriptOptions() {
    val config = AppyMapping.config(
      mapOf(
        "publishableKey" to "appy_pk_test",
        "linkDomains" to listOf("acme.appy.to"),
        "emailLinkDomains" to listOf("links.example.com"),
        "logLevel" to "info",
        "openDeferredDeepLinks" to true,
        "deferredDeepLinkTimeoutMillis" to 8000.0,
        "launchLinkWaitMillis" to 250.0,
        "requestTimeoutMillis" to 20000.0,
        "apiBaseUrl" to null,
        "android" to mapOf("collectInstallReferrer" to false, "metaAppId" to "1234567890"),
      ),
    )

    assertEquals("appy_pk_test", config.publishableKey)
    assertEquals(listOf("acme.appy.to"), config.linkDomains)
    assertEquals(listOf("links.example.com"), config.emailLinkDomains)
    assertEquals(AppyLogLevel.INFO, config.logLevel)
    assertEquals(true, config.openDeferredDeepLinks)
    assertEquals(8000L, config.deferredDeepLinkTimeoutMillis)
    assertEquals(250L, config.launchLinkWaitMillis)
    assertEquals(20000, config.requestTimeoutMillis)
    assertEquals("https://api.appy.to", config.apiBaseUrl)
    assertEquals(false, config.collectInstallReferrer)
    assertEquals("1234567890", config.metaAppId)
  }

  @Test(expected = IllegalArgumentException::class)
  fun configNeedsAPublishableKey() {
    AppyMapping.config(mapOf("linkDomains" to listOf("acme.appy.to")))
  }

  @Test
  fun resultsMatchTheJavaScriptStatuses() {
    val link = AppyDeepLink(null, null, "spring", mapOf("item" to "42"), false, 1_760_000_000_000L)

    assertEquals("found", AppyMapping.result(AppyDeepLinkResult.Found(link))["status"])
    assertEquals(1_760_000_000_000.0, (AppyMapping.result(AppyDeepLinkResult.Found(link))["link"] as Map<*, *>)["clickedAtMillis"])
    assertEquals(mapOf("status" to "notFound"), AppyMapping.result(AppyDeepLinkResult.NotFound))
    assertEquals(mapOf("status" to "failed", "error" to "timeout"), AppyMapping.result(AppyDeepLinkResult.Failed(AppyError.TIMEOUT)))
    assertEquals(mapOf("status" to "failed", "error" to "network"), AppyMapping.result(AppyDeepLinkResult.Failed(AppyError.NETWORK)))
    assertEquals(
      mapOf("status" to "failed", "error" to "invalidResponse"),
      AppyMapping.result(AppyDeepLinkResult.Failed(AppyError.INVALID_RESPONSE)),
    )
  }

  @Test
  fun attributionCarriesTheNetwork() {
    val attribution = AppyAttribution(
      isOrganic = false,
      linkSlug = "spring",
      linkTitle = null,
      source = "newsletter",
      medium = null,
      campaign = null,
      clickedAt = null,
      network = AppyAdNetwork("meta", "7", null, null, null, null, null, "view"),
    )

    val mapped = AppyMapping.attribution(attribution)

    assertEquals("spring", mapped["linkSlug"])
    assertNull(mapped["clickedAtMillis"])
    assertEquals("meta", (mapped["network"] as Map<*, *>)["name"])
    assertEquals("view", (mapped["network"] as Map<*, *>)["touch"])
  }

  @Test
  fun eventValuesAreFiltered() {
    assertEquals(
      mapOf("sku" to "A1", "qty" to 2.0, "gift" to false),
      AppyMapping.properties(mapOf("sku" to "A1", "qty" to 2.0, "gift" to false, "nested" to mapOf("a" to 1))),
    )
    assertEquals(19.98, AppyMapping.revenue(19.98))
    assertNull(AppyMapping.revenue(Double.NaN))
    assertNull(AppyMapping.revenue("19.98"))
  }
}
