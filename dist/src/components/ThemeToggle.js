"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ThemeToggle;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
function ThemeToggle() {
    const [theme, setTheme] = (0, react_1.useState)('dark');
    (0, react_1.useEffect)(() => {
        const savedTheme = localStorage.getItem('theme');
        const currentTheme = savedTheme || document.documentElement.getAttribute('data-theme') || 'dark';
        setTheme(currentTheme);
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, []);
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };
    return ((0, jsx_runtime_1.jsxs)("button", { onClick: toggleTheme, className: "theme-toggle-btn", children: [theme === 'dark' ? (0, jsx_runtime_1.jsx)(lucide_react_1.Sun, { size: 14 }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Moon, { size: 14 }), (0, jsx_runtime_1.jsx)("span", { children: theme === 'dark' ? 'Light Mode' : 'Dark Mode' })] }));
}
