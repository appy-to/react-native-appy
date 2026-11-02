package to.appy.sdk.reactnative

import android.content.Context
import android.net.Uri
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import to.appy.sdk.Appy
import to.appy.sdk.AppyConfig

class AppyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("Appy")

    Events("onDeepLink", "onAttribution")

    Constant("nativeSdkVersion") {
      Appy.SDK_VERSION
    }

    OnStartObserving("onDeepLink") {
      Appy.setDeepLinkListener { result -> sendEvent("onDeepLink", AppyMapping.result(result)) }
    }

    OnStopObserving("onDeepLink") {
      Appy.setDeepLinkListener(null)
    }

    OnStartObserving("onAttribution") {
      Appy.setAttributionListener { attribution -> sendEvent("onAttribution", AppyMapping.attribution(attribution)) }
    }

    OnStopObserving("onAttribution") {
      Appy.setAttributionListener(null)
    }

    Function("configure") { options: Map<String, Any?> ->
      val context = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()
      AppyLaunch.configure(context, AppyMapping.config(options))
    }

    AsyncFunction("handleUrl") { url: String ->
      Appy.handleUri(Uri.parse(url))
    }

    Function("track") { name: String, options: Map<String, Any?> ->
      Appy.track(
        name,
        AppyMapping.properties(options["properties"]),
        AppyMapping.revenue(options["revenue"]),
        options["currency"] as? String,
        options["deduplicationId"] as? String,
      )
    }

    Function("setUserId") { userId: String? ->
      Appy.setUserId(userId)
    }

    Function("setTrackingEnabled") { enabled: Boolean ->
      Appy.isTrackingEnabled = enabled
    }

    AsyncFunction("isTrackingEnabled") {
      Appy.isTrackingEnabled
    }

    AsyncFunction("buildLink") { slug: String, parameters: Map<String, String> ->
      Appy.buildLink(slug, parameters)?.toString()
    }

    Function("flush") {
      Appy.flush()
    }

    AsyncFunction("getAttribution") {
      Appy.attribution?.let(AppyMapping::attribution)
    }

    AsyncFunction("getLatestDeepLink") {
      Appy.latestDeepLink?.let(AppyMapping::link)
    }
  }
}

internal object AppyLaunch {
  private var configured = false

  @Synchronized
  fun configure(context: Context, config: AppyConfig) {
    if (!configured) {
      configured = true
      Appy.init(context, config)
    }
  }
}
