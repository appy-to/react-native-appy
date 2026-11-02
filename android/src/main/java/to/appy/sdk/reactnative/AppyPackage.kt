package to.appy.sdk.reactnative

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import to.appy.sdk.Appy

class AppyPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> =
    listOf(AppyActivityListener())
}

internal class AppyActivityListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    if (savedInstanceState == null) {
      Appy.handleIntent(activity.intent)
    }
  }

  override fun onNewIntent(intent: Intent): Boolean {
    Appy.handleIntent(intent)
    return false
  }
}
