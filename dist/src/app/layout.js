"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const google_1 = require("next/font/google");
require("./globals.css");
const inter = (0, google_1.Inter)({ subsets: ["latin"] });
const outfit = (0, google_1.Outfit)({ subsets: ["latin"], variable: '--font-heading' });
exports.metadata = {
    title: "Conductor Platform | Perform Digital",
    description: "Enterprise Agentic Execution Platform",
};
function RootLayout({ children, }) {
    return ((0, jsx_runtime_1.jsx)("html", { lang: "en", "data-theme": "dark", children: (0, jsx_runtime_1.jsxs)("body", { className: `${inter.className} ${outfit.variable}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "noise-overlay" }), children] }) }));
}
