// Everything is 1D (horizontal) in normalized coordinates 0..1.
export const near = (a, b, r) => Math.abs(a - b) < r;
export const inWindow = (obstacleX, playerX, from, to) => obstacleX - playerX >= from && obstacleX - playerX <= to;
