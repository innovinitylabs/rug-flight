window.utils = {
  normalize: function (v, vmin, vmax, tmin, tmax) {
    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    return tmin + (pc * dt);
  },

  randomFromRange: function (min, max) {
    return min + Math.random() * (max - min);
  },

  randomOneOf: function (choices) {
    return choices[Math.floor(Math.random() * choices.length)];
  },

  collide: function (mesh1, mesh2, tolerance) {
    if (!mesh1 || !mesh2) return false;
    const diffPos = mesh1.position.clone().sub(mesh2.position.clone());
    return diffPos.length() < tolerance;
  }
};
