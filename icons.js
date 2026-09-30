// Icons for the content script and the popup, built with DOM APIs so no page policy
// (CSP, Trusted Types) can block them. Line icons come from Lucide (ISC license).
const ARCA_ICONS = {
  alert: [
    ["circle", { cx: 12, cy: 12, r: 10 }],
    ["line", { x1: 12, x2: 12, y1: 8, y2: 12 }],
    ["line", { x1: 12, x2: 12.01, y1: 16, y2: 16 }],
  ],
  check: [["path", { d: "M20 6 9 17l-5-5" }]],
  copy: [
    ["rect", { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }],
    ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }],
  ],
  key: [
    [
      "path",
      {
        d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
      },
    ],
    ["circle", { cx: 16.5, cy: 7.5, r: 0.5, fill: "currentColor" }],
  ],
  lock: [
    ["rect", { width: 18, height: 11, x: 3, y: 11, rx: 2, ry: 2 }],
    ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }],
  ],
  refresh: [
    ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }],
    ["path", { d: "M21 3v5h-5" }],
    ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }],
    ["path", { d: "M8 16H3v5" }],
  ],
  wand: [
    [
      "path",
      {
        d: "m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",
      },
    ],
    ["path", { d: "m14 7 3 3" }],
    ["path", { d: "M5 6v4" }],
    ["path", { d: "M19 14v4" }],
    ["path", { d: "M10 2v2" }],
    ["path", { d: "M7 8H3" }],
    ["path", { d: "M21 16h-4" }],
    ["path", { d: "M11 3H9" }],
  ],
};

// The app logo: an "A" whose counter is a keyhole.
const ARCA_LOGO = [
  [
    "defs",
    {},
    [
      [
        "linearGradient",
        { id: "arca-logo-bg", x1: 0, y1: 0, x2: 1, y2: 1 },
        [
          ["stop", { offset: 0, "stop-color": "#5b8cff" }],
          ["stop", { offset: 1, "stop-color": "#6a3ff2" }],
        ],
      ],
      [
        "mask",
        { id: "arca-logo-keyhole" },
        [
          ["rect", { width: 1024, height: 1024, fill: "#fff" }],
          ["circle", { cx: 512, cy: 548, r: 80, fill: "#000" }],
          ["path", { d: "M476 590L424 880H600L548 590Z", fill: "#000" }],
        ],
      ],
    ],
  ],
  ["rect", { width: 1024, height: 1024, rx: 224, fill: "url(#arca-logo-bg)" }],
  [
    "path",
    {
      d: "M512 206L784 796H240Z",
      fill: "#fff",
      stroke: "#fff",
      "stroke-width": 64,
      "stroke-linejoin": "round",
      mask: "url(#arca-logo-keyhole)",
    },
  ],
];

function arcaSvg(nodes, attributes) {
  const NS = "http://www.w3.org/2000/svg";
  const build = ([tag, attrs, children = []]) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    node.append(...children.map(build));
    return node;
  };
  return build(["svg", { "aria-hidden": "true", ...attributes }, nodes]);
}

function arcaIcon(name, size = 16) {
  return arcaSvg(ARCA_ICONS[name], {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
}

function arcaLogo(size = 20) {
  return arcaSvg(ARCA_LOGO, { viewBox: "0 0 1024 1024", width: size, height: size });
}
