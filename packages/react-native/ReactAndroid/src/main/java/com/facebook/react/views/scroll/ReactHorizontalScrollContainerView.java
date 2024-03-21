/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll;

import android.content.Context;
import android.widget.HorizontalScrollView;
import androidx.core.view.ViewCompat;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.views.view.ReactViewGroup;

/** Container of Horizontal scrollViews that supports RTL scrolling. */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactHorizontalScrollContainerView extends ReactViewGroup {

  private int mLayoutDirection;
  private int mLastWidth = 0;
  private Listener rtlListener = null;

  public interface Listener {
    void onLayout();
  }

  public ReactHorizontalScrollContainerView(Context context) {
    super(context);
    mLayoutDirection =
        I18nUtil.getInstance().isRTL(context)
            ? ViewCompat.LAYOUT_DIRECTION_RTL
            : ViewCompat.LAYOUT_DIRECTION_LTR;
  }

  @Override
  public int getLayoutDirection() {
    if (ReactNativeFeatureFlags.setAndroidLayoutDirection()) {
      return super.getLayoutDirection();
    }
    return mLayoutDirection;
  }

  @Override
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    // Clipping doesn't work well for horizontal scroll views in RTL mode - in both
    // Fabric and non-Fabric - especially with TextInputs. The behavior you could see
    // is TextInputs being blurred immediately after being focused. So, for now,
    // it's easier to just disable this for these specific RTL views.
    // TODO T86027499: support `setRemoveClippedSubviews` in RTL mode
    if (getLayoutDirection() == LAYOUT_DIRECTION_RTL) {
      super.setRemoveClippedSubviews(false);
      return;
    }

    super.setRemoveClippedSubviews(removeClippedSubviews);
  }

  @Override
  protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
<<<<<<< HEAD
    if (getLayoutDirection() == LAYOUT_DIRECTION_RTL) {
||||||| parent of bdf88aef4db (Patches for TV for 0.73)
    if (mLayoutDirection == LAYOUT_DIRECTION_RTL) {
=======
    // This is to fix the overflowing (scaled) item being cropped
    final HorizontalScrollView parent = (HorizontalScrollView) getParent();
    parent.setClipChildren(false);
    this.setClipChildren(false);

    if (mLayoutDirection == LAYOUT_DIRECTION_RTL) {
>>>>>>> bdf88aef4db (Patches for TV for 0.73)
      // When the layout direction is RTL, we expect Yoga to give us a layout
      // that extends off the screen to the left so we re-center it with left=0
      int newLeft = 0;
      int width = right - left;
      int newRight = newLeft + width;
<<<<<<< HEAD
      setLeft(newLeft);
      setTop(top);
      setRight(newRight);
      setBottom(bottom);
||||||| parent of bdf88aef4db (Patches for TV for 0.73)
      setLeftTopRightBottom(newLeft, top, newRight, bottom);
=======
      setLeftTopRightBottom(newLeft, top, newRight, bottom);

      // Fix the ScrollX position when using RTL language accounting for the case when new
      // data is appended to the "end" (left) of the view (e.g. after fetching additional items)
      final int offsetX = this.getMeasuredWidth() - mLastWidth + parent.getScrollX();

      // Call with the present values in order to re-layout if necessary
      parent.scrollTo(offsetX, parent.getScrollY());
      mLastWidth = this.getMeasuredWidth();

      // Use the listener to adjust the scrollposition if new data was appended
      if (rtlListener != null) {
        rtlListener.onLayout();
      }
>>>>>>> bdf88aef4db (Patches for TV for 0.73)
    }
  }
  public int getLastWidth() {
    return mLastWidth;
  }

  public void setListener(Listener rtlListener) {
    this.rtlListener = rtlListener;
  }
}
