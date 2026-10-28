// One continuous coordinate drives the whole ribbon. Input changes its target,
// never restarts an easing curve or discards the velocity already on screen.
export function advanceAlbumMotion(state, seconds) {
  const omega = 13;
  const offset = state.position - state.target;
  const impulse = state.velocity + omega * offset;
  const decay = Math.exp(-omega * seconds);
  state.position = state.target + (offset + impulse * seconds) * decay;
  state.velocity = (state.velocity - omega * impulse * seconds) * decay;
  const settled = Math.abs(state.target - state.position) < 0.0003 && Math.abs(state.velocity) < 0.006;
  if (settled) {
    state.position = state.target;
    state.velocity = 0;
  }
  return settled;
}

const hermite = (t, a, b, startSlope, endSlope) => {
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * startSlope
    + (-2 * t3 + 3 * t2) * b + (t3 - t2) * endSlope;
};

function posture(a, emphasis = 1) {
  const pitch = a <= 1 ? hermite(a, 0, 34, 42, 20)
    : a <= 2 ? hermite(a - 1, 34, 46, 20, 6)
      : a <= 3 ? hermite(a - 2, 46, 50, 6, 2)
        : hermite(Math.min(a - 3, 1), 50, 51, 2, 0);
  const baseScale = a <= 1 ? hermite(a, 1, 0.84, 0, -0.18)
    : a <= 2 ? hermite(a - 1, 0.84, 0.67, -0.18, -0.16)
      : a <= 3 ? hermite(a - 2, 0.67, 0.52, -0.16, -0.14)
        : Math.max(0.38, 0.52 - (a - 3) * 0.14);
  const focus = Math.max(0, 1 - a * a) ** 2;
  return { pitch, scale: baseScale + (emphasis - 1) * focus, z: -30 * a * a + 18 * focus };
}

export function fitAlbumLayout({ width, height, maxCardWidth, captionHeight, above, below, perspective, emphasis = 1.55 }) {
  const gutter = Math.max(7, Math.min(16, height * 0.022));
  const padding = Math.max(8, Math.min(16, height * 0.02));
  const build = (cardWidth, focusScale = 1, spacing = gutter) => {
    const cardHeight = cardWidth * (215 / 460) + captionHeight;
    const travel = [0];
    const extents = [cardHeight * focusScale / 2 * perspective / (perspective - 18)];
    // Solve spacing in screen space, not world space. The tilted corners must
    // still have a visible gutter after perspective, depth and scale combine.
    for (let distance = 1; distance <= Math.max(3, above, below); distance++) {
      const pose = posture(distance, focusScale);
      const angle = pose.pitch * Math.PI / 180;
      const half = cardHeight * pose.scale / 2;
      const nearY = half * Math.cos(angle), nearZ = half * Math.sin(angle);
      const top = extents[distance - 1] + spacing;
      const offset = top * (perspective - pose.z - nearZ) / perspective + nearY;
      travel.push(offset);
      extents.push((offset + nearY) * perspective / (perspective - pose.z + nearZ));
    }
    const top = extents[above], bottom = extents[below];
    return {
      width, height, cardWidth, cardHeight, travel, perspective, gutter: spacing, emphasis: focusScale,
      centerX: width * 0.59,
      centerY: (height + top - bottom) / 2,
      span: top + bottom,
    };
  };
  let low = 64, high = maxCardWidth;
  for (let i = 0; i < 12; i++) {
    const middle = (low + high) / 2;
    if (build(middle).span <= height - 2 * padding) low = middle;
    else high = middle;
  }
  // Keep the established neighbor sizes. The hero expands towards the empty
  // upper-left area; outer cards may leave the viewport instead of shrinking it.
  const baseline = build(low);
  const focused = build(low, emphasis, gutter * 1.5);
  focused.centerX = baseline.centerX - baseline.cardWidth * (emphasis - 1) * 0.4;
  focused.centerY = baseline.centerY - baseline.cardHeight * (emphasis - 1) * 0.4;
  return focused;
}

export function albumPose(distance, layout) {
  const a = Math.abs(distance);
  const pose = posture(a, layout.emphasis);
  const stops = layout.travel;
  const gaps = stops.slice(1).map((stop, index) => stop - stops[index]);
  const slopes = [gaps[0], 2 * gaps[0] * gaps[1] / (gaps[0] + gaps[1]),
    2 * gaps[1] * gaps[2] / (gaps[1] + gaps[2]), gaps[2]];
  const segment = Math.min(2, Math.floor(a));
  const travel = a >= 3 ? stops[3] + (a - 3) * slopes[3]
    : hermite(a - segment, stops[segment], stops[segment + 1], slopes[segment], slopes[segment + 1]);
  return {
    x: layout.centerX - layout.cardWidth * 0.035 * distance * distance,
    y: layout.centerY + Math.sign(distance) * travel,
    z: pose.z,
    pitch: -Math.sign(distance) * pose.pitch,
    yaw: 0,
    scale: pose.scale,
    prominence: Math.exp(-0.035 * distance * distance),
  };
}

export function albumEdgeOpacity(distance, above, below) {
  const edge = Math.max(0, Math.min(1,
    distance < -above ? (-above - distance) * 2 : distance > below ? (distance - below) * 2 : 0,
  ));
  // Fade cards smoothly as they leave the visible stage; the flow itself stays finite.
  return 1 - edge ** 3 * (edge * (edge * 6 - 15) + 10);
}
