export interface AxisAlignedBodySnapshot {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  prevY: number;
  height: number;
  velocityY: number;
  deltaY: number;
  touchingDown: boolean;
  blockedDown: boolean;
  touchingUp: boolean;
  blockedUp: boolean;
}

export function computeCameraScrollX(
  _currentScrollX: number,
  marioX: number,
  triggerX: number,
  maxScrollX: number,
): number {
  return clamp(marioX - triggerX, 0, maxScrollX);
}

export function isStompCollision(
  marioBody: AxisAlignedBodySnapshot,
  enemyBody: AxisAlignedBodySnapshot,
): boolean {
  const horizontalOverlap = Math.min(marioBody.right, enemyBody.right) - Math.max(marioBody.left, enemyBody.left);
  const marioPrevBottom = marioBody.prevY + marioBody.height;
  const wasAboveOnPreviousFrame = marioPrevBottom <= enemyBody.prevY + 12;
  const footOverlap = Math.min(marioBody.right - 2, enemyBody.right) - Math.max(marioBody.left + 2, enemyBody.left);
  const centerWithinEnemy = marioBody.centerX >= enemyBody.left - 3 && marioBody.centerX <= enemyBody.right + 3;
  const thinEdgeOverlapFromAbove = horizontalOverlap >= 0.15 && wasAboveOnPreviousFrame;
  if (horizontalOverlap < 1 && !thinEdgeOverlapFromAbove) {
    return false;
  }
  if (footOverlap < 0.5 && !centerWithinEnemy && !thinEdgeOverlapFromAbove) {
    return false;
  }

  const verticalGap = marioBody.bottom - enemyBody.top;
  const nearTopNow = verticalGap <= 18;
  const marioMostlyAboveEnemy = marioBody.bottom <= enemyBody.centerY + 8;
  const notStronglyAscending = marioBody.velocityY >= -140;
  const descendingThisStep = marioBody.deltaY >= -3;

  const hasTopTouchingFlags =
    (marioBody.touchingDown || marioBody.blockedDown) && (enemyBody.touchingUp || enemyBody.blockedUp);

  return (
    marioMostlyAboveEnemy &&
    nearTopNow &&
    notStronglyAscending &&
    (hasTopTouchingFlags || wasAboveOnPreviousFrame || descendingThisStep)
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
